/* !! no used */

var async = require('async');

module.exports = function (pb) {

  //PB dependencies
  var util = pb.util;
  var BaseController = pb.BaseController;
  var TopMenu = pb.TopMenuService;

  // Instantiate the controller & extend the base controller
  function ChannelsListController() {
    var ChannelService = require('./services/ChannelService.js')(pb);

    this.channelService = new ChannelService();
  }

  util.inherits(ChannelsListController, pb.BaseController);

  ChannelsListController.prototype.render = function (cb) {
    var self = this;
    var contentService = new pb.ContentService();

    contentService.getSettings(function (err, contentSettings) {
      self.gatherData(function (err, data) {

        self.ts.registerLocal('angular', function (flag, cb) {

          var objects = {
            trustHTML: 'function(string){return $sce.trustAsHtml(string);}'
          };

          var angularData = pb.ClientJs.getAngularController(objects, ['ngSanitize']);
          cb(null, angularData);
        });

        self.ts.registerLocal('channels', function (flag, cb) {

          var tasks = util.getTasks(data.content.channels, function (content, i) {
            return function (callback) {
              if (i >= contentSettings.articles_per_page) {//TODO, limit articles in query, not through hackery
                callback(null, '');
                return;
              }
              self.renderContent(content[i], contentSettings,
                data.nav.themeSettings, i, callback);
            };
          });

          async.parallel(tasks, function (err, result) {
            cb(err, new pb.TemplateValue(result.join(''), false));
          });
        });

        self.ts.registerLocal('navigation', new pb.TemplateValue(data.nav.navigation, false));

        var output = {
          //specify the content here or when you declare the route
          content_type: 'text/html',
          code: 200
        };

        self.ts.load('channels_list', function (error, result) {
          output.content = result;
          cb(output);
        });
      });
    });
  };

  ChannelsListController.prototype.renderContent =
    function (content, contentSettings, themeSettings, index,
      cb) {
      var self = this;
      var isPage = content.object_type === 'page';
      var showByLine = contentSettings.display_bylines && !isPage;
      var showTimestamp = contentSettings.display_timestamp && !isPage;
      var ats = new pb.TemplateService(this.ls);
      var contentUrlPrefix = isPage ? '/page/' : '/questions/';
      self.ts.reprocess = false;

      ats.registerLocal('channel_permalink', pb.UrlService.urlJoin(pb.config.siteRoot,
        contentUrlPrefix, content._id.toJSON()));

      ats.registerLocal('channel_subheading', content.name ? content.name : '');
      ats.registerLocal('channel_id', content._id ? content._id.toString() : '');
      ats.registerLocal('channel_thumbnail_url', content.thumbnail_details ? content.thumbnail_details.location : '');

//      ats.registerLocal('channel_timestamp', showTimestamp && content.created
//        ? content.created : '');

      ats.load('elements/channels/channel', cb);
    };

  ChannelsListController.prototype.getNavigation = function (cb) {
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

  ChannelsListController.prototype.gatherData = function (cb) {
    var self = this;
    var tasks = {
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
        self.loadContent(function (err, data) {
          callback(err, data);
        });
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
    async.parallel(tasks, cb);
  };

  ChannelsListController.prototype.loadContent = function (callback) {
    var self = this;

    if (self.session.authentication.user_id) {
      var uidSessionUser = self.session.authentication.user._id.toJSON();

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

  ChannelsListController.getRoutes = function (cb) {
    var routes = [
      {
        method: 'get',
        path: "/section/channels",
        handler: 'render',
        auth_required: true,
        content_type: 'text/html'
      },
      {
        method: 'get',
        path: "/channels",
        handler: 'render',
        auth_required: true,
        content_type: 'text/html'
      }
    ];
    cb(null, routes);
  };

  return ChannelsListController;
};