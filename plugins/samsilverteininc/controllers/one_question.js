var async = require('async');
var _ = require('underscore');

module.exports = function QuestionModule(pb) {

  //pb dependencies
  var util = pb.util;
  var currentUrlForTopMenu = '/section/questions';
  var Questions = require('./questions.js')(pb);
  var ManuController = require('./manu.js')(pb);
  var Comments = pb.CommentService;

  var TopMenu = pb.TopMenuService;
  var manuController = new ManuController();
  /**
   * Loads a single article
   */
  function Question() {
    var QuestionService = require('./services/QuestionService.js')(pb);

    this.questionService = new QuestionService();
    this.mediaService = new pb.MediaService();
  }

  util.inherits(Question, Questions);

  Question.prototype.render = function (cb) {
    var self = this;
    self.renderQuestion(cb);
    var ChannelService = require('./services/ChannelService.js')(pb);
    this.channelService = new ChannelService();

  };

  Question.prototype.getOneQuestion = function (cb) {
    var self = this;
    var where = null;
    var custUrl = self.pathVars.customUrl;
    self.questionService.getQuestionByCustUrl(custUrl, cb);
  };

  Question.prototype.getNavigation = function (cb) {
    var options = {
      currUrl: currentUrlForTopMenu //this.req.url
    };
    TopMenu.getTopMenu(this.session, this.ls, options, function (themeSettings, navigation,
      accountButtons) {
      TopMenu.getBootstrapNav(navigation, accountButtons, function (navigation,
        accountButtons) {
        cb(themeSettings, navigation, accountButtons);
      });
    });
  };

  Question.prototype.renderQuestion = function (cb) {
    var self = this;
    var articleIndex = 0;
    var contentService = new pb.ContentService();

    contentService.getSettings(function (err, contentSettings) {
      self.gatherData(function (err, data) {

        var noAnswered = (data.answerOfUser) ? false : true;
        var answered = (data.answerOfUser) ? data.answerOfUser : false;

        var localAngularObject = {
          question: {
            _id: data.content._id.toJSON()
          },
          noAnswered: noAnswered,
          answered: answered,
          session: {
            user_id: self.session.authentication.user_id
          }
        };

        var angularObjects = pb.ClientJs.getAngularObjects(localAngularObject);

        self.ts.registerLocal('manu', data.manu);

        self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));

        self.ts.registerLocal('navigation', new pb.TemplateValue(data.nav.navigation, false));
        self.ts.registerLocal('question_subheading', data.content.name || '');
        self.ts.registerLocal('channel_thumbnail', data.thumbnail_info ? data.thumbnail_info.location : '');
        self.ts.registerLocal('channel_color', data.channel.bg_color ? data.channel.bg_color : '#4c76fe');
        self.ts.registerLocal('article_index', articleIndex);

        self.ts.registerLocal('question_message', new pb.TemplateValue(
          data.content.question_layout, false));

        self.channelService.getChennalById(data.content.channel, function (err, channel) {

        self.ts.registerLocal('channel_name', channel.name ? channel.name : '');

        self.ts.registerLocal('comments', function (flag, cb) {
            if (!data.content.allow_comments) {
              return cb(null, '');
        }

         self.renderComments(data.comments, {
              questionID: data.content._id.toJSON(),
              articleIndex: articleIndex,
              countComments: data.comments.length,
              contentSettings: data.contentSettings,
              content: data.content
         }, self.ts, localAngularObject, function (err, comments) {
              cb(err, new pb.TemplateValue(comments, false));
            });
         });

          var output = {
            //specify the content here or when you declare the route
            content_type: 'text/html',
            code: 200
          };
          self.ts.load('one_question', function (error, result) {
            output.content = result;
            cb(output);
          });
        });

      });
    });
  };

  Question.prototype.renderComment = function (comment, contentSettings, cb) {
    var self = this;
    var cts = new pb.TemplateService(self.ls);
    var showTimestamp = contentSettings.display_timestamp;

    cts.reprocess = false;

    cts.registerLocal('commenter_photo', comment.commenter_photo ? comment.commenter_photo : '');
    cts.registerLocal('display_photo', comment.commenter_photo ? 'block' : 'none');
    cts.registerLocal('commenter_name', comment.commenter_detail.username || '');
    cts.registerLocal('commenter_position', comment.commenter_position ? ', ' + comment.commenter_position : '');
    cts.registerLocal('content', comment.content);
    //cts.registerLocal('timestamp', comment.last_modified || '');
    cts.registerLocal('timestamp', showTimestamp && comment.last_modified
        ? pb.ContentService.getTimestampTextFromSettings(
        comment.last_modified,
        contentSettings
    ) : '');

    cts.load('elements/comments/comment_s1', cb);
  };

  Question.prototype.renderComments = function (comments, extra, ts, localAngularObject, cb) {
    var self = this;
    var commentingUser = null;
    var sessionUserId = self.session.authentication.user_id;
    var questionID = extra.questionID;
    var articleIndex = extra.articleIndex;
    var countComments = extra.countComments;
    var contentSettings = extra.contentSettings;

    if (pb.security.isAuthenticated(self.session)) {
      commentingUser = Comments.getCommentingUser(this.session.authentication.user);
    }

    ts.registerLocal('user_photo', function (flag, cb) {
      if (commentingUser) {
        cb(null, commentingUser.photo ? commentingUser.photo : '');
      }
      else {
        cb(null, '');
      }
    });
    ts.registerLocal('user_position', function (flag, cb) {
      if (commentingUser && util.isArray(commentingUser.position) && commentingUser.position.length > 0) {
        cb(null, ', ' + commentingUser.position);
      }
      else {
        cb(null, '');
      }
    });
    ts.registerLocal('user_name', commentingUser ? commentingUser.name : '');
    ts.registerLocal('display_submit', commentingUser ? 'block' : 'none');
    ts.registerLocal('display_login', commentingUser ? 'none' : 'block');
    ts.registerLocal('comments_length', util.isArray(comments) ? comments.length : 0);
    ts.registerLocal('individual_comments', function (flag, cb) {
      if (!util.isArray(comments) || comments.length == 0) {
        cb(null, '');
        return;
      }

      var tasks = util.getTasks(comments, function (comments, i) {
        return function (callback) {
          self.renderComment(comments[i], contentSettings, callback);
        };
      });
      async.parallel(tasks, function (err, results) {
        cb(err, new pb.TemplateValue(results.join(''), false));
      });
    });

    var angularObjects = pb.ClientJs.getAngularObjects(_.extend({
      formData: {},
      theAuthorOfTheNewComment: sessionUserId,
      articleID: questionID,
      articleIndex: articleIndex,
      countComments: countComments,
      comment_type: 'question'
    }, localAngularObject || {}));

    ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));

    ts.load('elements/question_comments', cb);
  };

  Question.prototype.getCommentsQuestion = function (idQuestion, cb) {
    var self = this;
    var where = null;
    var dao = new pb.DAO();

    var extendComments = function (err, comments, pCallback) {
      var i = 0, idObsUser = [];

      var tasks = {
        allComenters: function (callback) {
          where = {
            _id: {
              $in: idObsUser
            }
          };
          dao.q('user', where, function (err, commenters) {
            callback(err, commenters);
          });
        }
      };

      for (i = 0; comments.length > i; i++) {
        idObsUser.push(pb.DAO.getObjectId(comments[i].commenter));
      }

      async.parallel(tasks, function (err, response) {
        var i = 0, c = 0;

        for (i = 0; comments.length > i; i++) {
          for (c = 0; response.allComenters.length > c; c++) {
            if (comments[i].commenter == response.allComenters[c]._id.toJSON())
              comments[i].commenter_detail = response.allComenters[c];
          }
        }

        pCallback(err, comments);
      });
    };

    var opts = {
      where: {$and: [{article: idQuestion},{comment_type: 'question'}]
      }
    };
    //attempt to load object
    dao.q('comment', opts, function (err, comments) {
      extendComments(err, comments, cb);
    });
  };

  Question.prototype.gatherData = function (cb) {
    var self = this;
    var tasks = {
      //menu
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
      content: function (callback) {
        self.getOneQuestion(callback);
      },
      answerOfUser: function (callback) {
        var custUrl = self.pathVars.customUrl;
        self.questionService.getAnswerOfUser(custUrl, self.session.authentication.user_id, callback);
      },
      contentSettings: function (callback) {
        var contentService = new pb.ContentService();
        contentService.getSettings(function (err, contentSettings) {
          callback(err, contentSettings);
        });
      }
    };

    async.parallel(tasks, function (err, response) {
      var questionChannelId = response.content.channel;
      var questionId = response.content._id.toJSON();
      var allowComments = response.contentSettings.allow_comments;

      var tasks = {
        channel: function (callback) {
          self.channelService.getChennalById(questionChannelId, function (err, channel) {
            callback(err, channel);
          });
        },
        comments: function(callback) {
          if (!allowComments)
            callback(null, []);

          self.getCommentsQuestion(questionId, function (err, comments) {
            callback(err, comments);
          });
        }
      };
      async.parallel(tasks, function (err, data) {
        response.channel = data.channel;
        response.comments = data.comments;
        var tasks = {
          thumbnail_info: function (callback) {
            self.mediaService.loadById(response.channel.thumbnail, function (err, media) {
              callback(err, media);
            });
          }
        };
        async.parallel(tasks, function (err, data) {
          response.thumbnail_info = data.thumbnail_info;
          cb(err, response);
        });
      });

    });
  };

  Question.getRoutes = function (cb) {
    var routes = [{
        method: 'get',
        path: "/questions/:customUrl",
        handler: 'render',
        auth_required: true,
        content_type: 'text/html'
      }];
    cb(null, routes);
  };

  //exports
  return Question;
};
