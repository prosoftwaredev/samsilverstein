var path  = require('path');
var async = require('async');

module.exports = function IndexModule(pb) {
    
  /**
   * Index - The home page controller of the portfolio theme.
   *
   * @author Blake Callens <blake@pencilblue.org>
   * @copyright 2014 PencilBlue, LLC.  All Rights Reserved
   */
  function Index() {}

    //dependencies
    var util = pb.util;
    var config = pb.config;
    var PluginService = pb.PluginService;
    var TopMenu = pb.TopMenuService;
    var Comments = pb.CommentService;
    var ArticleService = pb.ArticleService;
    var externalProfiles = PluginService.getService('external_profiles', 'tonicblog-pencilblue');
    var pluginService = new PluginService();

    //inheritance
    util.inherits(Index, pb.BaseController);

    /**
     * This is the function that will be called by the system's RequestHandler.  It
     * will map the incoming route to the ones below and then instantiate this
     * prototype.  The request handler will then proceed to call this function.
     * Its callback should contain everything needed in order to provide a response.
     *
     * @param cb The callback.  It does not require a an error parameter.  All
     * errors should be handled by the controller and format the appropriate
     *  response.  The system will attempt to catch any catastrophic errors but
     *  makes no guarantees.
     */
	 
	 
  Index.prototype.renderPage = function(cb) {
      var self = this;

      //determine and execute the proper call
      var section = self.section || null;
      var topic   = self.topic   || null;
      var article = self.article || null;
      var page    = self.page    || null;

      var contentService = new pb.ContentService();
      contentService.getSettings(function(err, contentSettings) {
          self.gatherData(function(err, data) {
              ArticleService.getMetaInfo(data.content[0], function(metaKeywords, metaDescription, metaTitle, metaThumbnail) {
                  self.ts.registerLocal('meta_keywords', metaKeywords);
                  self.ts.registerLocal('meta_desc', metaDescription);
                  self.ts.registerLocal('meta_title', metaTitle);
                  self.ts.registerLocal('meta_lang', pb.config.localization.defaultLocale);
                  self.ts.registerLocal('meta_thumbnail', metaThumbnail);
                  self.ts.registerLocal('current_url', self.req.url);
                  self.ts.registerLocal('navigation', new pb.TemplateValue(data.nav.navigation, false));
                  self.ts.registerLocal('account_buttons', new pb.TemplateValue(data.nav.accountButtons, false));
                  /* self.ts.registerLocal('infinite_scroll', function(flag, cb) {
                      if(self.article || self.page) {
                          cb(null, '');
                      }
                      else {
                          var infiniteScrollScript = pb.ClientJs.includeJS('/js/infinite_article_scroll.js');
                          if(section) {
                              infiniteScrollScript += pb.ClientJs.getJSTag('var infiniteScrollSection = "' + section + '";');
                          }
                          else if(topic) {
                              infiniteScrollScript += pb.ClientJs.getJSTag('var infiniteScrollTopic = "' + topic + '";');
                          }

                          var val = new pb.TemplateValue(infiniteScrollScript, false);
                          cb(null, val);
                      }
                  }); */
                  self.ts.registerLocal('articles', function(flag, cb) {
                      var tasks = util.getTasks(data.content, function(content, i) {
                          return function(callback) {
                              if (i >= contentSettings.articles_per_page) {//TODO, limit articles in query, not through hackery
                                  callback(null, '');
                                  return;
                              }
                              self.renderContent(content[i], contentSettings, data.nav.themeSettings, i, callback);
                          };
                      });
                      async.parallel(tasks, function(err, result) {
                          cb(err, new pb.TemplateValue(result.join(''), false));
                      });
                  });
                  self.ts.registerLocal('page_name', function(flag, cb) {
                      var content = data.content.length > 0 ? data.content[0] : null;
                      self.getContentSpecificPageName(content, cb);
                  });
				  
                  self.ts.registerLocal('angular_objects', function(flag, cb) {
                      self.getHeroImage(article || page, data.content[0], function(err, heroImage) {
                          var objects = {
                              topics: data.topics,
                              heroImage: heroImage,
                              isPage: page !== null
                          };
                          var angularData = pb.ClientJs.getAngularController(objects, ['ngSanitize']);
                          cb(null, angularData);
                      });
                  });
                  self.ts.load('index', function(err, result) {
                      if (util.isError(err)) {
                          throw err;
                      }

                      cb({content: result});
                  });
              });
          });
      });
  };
  
    Index.prototype.render = function(cb) {
      var self = this;

      var content = {
          content_type: "text/html",
          code: 200
      };

	   self.gatherData(function(err, data) {
      TopMenu.getTopMenu(self.session, self.localizationService, function(themeSettings, navigationObject, accountButtonsObject) {
          TopMenu.getBootstrapNav(navigationObject, accountButtonsObject, function(navigation, accountButtons) {
              pluginService.getSettings('tonicblog-pencilblue', function(err, devblogSettings) {
                  var homePageKeywords = '';
                  var homePageDescription = '';
                  for(var i = 0; i < devblogSettings.length; i++) {
                      switch(devblogSettings[i].name) {
                          case 'home_page_keywords':
                              homePageKeywords = devblogSettings[i].value;
                              break;
                          case 'home_page_description':
                              homePageDescription = devblogSettings[i].value;
                              break;
                          default:
                              break;
                      }
                  }

                  var dao = new pb.DAO();
                  dao.q('tonicblog_theme_settings', {where: {settings_type: 'home_page'}}, function(err, homePageSettings) {
                      if(homePageSettings.length > 0) {
                          homePageSettings = homePageSettings[0];
                      }
                      else {
                          homePageSettings = self.getDefaultHomepageSettings();
                      }

                      externalProfiles.getProfiles(function(err, profiles) {
                          self.ts.registerLocal('meta_keywords', homePageKeywords);
                          self.ts.registerLocal('meta_desc', homePageDescription);
                          self.ts.registerLocal('meta_title', pb.config.siteName);
                          self.ts.registerLocal('meta_lang', config.localization.defaultLocale);
                          self.ts.registerLocal('current_url', self.req.url);
                          self.ts.registerLocal('navigation', new pb.TemplateValue(navigation, false));
                          self.ts.registerLocal('account_buttons', new pb.TemplateValue(accountButtons, false));
                          self.ts.registerLocal('hero_header', homePageSettings.hero_header);
                          self.ts.registerLocal('hero_copy', homePageSettings.hero_copy);
                          self.ts.registerLocal('home_page_content', new pb.TemplateValue(homePageSettings.page_layout, false));

                          var angularObjects = pb.ClientJs.getAngularObjects({
						          topics: data.topics,
                              navigation: navigationObject,
                              accountButtons: accountButtonsObject,
                              profiles: profiles,
                              heroImage: homePageSettings.home_page_hero
                          });
                          self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
					
					/* self.ts.registerLocal('angular', function(flag, cb) {

                          var objects = {
                              topics: data.topics

                          };
                          var angularData = pb.ClientJs.getAngularController(objects, ['ngSanitize']);
                          cb(null, angularData);
                      });
                  */
			//	  });

                          self.ts.load('landing_page', function(err, template) {
                              if(util.isError(err)) {
                                  content.content = '';
                              }
                              else {
                                  content.content = template;
                              }

                              cb(content);
                          });
                      });
                  });
				  });
              });
          });
      });
  };
  
  Index.prototype.onPage = function(cb) {
      var self = this;
      var dao = new pb.DAO();

      try {
          pb.DAO.getObjectId(this.pathVars.customUrl);
          dao.loadById(self.pathVars.customUrl, 'page', function(err, page) {
              if (util.isError(err) || page == null) {
                  throw(err);
              }

              self.page = page._id.toString();
              self.renderPage(cb);
          });
      }
      catch(e) {
          var dao = new pb.DAO();
          dao.loadByValues({url: self.pathVars.customUrl}, 'page', function(err, page) {
              if (util.isError(err) || page == null) {
                  self.reqHandler.serve404();
                  return;
              }

              self.page = page._id.toString();
              self.renderPage(cb);
          });
          return;
      }
  };

  Index.prototype.gatherData = function(cb) {
      var self  = this;
      var tasks = {
          //navigation

          topics: function(callback) {
              var dao = new pb.DAO();
              dao.q('topic', callback);
          }
      };
      async.parallel(tasks, cb);
  };


  Index.prototype.getDefaultHomepageSettings = function() {
      return { show_hero: '1',
          home_page_hero: '//i.imgur.com/MLnm6V9.jpg',
          hero_header: 'This is a header',
          hero_copy: 'This is copy',
          page_media: [],
          page_layout: 'This is the main content'
      };
  };

  /**
  * Provides the routes that are to be handled by an instance of this prototype.
  * The route provides a definition of path, permissions, authentication, and
  * expected content type.
  * Method is optional
  * Path is required
  * Permissions are optional
  * Access levels are optional
  * Content type is optional
  *
  * @param cb A callback of the form: cb(error, array of objects)
  */
  Index.getRoutes = function(cb) {
      var routes = [
          {
              method: 'get',
              path: '/',
              auth_required: false,
              content_type: 'text/html'
          }
      ];
      cb(null, routes);
  };

  //exports
  return Index;
}
