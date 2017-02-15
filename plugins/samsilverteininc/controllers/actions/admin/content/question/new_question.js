module.exports = function (pb) {

  //pb dependencies
  var util = pb.util;

  /**
   * Creates a new article
   */
  function NewAnswerOfQuestions() {
    var ChannelService = require('./../../../../services/ChannelService.js')(pb);
    var QuestionService = require('./../../../../services/QuestionService')(pb);

    this.questionService = new QuestionService();
    this.channelService = new ChannelService();
  }

  util.inherits(NewAnswerOfQuestions, pb.BaseController);

  NewAnswerOfQuestions.prototype.render = function (cb) {
    var self = this;

    this.getJSONPostParams(function (err, post) {
//      if (self.session.authentication.user.admin < pb.SecurityService.ACCESS_EDITOR || !post.author) {
//        post.author = self.session.authentication.user[pb.DAO.getIdField()];
//      }

      self.questionService.newQuestion(post, function (err, result) {
        if (util.isError(err)) {
          return cb({
            code: 500,
            content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE,
              self.ls.get('ERROR_SAVING'))
          });
        }

        cb({
          content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS,
            self.ls.get('CREATED'), result)
        });
      });
//      });
    });
  };

  NewAnswerOfQuestions.prototype.getRequiredFields = function () {
    return ['url', 'headline', 'article_layout'];
  };

  NewAnswerOfQuestions.prototype.getSanitizationRules = function () {
    return {
      article_layout: pb.BaseController.getContentSanitizationRules()
    };
  };

  NewAnswerOfQuestions.getRoutes = function (cb) {
    var routes = [
      {
        method: 'post',
        path: '/actions/admin/content/questions/new',
//        access_level: pb.SecurityService.ACCESS_WRITER,
        auth_required: true,
        content_type: 'text/html'
      }];

    cb(null, routes);
  };

  //exports
  return NewAnswerOfQuestions;
};
