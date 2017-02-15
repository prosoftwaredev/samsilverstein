//dependencies
var async = require('async');

module.exports = function ManageAnswersControllerModule(pb) {

//pb dependencies
  var util = pb.util;
  /**
   * Interface for the admin dashboard
   * @class ManageAnswersController
   * @constructor
   */
  function ManageAnswersController() {
    var UsersService = require('./../../../services/UsersService.js')(pb);
    var QuestionService = require('./../../../services/QuestionService.js')(pb);
    this.usersService = new UsersService();
    this.questionService = new QuestionService();
  }
  util.inherits(ManageAnswersController, pb.BaseController);
  /**
   * @see BaseController#render
   */
  ManageAnswersController.prototype.render = function (cb) {
    var self = this;
    //gather all the data
    this.gatherData(function (err, data) {
      if (util.isError(err)) {
        //throw err;
      }

      var name = self.localizationService.get('ARTICLES');
      var contentInfo = [
        {
          name: name,
          count: data.articleCount,
          href: '/admin/content/articles',
        }
      ];
      var angularObjects = pb.ClientJs.getAngularObjects({
        navigation: pb.AdminNavigation.get(self.session, ['questions'], self.localizationService),
        contentInfo: contentInfo,
        access: self.session.authentication.admin_level,
        question: data.question,
        answers: data.answers,
        listUsersOfAnswers: data.listUsersOfAnswers
      });
      self.setPageName(self.localizationService.get('DASHBOARD'));
      self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
      self.ts.load('admin/content/questions/manage_answers', function (error, result) {
        cb({
          content: result
        });
      });
    });
  };
  ManageAnswersController.prototype.gatherData = function (cb) {
    var self = this;
    var vars = self.pathVars;
    var tasks = {
      vars: function (callback) {
        callback(null, vars);
      },
      question: function (callback) {
        self.questionService.getQuestionById(vars.id, callback);
      },
      answers: function (callback) {
        self.questionService.getAllAnswerForQuestion(vars.id, callback);
      }
    };
    async.parallel(tasks, function (err, data) {
      var tasks = [
        function (callback) {
          var wave = data;
          callback(null, wave);
        },
        function (wave, callback) {
          var listUser = [],
            i = 0;
          for (i = 0; wave.answers.length > i; i++) {
            listUser.push(wave.answers[i].author);
          }
          self.usersService.getListOfUsersById(listUser, function (err, data) {
            wave.listUsersOfAnswers = data;
            callback(err, wave);
          });
        }, function (wave, callback) {
          var i = 0, n = 0;
          for (i = 0; wave.answers.length > i; i++) {
            for (n = 0; wave.listUsersOfAnswers.length > n; n++) {
              if (wave.answers[i].author == wave.listUsersOfAnswers[n]._id.toJSON())
                wave.answers[i].author = wave.listUsersOfAnswers[n];
            }
          }
          callback(err, wave);
        }];
      async.waterfall(tasks, cb);
    });
  };
  ManageAnswersController.getRoutes = function (cb) {
    var routes = [{
        method: 'get',
        path: "/admin/content/questions/:id/answers",
        access_level: pb.SecurityService.ACCESS_WRITER,
        auth_required: true,
        content_type: 'text/html'
      }];
    cb(null, routes);
  };
  //exports
  return ManageAnswersController;
};
