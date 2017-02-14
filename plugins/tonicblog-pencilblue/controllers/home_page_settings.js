var ObjectID = require("bson-objectid");
module.exports = function HomePageSettingsModule(pb) {
  /**
   * HomePageSettings - Settings for the display of home page content in the Portfolio theme
   *
   * @author Blake Callens <blake@pencilblue.org>
   * @copyright 2014 PencilBlue, LLC.  All Rights Reserved
   */

  function HomePageSettings() {}

  //dependencies
  var PluginService = pb.PluginService;
  var util = pb.util;

  //inheritance
  util.inherits(HomePageSettings, pb.BaseController);

  HomePageSettings.prototype.render = function(cb) {
      var self = this;

      var content = {
          content_type: "text/html",
          code: 200
      };

      var tabs = [
          {
              active: 'active',
              href: '#home_layout',
              icon: 'home',
              title: self.ls.get('HOME_LAYOUT')
          },
          {
              href: '#media',
              icon: 'picture-o',
              title: self.ls.get('HOME_MEDIA')
          }
      ];

      var pills = [
      {
          name: 'tonicblog_settings',
          title: self.ls.get('HOME_PAGE_SETTINGS'),
          icon: 'chevron-left',
          href: '/admin/plugins/tonicblog-pencilblue/settings'
      }];

      var opts = {
          where: {settings_type: 'home_page'}
      };
      var dao  = new pb.DAO();
      dao.q('tonicblog_theme_settings', opts, function(err, homePageSettings) {
          if(homePageSettings.length > 0) {
              homePageSettings = homePageSettings[0];
          }
          else {
              homePageSettings = {callouts: [{}, {}, {}]};
          }

          var mservice = new pb.MediaService();
          mservice.get(function(err, media) {
              if(homePageSettings.page_media) {
                  var pageMedia = [];
                  for(i = 0; i < homePageSettings.page_media.length; i++) {
                      for(j = 0; j < media.length; j++) {
                          if(media[j]._id.equals(ObjectID(homePageSettings.page_media[i]))) {
                              pageMedia.push(media[j]);
                              media.splice(j, 1);
                              break;
                          }
                      }
                  }
                  homePageSettings.page_media = pageMedia;
              }

              var objects = {
                  navigation: pb.AdminNavigation.get(self.session, ['plugins', 'manage'], self.ls),
                  pills: pills,
                  tabs: tabs,
                  media: media,
                  homePageSettings: homePageSettings
              };

              self.ts.registerLocal('angular_script', '');
              self.ts.registerLocal('angular_objects', new pb.TemplateValue(pb.ClientJs.getAngularObjects(objects), false));
              self.ts.load('admin/settings/home_page_settings', function(err, result) {
                  cb({content: result});
              });
          });
      });
  };

  HomePageSettings.getRoutes = function(cb) {
      var routes = [
      {
          method: 'get',
          path: '/admin/plugins/tonicblog/settings/home_page',
          auth_required: true,
          access_level: pb.SecurityService.ACCESS_EDITOR,
          content_type: 'text/html'
      }
      ];
      cb(null, routes);
  };

  //exports
  return HomePageSettings;
}
