module.exports = function (pb) {

  //pb dependencies
  var util = pb.util;

  /**
   * Edits an object
   * @class EditQuestion
   * @constructor
   * @extends FormController
   */
  var QuestionService = require('./../../../../services/QuestionService.js')(pb);
  var questionService = new QuestionService();

  function EditQuestion() {
  }
  util.inherits(EditQuestion, pb.BaseController);

  EditQuestion.prototype.render = function (cb) {
    var self = this;
    var vars = this.pathVars;

    questionService.getAnswerById(vars.id, function (err, question) {
      if (!question) {
        cb({
          code: 404,
          content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
        });
        return;
      }
      var dbCollection = questionService.getAnswerNameCollection(); 
      var dao = new pb.DAO();
      //validate and persist
      dao.deleteById(vars.id, dbCollection, function (err, result) {
        if (util.isError(err)) {
          return cb({
            code: 500,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_DELETE'))
          });
        }
        else if (util.isArray(result) && result.length > 0) {
          return cb({
            code: 400,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_DELETE'), result)
          });
        }

        cb({
          content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, question.name + ' ' + self.ls.get('DELETE'))
        });
      });

    });

  };

  EditQuestion.getRoutes = function (cb) {
    var routes = [
      {
        path: "/actions/admin/content/answer_for_questions/:id/remove",
        access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
        auth_required: true,
        handler: 'render',
        content_type: 'text/html'
      }
    ];
    cb(null, routes);
  };
  //exports
  return EditQuestion;
};
