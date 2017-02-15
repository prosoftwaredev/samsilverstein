//dependencies
var async = require('async');

module.exports = function ManagePollAnswerControllerModule(pb) {

//pb dependencies
  var util = pb.util;
  /**
   * Interface for the admin dashboard
   * @class ManagePollAnswerController
   * @constructor
   */
  function ManagePollAnswerController() {
    var UsersService = require('./../../../services/UsersService.js')(pb);
    var PollService = require('./../../../services/PollService.js')(pb);

    this.usersService = new UsersService();
    this.pollService = new PollService();
  }
  util.inherits(ManagePollAnswerController, pb.BaseController);
  /**
   * @see BaseController#render
   */
  ManagePollAnswerController.prototype.render = function (cb) {
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
        navigation: pb.AdminNavigation.get(self.session, ['polls'], self.localizationService),
        contentInfo: contentInfo,
        access: self.session.authentication.admin_level,
        poll: data.poll,
        totalVote: data.totalVote,
        resultPoll: data.resultPoll,
        answers: data.answers,
        listUsersOfAnswers: data.listUsersOfAnswers
      });
      self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));

      self.setPageName(self.localizationService.get('DASHBOARD'));
      self.ts.load('admin/content/polls/manage_poll_answers', function (error, result) {
        cb({
          content: result
        });
      });
    });
  };
  ManagePollAnswerController.prototype.gatherData = function (cb) {
    var self = this;
    var vars = self.pathVars;

    var tasks = {
      vars: function (callback) {
        callback(null, vars);
      },
      poll: function (callback) {
        self.pollService.pollQuestionsService.loadById(vars.id, callback);
      },
      answers: function (callback) {
        self.pollService.pollAnswersService.loadAnswerById(vars.id, callback);
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
        }, function (wave, callback) {
          var i = 0, n = 0;
          for (i = 0; wave.answers.length > i; i++) {
            for (n = 0; wave.poll.answers.length > n; n++) {
              if (wave.answers[i].choose == wave.poll.answers[n]._id)
                wave.answers[i].chooseDetails = wave.poll.answers[n];
            }
          }
          callback(null, wave);
        }, function (wave, callback) {
          wave.resultPoll = [];
          var i = 0, n = 0, answer = null;
          wave.totalVote = wave.answers ? wave.answers.length : 0;

          for (n = 0; wave.poll.answers.length > n; n++) {
            answer = wave.poll.answers[n];
            answer.vote = 0;
            for (i = 0; wave.answers.length > i; i++) {
              if (wave.answers[i].choose == wave.poll.answers[n]._id)
                answer.vote++;
            }

            wave.resultPoll.push(answer);
          }
          callback(null, wave);
        }];
      async.waterfall(tasks, cb);
    });
  };

  ManagePollAnswerController.getRoutes = function (cb) {
    var routes = [{
        method: 'get',
        path: "/admin/content/polls/:id/answers",
        access_level: pb.SecurityService.ACCESS_WRITER,
        auth_required: true,
        content_type: 'text/html'
      }];
    cb(null, routes);
  };

  //exports
  return ManagePollAnswerController;
};
