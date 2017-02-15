var path = require('path');
var async = require('async');
var _ = require('underscore');

module.exports = function PollModule(pb) {
  /**
   * Loads a single poll
   */
  var currentUrlForTopMenu = '/section/polls';
  //PB dependencies
  var util = pb.util;
  var BaseController = pb.BaseController;
  var TopMenu = pb.TopMenuService;
  var Comments = pb.CommentService;

  function OnePoll() {
    var PollService = require('./services/PollService.js')(pb);
    var ChannelService = require('./services/ChannelService.js')(pb);
    var ManuController = require('./manu.js')(pb);

    this.pollService = new PollService();
    this.channelService = new ChannelService();
    this.mediaService = new pb.MediaService();
    this.manuController = new ManuController();
  }

  util.inherits(OnePoll, pb.BaseController);

  OnePoll.prototype.render = function (cb) {
    var self = this;
    self.gatherData(function (err, data) {
      self.renderPoll(data, cb);
    });
  };

  OnePoll.prototype.getOnePoll = function (cb) {
    var self = this;
    var custUrl = self.pathVars.customUrl;
    self.pollService.pollQuestionsService.loadById(custUrl, cb);
  };

  OnePoll.prototype.getNavigation = function (cb) {
    var self = this;
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

  OnePoll.prototype.renderPoll = function (data, cb) {
    var self = this;
    var articleIndex = 0;
    var i = 0;

    var localAngularObject = {
      isDisabled: data.userAnswer ? true : false,
      isEdit: data.userAnswer ? false : true,
      choose: data.userAnswer ? data.userAnswer.choose : null,
      content: data.content,
      question: {
        _id: data.content._id.toJSON()
      },
      session: {
        user_id: self.session.authentication.user_id
      }
    };
    var angularObjects = pb.ClientJs.getAngularObjects(localAngularObject);

    self.ts.registerLocal('manu', data.manu);

    self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
    self.ts.registerLocal('navigation', new pb.TemplateValue(data.nav.navigation, false));
    self.ts.registerLocal('poll_subheading', data.content.title || '');
    self.ts.registerLocal('channel_thumbnail', data.thumbnail_info ? data.thumbnail_info.location : '');
    self.ts.registerLocal('channel_color', data.channel.bg_color ? data.channel.bg_color : '#4c76fe');
    self.ts.registerLocal('poll_content', new pb.TemplateValue(data.content.content, false));
    self.ts.registerLocal('article_index', articleIndex);

    self.channelService.getChennalById(data.content.channel, function (err, channel) {
    self.ts.registerLocal('channel_name', channel.name ? channel.name : '');

    self.ts.registerLocal('comments', function (flag, cb) {
        if (!data.content.allow_comments) {
          return cb(null, '');
    }

      self.renderComments(data.comments, {
        pollID: data.content._id.toJSON(),
        articleIndex: articleIndex,
        countComments: data.comments.length,
        contentSettings: data.contentSettings,
        content: data.content,
        channelColor: data.channel.bg_color
      }, self.ts, localAngularObject, function (err, comments) {
        cb(err, new pb.TemplateValue(comments, false));
      });
    });

      var output = {
        //specify the content here or when you declare the route
        content_type: 'text/html',
        code: 200
      };

      self.ts.load('one_poll', function (error, result) {
        output.content = result;
        cb(output);
      });
    });

  };
  OnePoll.prototype.renderComment = function (comment, contentSettings, cb) {
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

  OnePoll.prototype.renderComments = function (comments, extra, ts, localAngularObject, cb) {
    var self = this;
    var commentingUser = null;
    var sessionUserId = self.session.authentication.user_id;
    var pollID = extra.pollID;
    var articleIndex = extra.articleIndex;
    var countComments = extra.countComments;
    var contentSettings = extra.contentSettings;
    var channelColor = extra.channelColor;

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
    ts.registerLocal('channel_color', channelColor ? channelColor : '#4c76fe');
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
      articleID: pollID,
      articleIndex: articleIndex,
      countComments: countComments,
      comment_type: 'poll'
    }, localAngularObject || {}));

    ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));

    ts.load('elements/poll_comments', cb);
  };

  OnePoll.prototype.getCommentsPoll = function (idPoll, cb) {
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
      where: {$and: [{article: idPoll},{comment_type: 'poll'}]
      }
    };
    //attempt to load object
    dao.q('comment', opts, function (err, comments) {
      extendComments(err, comments, cb);
    });
  };

  OnePoll.prototype.gatherData = function (cb) {
    var self = this;
    var tasks = {
      //manu
      manu: function (callback) {
        self.manuController.getHtml(self.session, cb, callback);
      },
      //contentSettings
      settings: function (callback) {
        var contentService = new pb.ContentService();
        contentService.getSettings(function (err, contentSettings) {
          callback(err, contentSettings);
        });
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
      userAnswer: function (callback) {
        var userid = self.session.authentication.user_id;
        var custUrl = self.pathVars.customUrl;

        self.pollService.pollAnswersService.loadAnswerOfUser(userid, custUrl, function (err, data) {
          callback(err, data);
        });
      },
      content: function (callback) {
        self.getOnePoll(callback);
      },
      contentSettings: function (callback) {
        var contentService = new pb.ContentService();
        contentService.getSettings(function (err, contentSettings) {
          callback(err, contentSettings);
        });
      }
    };
    async.parallel(tasks, function (err, response) {
      var pollId = response.content._id.toJSON();
      var pollChannelId = response.content.channel;
      var allowComments = response.contentSettings.allow_comments;

      var tasks = {
        comments: function(callback) {
          if (!allowComments)
            callback(null, []);

          self.getCommentsPoll(pollId, function (err, comments) {
            callback(err, comments);
          });
        },
        channel: function (callback) {
          self.channelService.getChennalById(pollChannelId, function (err, channel) {
            callback(err, channel);
          });
        }
      };
      async.parallel(tasks, function (err, data) {
        response.comments = data.comments;
        response.channel = data.channel;

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

  OnePoll.getRoutes = function (cb) {
    var routes = [{
      method: 'get',
      path: "/polls/:customUrl",
      handler: 'render',
      auth_required: true,
      content_type: 'text/html'
    }];
    cb(null, routes);
  };

  //exports
  return OnePoll;

};
