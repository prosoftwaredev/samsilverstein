module.exports = function (pb) {

  var util = pb.util;
  var util = pb.util;
  var BaseController = pb.BaseController;

  function PollService() {
    var PollAnswersService = require('./poll/PollAnswersService.js')(pb);
    var PollQuestionsService = require('./poll/PollQuestionsService.js')(pb);
    var PollVoiseService = require('./poll/PollVoiseService.js')(pb);


    this.pollAnswersService = new PollAnswersService();
    this.pollQuestionsService = new PollQuestionsService();
    this.pollVoiseService = new PollVoiseService();
  }
  
  PollService.prototype.newPoll = function (obj, cb) {
    var self = this;
    self.pollQuestionsService.newQuestion(obj, function (err, result) {
      cb(err, result);
    });
  };
  
  PollService.prototype.getImitatePollSections = function () {
    var self = this;
    return self.pollQuestionsService.getImitatePollSections();
  };
  
  PollService.prototype.loadQuestionById = function (id, cb) {
    var self = this;
    self.pollQuestionsService.loadById(id, function (err, result) {
      cb(err, result);
    });
  };

  PollService.prototype.loadAllPoll = function (cb) {
    var self = this;
    self.pollQuestionsService.loadAll(function (err, data) {
      cb(err, data);
    });
  };

  PollService.prototype.getTableQuestionsCollection = function () {
    var self = this;
    return self.pollQuestionsService.tableCollection;
  };

  PollService.prototype.getQuestionSection = function () {
    var self = this;
    return self.pollQuestionsService.getImitatePollSections();
  };

  PollService.prototype.loadQuestionByChennals = function (chennals, cb) {
    var self = this;
    self.pollQuestionsService.loadQuestionByChennals(chennals, function (err, result) {
      cb(err, result);
    });
  };

  PollService.getRoutes = function (cb) {
    var routes = [];
    cb(null, routes);
  };

  return PollService;
};