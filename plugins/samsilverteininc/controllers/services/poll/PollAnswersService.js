module.exports = function (pb) {

  var util = pb.util;
  var util = pb.util;
  var BaseController = pb.BaseController;
  var tableCollection = 'poll_answers';

  function validationAnswer(obj) {
    if (obj)
      return true;
    return false;
  }
  ;

  function PollAnswersService() {
    this.cos = new pb.CustomObjectService();
    this.dao = new pb.DAO();
  }

  PollAnswersService.prototype.newAnswer = function (obj, cb) {
    var self = this;

    if (validationAnswer(obj)) {

      var answerDocument = pb.DocumentCreator.create(tableCollection, obj, ['meta_keywords']);
      var dao = new pb.DAO();
      dao.save(answerDocument, function (err, result) {
        if (err)
          cb({
            code: 500,
            content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE,
              self.ls.get('ERROR_SAVING'))
          });

        cb(err, result);
      });
    } else {
      cb({
        code: 500,
        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE,
          self.ls.get('ERROR_SAVING'))
      });
    }
  };

  PollAnswersService.prototype.loadAnswerOfUser = function (userId, answerId, cb) {
    var self = this;
    var opts = {
      select: pb.DAO.PROJECT_ALL,
      where: {
        author: userId,
        question: answerId
      },
      order: {
        publish_date: pb.DAO.ASC
      }
    };

    self.dao.q(tableCollection, opts, function (err, answers) {
      if (util.isError(err)) {
        return self.reqHandler.serveError(err);
      }
      var answer = null;
      if (answers.length > 0)
        answer = answers[0];

      cb(err, answer);
    });
  };
  
  PollAnswersService.prototype.loadAnswerById = function (answerId, cb) {
    var self = this;
    var opts = {
      select: pb.DAO.PROJECT_ALL,
      where: {
        question: answerId
      },
      order: {
        publish_date: pb.DAO.ASC
      }
    };

    self.dao.q(tableCollection, opts, function (err, answers) {
      if (util.isError(err)) {
        return self.reqHandler.serveError(err);
      }

      cb(err, answers);
    });
  };
  
  PollAnswersService.getRoutes = function (cb) {
    var routes = [];
    cb(null, routes);
  };

  return PollAnswersService;
};