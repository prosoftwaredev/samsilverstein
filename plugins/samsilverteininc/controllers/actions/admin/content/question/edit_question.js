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

		questionService.getQuestionById(vars.id, function (err, question) {
			if (!question) {
				cb({
					code: 404,
					content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
				});
				return;
			}
			self.getJSONPostParams(function (err, post) {

				question._id = question._id;
				question.channel = post.channel;
				question.question_layout = post.question_layout;
				question.last_modified = new Date();
				question.allow_comments = post.allow_comments;
				question.name = post.name;
				question.author_title = post.author_title;
				question.publish_date = new Date(post.publish_date);

				var dao = new pb.DAO();
				//validate and persist
				dao.save(question, function (err, result) {
					if (util.isError(err)) {
						return cb({
							code: 500,
							content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
						});
					} else if (util.isArray(result) && result.length > 0) {
						return cb({
							code: 400,
							content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'), result)
						});
					}

					cb({
						content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, question.name + ' ' + self.ls.get('EDITED'))
					});
				});
			});
		});



	};

	EditQuestion.getRoutes = function (cb) {
		var routes = [
			{
				path: "/actions/admin/content/questions/:id",
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
