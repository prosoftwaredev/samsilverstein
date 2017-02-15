//dependencies
var path = require('path');
var async = require('async');
module.exports = function MIndexModule(pb) {

//pb dependencies
  var util = pb.util;
  var TopMenu = pb.TopMenuService;
  var Comments = pb.CommentService;
  var ArticleService = pb.ArticleService;
  var ss_baseController = require('./baseController.js')(pb);
  var ChannelService = require('./services/ChannelService.js')(pb);
  var QuestionService = require('./services/QuestionService.js')(pb);
  var PollService = require('./services/PollService.js')(pb);
  var ManuController = require('./manu.js')(pb);
  var urlLoadPost = '/loadAllPost';

  var articleService = new ArticleService();
  var channelService = new ChannelService();
  var questionService = new QuestionService();
  var pollService = new PollService();
  var manuController = new ManuController();

  /**
   * Index page of the pencilblue theme
   */
  function MIndex() {
  }

  var getPageNumber = function (self) {
    var query = self.query;
    var pageNumber = undefined;
    if (query.page && pb.validation.isInt(query.page, true, false)) {
      return parseInt(query.page, 10) - 1;
    } else {
      return 0;
    }
  };

  util.inherits(MIndex, ss_baseController);

  MIndex.prototype.render = function (cb) {
    var self = this;
    //determine and execute the proper call

    var section = self.req.pencilblue_section || null;
    var topic = self.req.pencilblue_topic || null;
    var article = self.req.pencilblue_article || null;
    var page = self.req.pencilblue_page || null;
    var contentService = new pb.ContentService();

    contentService.getSettings(function (err, contentSettings) {
      self.gatherData({
          contentSettings: contentSettings
        },
        function (err, data) {

          var articleService = new pb.ArticleService();
          articleService.getMetaInfo(data.content[0], function (err, meta) {

            //manuController.getHtml(self.session, cb, function (err, cbFunctionRenderTemplate) {

            self.ts.registerLocal('manu', data.manu);

            self.ts.registerLocal('meta_keywords', meta.keywords);
            self.ts.registerLocal('meta_desc', data.section.description || meta.description);
            self.ts.registerLocal('meta_title', data.section.name || meta.title);
            self.ts.registerLocal('meta_thumbnail', meta.thumbnail);
            self.ts.registerLocal('meta_lang', localizationLanguage);
            self.ts.registerLocal('current_url', self.req.url);
            self.ts.registerLocal('navigation', new pb.TemplateValue(data.nav.navigation, false));
            self.ts.registerLocal('account_buttons', new pb.TemplateValue(data.nav.accountButtons, false));

            //self.ts.registerLocal('infinite_scroll', function (flag, cb) {
            //  if (article || page) {
            //    cb(null, '');
            //  }
            //  else {
            //    var infiniteScrollScript = pb.ClientJs.includeJS(
            //      '/js/infinite_article_scroll.js');
            //    if (section) {
            //      infiniteScrollScript += pb.ClientJs.getJSTag(
            //        'var infiniteScrollSection = "' + section + '";');
            //    }
            //    else if (topic) {
            //      infiniteScrollScript += pb.ClientJs.getJSTag(
            //        'var infiniteScrollTopic = "' + topic + '";');
            //    }
            //
            //    var val = new pb.TemplateValue(infiniteScrollScript, false);
            //    cb(null, val);
            //  }
            //});

            self.ts.registerLocal('articles', function (flag, cb) {

              var tasks = util.getTasks(data.content, function (content, i) {
                return function (callback) {
                  if (i >= contentSettings.articles_per_page) {//TODO, limit articles in query, not through hackery
                    callback(null, '');
                    return;
                  }
                  //don't render drafts for users
                  if (content[i].draft === 1) {
                    callback(null, '');
                    return;
                  }
                  self.renderAllContent(content[i], contentSettings,
                    data.nav.themeSettings, i, callback);
                };
              });

              async.parallel(tasks, function (err, result) {
                cb(err, new pb.TemplateValue(result.join(''), false));
              });

            });

            self.ts.registerLocal('page_name', function (flag, cb) {
              var content = data.content.length > 0 ? data.content[0] : null;
              self.getContentSpecificPageName(content, cb);
            });

            var geturlLoadPost = urlLoadPost;
            if (self.pathVars.customUrl) {
              geturlLoadPost = urlLoadPost + '/customUrl/' + self.pathVars.customUrl + '/page';
            }

            var angularObjects = pb.ClientJs.getAngularObjects({
              startNumberPage: getPageNumber(self) + 2,
              urlLoadPost: geturlLoadPost
            });

            self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));

            //self.ts.registerLocal('angular', function (flag, cb) {
            //  var objects = {
            //    trustHTML: 'function(string){return $sce.trustAsHtml(string);}'
            //  };
            //  var angularData =
            //    pb.ClientJs.getAngularController(objects, ['ngSanitize']);
            //  cb(null, angularData);
            //});

            self.getTemplate(data.content, function (err, template) {
              if (util.isError(err)) {
                throw err;
              }

              self.ts.load(template, function (err, result) {
                if (util.isError(err)) {
                  throw err;
                }

                cb({
                  content: result
                });
              });
            });

          });

        });
      //});
    });
  };

  MIndex.prototype.getTemplate = function (content, cb) {

    //check if we should just use whatever default there is.
    //this could fall back to an active theme or the default pencilblue theme.
    if (!this.req.pencilblue_article && !this.req.pencilblue_page) {
      cb(null, this.getDefaultTemplatePath());
      return;
    }

    //now we are dealing with a single page or article. the template will be
    //judged based off the article's preference.
    if (util.isArray(content) && content.length > 0) {
      content = content[0];
    }
    var uidAndTemplate = content.template;
    //when no template is specified or is empty we no that the article has no
    //preference and we can fall back on the default (index).  We depend on the
    //template service to determine who has priority based on the active theme
    //then defaulting back to pencilblue.
    if (!pb.validation.validateNonEmptyStr(uidAndTemplate, true)) {
      var defautTemplatePath = this.getDefaultTemplatePath();
      pb.log.silly("ContentController: No template specified, defaulting to %s.",
        defautTemplatePath);
      cb(null, defautTemplatePath);
      return;
    }

    //we now know that the template was specified.  We have to split the value
    //to extract the intended theme and the template path
    var pieces = uidAndTemplate.split('|');
    //for backward compatibility we let the template service determine where to
    //find the template when no template is specified.  This mostly catches the
    //default case of "index"
    if (pieces.length === 1) {

      pb.log.silly(
        "ContentController: No theme specified, Template Service will delegate [%s]",
        pieces[0]);
      cb(null, pieces[0]);
      return;
    }
    else if (pieces.length <= 0) {

      //shit's broke. This should never be the case but better safe than sorry
      cb(new Error(
          "The content's template property provided an invalid value of [" + content.template + ']'),
        null);
      return;
    }

    //the theme is specified, we ensure that the theme is installed and
    //initialized otherwise we let the template service figure out how to
    //delegate.
    if (!pb.PluginService.isActivePlugin(pieces[0])) {
      pb.log.silly(
        "ContentController: Theme [%s] is not active, Template Service will delegate [%s]",
        pieces[0], pieces[1]);
      cb(null, pieces[1]);
      return;
    }

    //the theme is OK. We don't gaurantee that the template is on the disk but we can testify that it SHOULD.  We set the
    //prioritized theme for the template service.
    pb.log.silly("ContentController: Prioritizing Theme [%s] for template [%s]", pieces[0],
      pieces[1]);
    this.ts.setTheme(pieces[0]);
    cb(null, pieces[1]);
  };

  MIndex.prototype.getDefaultTemplatePath = function () {
    return 'index';
  };

  MIndex.prototype.gatherData = function (opt, cb) {
    var self = this;
    var query = this.query;
    //determine and execute the proper call
    var pageNumber = getPageNumber(self);

    var tasks = {
      //manu
      manu: function (callback) {
        manuController.getHtml(self.session, cb, callback);
      },
      //navigation
      nav: function (callback) {
        self.getNavigation(function (themeSettings, navigation, accountButtons) {
          callback(null, {
            themeSettings: themeSettings,
            navigation: navigation,
            accountButtons: accountButtons
          });
        });
      },
      //articles, pages, etc.
      content: function (callback) {
        self.loadContent({
            sectionName: self.pathVars.customUrl || null,
            userId: (self.session.authentication.user_id) ? (self.session.authentication.user._id.toString()) : null,
            limit: opt.contentSettings.articles_per_page,
            offset: opt.contentSettings.articles_per_page * pageNumber
          },
          callback);
      },
      section: function (callback) {
        if (!self.req.pencilblue_section) {
          callback(null, {});
          return;
        }

        var dao = new pb.DAO();
        dao.loadById(self.req.pencilblue_section, 'section', callback);
      }
    };
    async.parallel(tasks, function (err, data) {
      cb(err, data);
    });
  };

  MIndex.prototype.isAccessToArticle = function (article) {
    var curentUser = this.session.authentication.user;
  };

  MIndex.prototype.loadContent = function (options, contentCallback) {
    var AllContentService = require('./services/AllContentService.js')(pb);
    var allContentService = new AllContentService();
    allContentService.loadContent(options, contentCallback);
  };

  MIndex.prototype.renderAllContent = function (content, contentSettings, themeSettings, index, cb) {
    var self = this;
    if (self.isArticle(content)) {
      self.renderArticle(content, contentSettings, themeSettings, index, cb);
    } else if (self.isQuestion(content)) {
      self.renderQuestion(content, contentSettings, themeSettings, index, cb);
    } else if (self.isPoll(content)) {
      self.renderPoll(content, contentSettings, themeSettings, index, cb);
    }
  };

  MIndex.prototype.renderArticle = function (content, contentSettings, themeSettings, index, cb) {
    var self = this;
    var isPage = content.object_type === 'page';
    var showByLine = contentSettings.display_bylines && !isPage;
    var showTimestamp = contentSettings.display_timestamp && !isPage;
    var ats = new pb.TemplateService(this.ls);
    var contentUrlPrefix = isPage ? '/page/' : '/article/';
    self.ts.reprocess = false;
    ats.registerLocal('channel_bg_color', content.channel_desctiprion.bg_color);

    ats.registerLocal('channel_bg_image', channelService.renderBgImg(content.channel_desctiprion));

    ats.registerLocal('article_permalink', pb.UrlService.urlJoin(pb.config.siteRoot, contentUrlPrefix, content.url));
    ats.registerLocal('article_headline', new pb.TemplateValue('<a href="' + pb.UrlService.urlJoin(contentUrlPrefix, content.url) + '">' + content.headline + '</a>', false));
    ats.registerLocal('article_headline_nolink', content.headline);
    ats.registerLocal('article_headline', content.headline ? content.headline : '');
    ats.registerLocal('article_subheading', content.subheading ? content.subheading : '');
	ats.registerLocal('article_author_title', content.author_title ? content.author_title : '');
    ats.registerLocal('article_subheading_display', content.subheading ? '' : 'display:none;');
    ats.registerLocal('article_id', content[pb.DAO.getIdField()].toString());
    ats.registerLocal('article_index', index);
    ats.registerLocal('article_timestamp', showTimestamp && content.publish_date
        ? pb.ContentService.getTimestampTextFromSettings(
        content.publish_date,
        contentSettings
    ) : '');
    ats.registerLocal('article_timestamp_display', showTimestamp ? '' : 'display:none;');
    ats.registerLocal('article_layout', new pb.TemplateValue(content.layout, false));
    ats.registerLocal('article_url', content.url);
    ats.registerLocal('article_name', content.section_description.length ? content.section_description[0].name : '');
    ats.registerLocal('display_byline', showByLine ? '' : 'display:none;');
    ats.registerLocal('author_photo', content.author_photo ? content.author_photo : '');
    ats.registerLocal('author_photo_display', content.author_photo ? '' : 'display:none;');
    ats.registerLocal('author_name', content.author_name ? content.author_name : '');
    ats.registerLocal('author_position', content.author_position ? content.author_position : '');
    ats.registerLocal('channel_thumbnail_url', content.channel_desctiprion.thumbnail_details ? content.channel_desctiprion.thumbnail_details.location : '');
    ats.registerLocal('media_body_style', content.media_body_style ? content.media_body_style : '');
    var section_list = '';
    for (var i = 0; content.section_description.length > i; i++) {
      section_list += content.section_description[i].name + ' ';
    }
    ats.registerLocal('article_section_name', section_list);
    ats.registerLocal('content_channel_name', content.channel_desctiprion.name);
    ats.registerLocal('comments', function (flag, cb) {
      if (isPage || !pb.ArticleService.allowComments(contentSettings, content)) {
        return cb(null, '');
      }

      self.renderComments(content, ats, function (err, comments) {
        cb(err, new pb.TemplateValue(comments, false));
      });
    });

    ats.load('elements/article', cb);
  };

  MIndex.prototype.renderQuestion = function (content, contentSettings, themeSettings, index, cb) {
    var self = this;
    var isPage = content.object_type === 'page';
    var showByLine = contentSettings.display_bylines && !isPage;
    var showTimestamp = contentSettings.display_timestamp && !isPage;
    var ats = new pb.TemplateService(this.ls);
    var contentUrlPrefix = isPage ? '/page/' : '/questions/';
    self.ts.reprocess = false;
    ats.registerLocal('channel_bg_color', content.channel_desctiprion.bg_color);

    ats.registerLocal('channel_bg_image', channelService.renderBgImg(content.channel_desctiprion));

    ats.registerLocal('question_permalink', pb.UrlService.urlJoin(pb.config.siteRoot, contentUrlPrefix, content._id.toJSON()));
    ats.registerLocal('question_subheading', content.name ? content.name : '');
    ats.registerLocal('question_channel_name', content.channel_desctiprion.name);
    ats.registerLocal('question_timestamp', showTimestamp && content.created ? pb.ContentService.getTimestampTextFromSettings(content.created, contentSettings) : '');
    var section_list = '';
    for (var i = 0; content.section_description.length > i; i++) {
      section_list += content.section_description[i].name + ' ';
    }
    ats.registerLocal('question_channel', section_list);
    ats.registerLocal('channel_thumbnail_url', content.channel_desctiprion.thumbnail_details.location ? content.channel_desctiprion.thumbnail_details.location : '');
    ats.registerLocal('comments', function (flag, cb) {
      if (isPage || !pb.ArticleService.allowComments(contentSettings, content)) {
        return cb(null, '');
      }

      self.renderComments(content, ats, function (err, comments) {
        cb(err, new pb.TemplateValue(comments, false));
      });
    });
    ats.load('elements/question', cb);
  };

  MIndex.prototype.renderQuestion = function (content, contentSettings, themeSettings, index, cb) {
    var self = this;
    var isPage = content.object_type === 'page';
    var showByLine = contentSettings.display_bylines && !isPage;
    var showTimestamp = contentSettings.display_timestamp && !isPage;
    var ats = new pb.TemplateService(this.ls);
    var contentUrlPrefix = isPage ? '/page/' : '/questions/';
    self.ts.reprocess = false;
    ats.registerLocal('channel_bg_color', content.channel_desctiprion.bg_color);
    ats.registerLocal('channel_bg_image', channelService.renderBgImg(content.channel_desctiprion));
    ats.registerLocal('question_permalink', pb.UrlService.urlJoin(pb.config.siteRoot, contentUrlPrefix, content._id.toJSON()));
    ats.registerLocal('question_subheading', content.name ? content.name : '');
	ats.registerLocal('question_author_title', content.author_title ? content.author_title : '');
    ats.registerLocal('question_timestamp', showTimestamp && content.publish_date ? pb.ContentService.getTimestampTextFromSettings(content.publish_date, contentSettings) : '');
    var section_list = '';
    for (var i = 0; content.section_description.length > i; i++) {
      section_list += content.section_description[i].name + ' ';
    }
    ats.registerLocal('question_channel', section_list);
    ats.registerLocal('question_channel_name', content.channel_desctiprion.name);
    ats.registerLocal('channel_thumbnail_url', content.channel_desctiprion.thumbnail_details ? content.channel_desctiprion.thumbnail_details.location : '');
    ats.registerLocal('comments', function (flag, cb) {
      if (isPage || !pb.ArticleService.allowComments(contentSettings, content)) {
        return cb(null, '');
      }

      self.renderComments(content, ats, function (err, comments) {
        cb(err, new pb.TemplateValue(comments, false));
      });
    });
    ats.load('elements/question', cb);
  };

  MIndex.prototype.renderPoll = function (content, contentSettings, themeSettings, index, cb) {
    var self = this;
    var isPage = content.object_type === 'page';
    var showByLine = contentSettings.display_bylines && !isPage;
    var showTimestamp = contentSettings.display_timestamp && !isPage;
    var ats = new pb.TemplateService(this.ls);
    var contentUrlPrefix = isPage ? '/page/' : '/polls/';
    self.ts.reprocess = false;
    var section_list = '';
    for (var i = 0; content.section_description.length > i; i++) {
      section_list += content.section_description[i].name + ' ';
    }
    ats.registerLocal('poll_thumbnail_url', content.channel_desctiprion.thumbnail_details ? content.channel_desctiprion.thumbnail_details.location : '');
    ats.registerLocal('channel_bg_color', content.channel_desctiprion.bg_color);
    ats.registerLocal('channel_bg_image', channelService.renderBgImg(content.channel_desctiprion));
    ats.registerLocal('poll_subheading', content.title ? content.title : '');
	ats.registerLocal('poll_author_title', content.author_title ? content.author_title : '');
    ats.registerLocal('poll_channel', section_list);
    ats.registerLocal('poll_permalink', pb.UrlService.urlJoin(pb.config.siteRoot,
      contentUrlPrefix, content._id.toJSON()));
    ats.registerLocal('poll_channel_name', content.channel_desctiprion.name);
    ats.registerLocal('poll_timestamp', showTimestamp && content.publish_date
      ? pb.ContentService.getTimestampTextFromSettings(
      content.publish_date,
      contentSettings
    ) : '');
    var commentingUser = null;
    if (pb.security.isAuthenticated(this.session)) {
      commentingUser = Comments.getCommentingUser(this.session.authentication.user);
    }

    ats.load('elements/poll', cb);
  };

  //MIndex.prototype.renderComment = function (comment, cb) {
  //  var cts = new pb.TemplateService(this.ls);
  //  cts.reprocess = false;
  //  cts.registerLocal('commenter_photo', comment.commenter_photo ? comment.commenter_photo
  //    : '');
  //  cts.registerLocal('display_photo', comment.commenter_photo ? 'block' : 'none');
  //  cts.registerLocal('commenter_name', comment.commenter_name);
  //  cts.registerLocal('commenter_position', comment.commenter_position
  //    ? ', ' + comment.commenter_position : '');
  //  cts.registerLocal('content', comment.content);
  //  cts.registerLocal('timestamp', comment.timestamp);
  //  cts.load('elements/comments/comment', cb);
  //};

  MIndex.prototype.getContentSpecificPageName = function (content, cb) {
    if (!content) {
      cb(null, pb.config.siteName);
      return;
    }

    if (this.req.pencilblue_article || this.req.pencilblue_page) {
      cb(null, content.headline + ' | ' + pb.config.siteName);
    }
    else if (this.req.pencilblue_section || this.req.pencilblue_topic) {

      var objType = this.req.pencilblue_section ? 'section' : 'topic';
      var dao = new pb.DAO();
      dao.loadById(this.req.pencilblue_section, objType, function (err, obj) {
        if (util.isError(err) || obj === null) {
          cb(null, pb.config.siteName);
          return;
        }

        cb(null, obj.name + ' | ' + pb.config.siteName);
      });
    }
    else {
      cb(null, pb.config.siteName);
    }
  };

  MIndex.prototype.getNavigation = function (cb) {
    var options = {
      currUrl: this.req.url
    };
    TopMenu.getTopMenu(this.session, this.ls, options, function (themeSettings, navigation,
      accountButtons) {
      TopMenu.getBootstrapNav(navigation, accountButtons, function (navigation,
        accountButtons) {
        cb(themeSettings, navigation, accountButtons);
      });
    });
  };

  MIndex.prototype.loadAjaxJson = function (self, cb) {
    var section = self.req.pencilblue_section || null;
    var topic = self.req.pencilblue_topic || null;
    var article = self.req.pencilblue_article || null;
    var page = self.req.pencilblue_page || null;
    var contentService = new pb.ContentService();

    contentService.getSettings(function (err, contentSettings) {

      self.gatherData({
          contentSettings: contentSettings
        },
        function (err, data) {

          var articleService = new pb.ArticleService();
          articleService.getMetaInfo(data.content[0], function (err, meta) {

            var tasks = util.getTasks(data.content, function (content, i) {
              return function (callback) {
                if (i >= contentSettings.articles_per_page) {//TODO, limit articles in query, not through hackery
                  callback(null, '');
                  return;
                }
                self.renderAllContent(content[i], contentSettings,
                  data.nav.themeSettings, i, callback);
              };
            });

            async.parallel(tasks, function (err, result) {

              cb({
                content: result.join('')
              });

              //cb({
              //  content: JSON.stringify(result),
              //  content_type: 'application/json'
              //});
            });

          });
        });
    });
  }

  MIndex.prototype.loadAllPost = function (cb) {
    var self = this;
    self.query.page = self.pathVars.page;
    //determine and execute the proper call
    self.loadAjaxJson(self, cb);
  }

  MIndex.prototype.loadSectionPost = function (cb) {
    var self = this;
    self.query.page = self.pathVars.page;
    //determine and execute the proper call

    self.loadAjaxJson(self, cb);
  }

  MIndex.getRoutes = function (cb) {
    var routes = [
      {
        method: 'get',
        path: "/",
        handler: 'render',
        access_level: 0,
        auth_required: true,
        content_type: 'text/html'
      },
      {
        method: 'get',
        path: "/section/:customUrl",
        handler: 'render',
        access_level: 0,
        auth_required: true,
        content_type: 'text/html'
      }, {
        method: 'post',
        path: urlLoadPost + "/:page",
        handler: 'loadAllPost',
        access_level: 0,
        auth_required: true,
        content_type: 'text/html'
      },
      {
        method: 'post',
        path: urlLoadPost + "/customUrl/:customUrl/page/:page/",
        handler: 'loadSectionPost',
        access_level: 0,
        auth_required: true,
        content_type: 'text/html'
      }];
    cb(null, routes);
  };
  //exports
  return MIndex;
};
