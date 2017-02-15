/* !! no used */

var async = require('async');

module.exports = function (pb) {

  //PB dependencies
  var util = pb.util;
  var BaseController = pb.BaseController;
  var TopMenu = pb.TopMenuService;

  // Instantiate the controller & extend the base controller
  function QuestionsController() {
    var QuestionService = require('./services/QuestionService.js')(pb);

    this.questionService = new QuestionService();
  }

  util.inherits(QuestionsController, pb.BaseController);

  /**
   * Renders a HTML page from the hello_world template
   * @method hellWorld
   * @param {Function} cb
   */

  QuestionsController.prototype.render = function (cb) {
    var self = this;
    var contentService = new pb.ContentService();

    contentService.getSettings(function (err, contentSettings) {
      self.gatherData({
        contentSettings: contentSettings
      }, function (err, data) {

        self.ts.registerLocal('angular', function (flag, cb) {

          var objects = {
            trustHTML: 'function(string){return $sce.trustAsHtml(string);}'
          };

          var angularData = pb.ClientJs.getAngularController(objects, ['ngSanitize']);
          cb(null, angularData);
        });

        self.ts.registerLocal('questions', function (flag, cb) {

          var tasks = util.getTasks(data.content.questions, function (content, i) {
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

        self.ts.load('questions', function (error, result) {
          output.content = result;
          cb(output);
        });
      });
    });
  };

  QuestionsController.prototype.renderContent =
    function (content, contentSettings, themeSettings, index,
      cb) {
      var self = this;
      var isPage = content.object_type === 'page';
      var showByLine = contentSettings.display_bylines && !isPage;
      var showTimestamp = contentSettings.display_timestamp && !isPage;
      var ats = new pb.TemplateService(this.ls);
      var contentUrlPrefix = isPage ? '/page/' : '/questions/';
      self.ts.reprocess = false;

      ats.registerLocal('question_permalink', pb.UrlService.urlJoin(pb.config.siteRoot,
        contentUrlPrefix, content._id.toJSON()));

      ats.registerLocal('question_subheading', content.name ? content.name
        : '');

      ats.registerLocal('question_timestamp', showTimestamp && content.created
        ? content.created : '');

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

  QuestionsController.prototype.getNavigation = function (cb) {
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

  QuestionsController.prototype.gatherData = function (opt, cb) {
    var self = this;
    var query = this.query;
    //determine and execute the proper call
    var pageNumber = undefined;
    if (query.page && pb.validation.isInt(query.page, true, false)) {
      pageNumber = parseInt(query.page, 10) - 1;
    } else {
      pageNumber = 0;
    }

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
        self.loadContent({
          limit: opt.contentSettings.articles_per_page,
          offset: pageNumber
        }, callback);
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

  QuestionsController.prototype.loadContent = function (opt, articleCallback) {
    var self = this;

    if (self.session.authentication.user_id) {
      var uidSessionUser = self.session.authentication.user._id.toJSON();
      var query = {
        limit: opt.limit,
        offset: pageNumber * opt.limit
      };
      self.questionService.getAvailableForUserByIdExtendion(uidSessionUser, query, articleCallback);
    } else {
      return articleCallback(null, {
        questions: []
      });
    }

  };

  QuestionsController.getRoutes = function (cb) {
    var routes = [
//        {
//            method: 'get',
//            path: "/section/questions",
//            handler: 'render',
//            auth_required: false,
//            content_type: 'text/html'
//         }
    ];
    cb(null, routes);
  };

  return QuestionsController;
};