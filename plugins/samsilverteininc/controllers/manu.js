var async = require('async');

module.exports = function (pb) {

  //PB dependencies
  var util = pb.util;
  var BaseController = pb.BaseController;
  var TopMenu = pb.TopMenuService;

  // Instantiate the controller & extend the base controller
  function ManuController() {
    var ChannelService = require('./services/ChannelService.js')(pb);

    this.channelService = new ChannelService();
  }

  util.inherits(ManuController, pb.BaseController);

  ManuController.prototype.getHtml = function (session, cb, callback) {
    var self = this;
    var contentService = new pb.ContentService();

    contentService.getSettings(function (err, contentSettings) {
      self.gatherData(session, function (err, data) {

        callback(null, function (flag, cb) {

          var tasks = util.getTasks(data.content.channels, function (content, i) {
            return function (callback) {
              if (i >= contentSettings.articles_per_page) {//TODO, limit articles in query, not through hackery
                callback(null, '');
                return;
              }
              self.renderContent(content[i], contentSettings, i, callback);
            };
          });

          async.parallel(tasks, function (err, result) {
            cb(err, new pb.TemplateValue(result.join(''), false));
          });

        });

      });
    });
  };

  ManuController.prototype.renderContent = function (content, contentSettings, index, cb) {
    var self = this;

    var isPage = content.object_type === 'page';
    var showByLine = contentSettings.display_bylines && !isPage;
    var showTimestamp = contentSettings.display_timestamp && !isPage;
    var ats = new pb.TemplateService(this.ls);
    var contentUrlPrefix = isPage ? '/page/' : '/questions/';

    ats.registerLocal('channel_permalink', pb.UrlService.urlJoin(pb.config.siteRoot,
      contentUrlPrefix, content._id.toJSON()));

    ats.registerLocal('channel_subheading', content.name ? content.name : '');
    ats.registerLocal('channel_id', content._id ? content._id.toString() : '');
    ats.registerLocal('channel_thumbnail_url', content.thumbnail_details ? content.thumbnail_details.location : '');

    ats.load('elements/channels/channel', cb);
  };

  ManuController.prototype.gatherData = function (session, cb) {
    var self = this;
    var tasks = {
      //articles, pages, etc.
      content: function (callback) {
        self.loadContent(session, function (err, data) {
          callback(err, data);
        });
      }
    };
    async.parallel(tasks, cb);
  };

  ManuController.prototype.loadContent = function (session, callback) {
    var self = this;

    if (session.authentication.user_id) {
      var uidSessionUser = session.authentication.user._id.toJSON();

      var contentService = new pb.ContentService();
      contentService.getSettings(function (err, contentSettings) {

        self.channelService.getChannelsForUserById(uidSessionUser, function (err, chennals) {
          (function (chennals, exCallback) {
            self.mediaService = new pb.MediaService();

            var tasks = util.getTasks(chennals, function (content, i) {
              return function (callback) {
                content[i].thumbnail_details = null;
                if (i >= contentSettings.articles_per_page) {//TODO, limit articles in query, not through hackery
                  callback(null, '');
                  return;
                }
                if ('thumbnail' in content[i] && content[i] == '') {
                  callback(err, chennals[i]);
                }

                self.mediaService.loadById(content[i].thumbnail, function (err, data) {
                  chennals[i].thumbnail_details = data;
                  callback(err, chennals[i]);
                });
              };
            });

            async.parallel(tasks, function (err, result) {
              exCallback(err, result);
            });

          })(chennals, function (err, chennals) {
            callback(err, {
              channels: chennals
            });
          });

        });
      });
    } else {
      return callback(null, {
        channels: []
      });
    }
  };

  ManuController.getRoutes = function (cb) {
    var routes = [];
    cb(null, routes);
  };

  return ManuController;
};