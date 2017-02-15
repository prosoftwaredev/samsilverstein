var async = require('async');
module.exports = function (pb) {

	//PB dependencies
	var util = pb.util;
	var name_obj_question = 'question_obj';
	var BaseController = pb.BaseController;

	var dbTableName = {
		questions: 'questions',
		answer: 'answer_for_questions'
	};

	function QuestionService() {
		this.cos = new pb.CustomObjectService();
		var ChannelService = require('./ChannelService.js')(pb);

		this.dao = new pb.DAO();
		this.channelService = new ChannelService();
	}

	var _getQuestionByChannelsId = function (arrIdsChannel, cb) {
		var self = this;
		var opts = {
			select: pb.DAO.PROJECT_ALL,
			where: {
				channel: {
					$in: arrIdsChannel
				}
			},
			order: {
				created: pb.DAO.ASC
			}
		};
		var dao = new pb.DAO();
		dao.q(dbTableName.questions, opts, function (err, questions) {
			cb(null, questions);
		});
	};
//   util.inherits(QuestionService, ss_baseController);

	/*
	 * Question type  OLD !!!
	 */

	QuestionService.prototype.getQuestionTypeId = function (cb) {
		var self = this;
		self.cos.loadTypeByName(name_obj_question, function (err, questionType) {
			cb(null, questionType._id.toJSON());
		});
	};

	/*
	 * 
	 */
	QuestionService.prototype.getImitateQuestionSection = function () {
		return {
			name: 'questions'
		};
	};

	QuestionService.prototype.getAnswerNameCollection = function () {
		return dbTableName.answer;
	};
	QuestionService.prototype.getQuestionNameCollection = function () {
		return dbTableName.questions;
	};

	/*
	 * User
	 */
	QuestionService.prototype.getQuestionsForUserById = function (userId, cb) {
		var self = this;
		async.waterfall([
			function (callback) {
				var wave = {
					userId: userId
				};
				callback(null, wave);
			},
			function (wave, callback) {
				self.channelService.getChannelsIdForUserById(wave.userId, function (err, chennals) {
					wave.channelsId_user = chennals;

					callback(null, wave);
				});
			},
			function (wave, callback) { // get all questions
				_getQuestionByChannelsId(wave.channelsId_user, function (err, questions) {
					wave.questions = questions;
					callback(null, wave);
				});
			}
		], function (err, data) {
			cb(null, data.questions);
		});
	};

	QuestionService.prototype.getQuestionsForUserById = function (userId, options, cb) {
		var self = this;
		async.waterfall([
			function (callback) {
				var wave = {
					userId: userId
				};
				callback(null, wave);
			},
			function (wave, callback) {
				self.channelService.getChannelsIdForUserById(wave.userId, function (err, chennals) {
					wave.channelsId_user = chennals;

					callback(null, wave);
				});
			},
			function (wave, callback) { // get all questions
				_getQuestionByChannelsId(wave.channelsId_user, function (err, questions) {
					wave.questions = questions;
					callback(null, wave);
				});
			}
		], function (err, data) {
			cb(null, data.questions);
		});
	};

	QuestionService.prototype.getAvailableForUserById = function (uidUser, cb) {
		var self = this;
		async.waterfall([
			function (callback) {
				var wave = {};
				callback(null, wave);
			},
			function (wave, callback) {
				self.cos.loadTypeByName(name_obj_question, function (err, questionType) {
					wave.questionTypeId = questionType._id.toJSON();
					callback(null, wave);
				});
			},
			function (wave, callback) {
				self.channelService.getChannelsForUserById(uidUser, function (err, chennals) {
					wave.channels_user = [];
					var i = 0;
					var iChennal = {};
					for (i = 0; i < chennals.length; i++) {
						iChennal = chennals[i];
						wave.channels_user.push(iChennal._id.toJSON());
					}

					callback(null, wave);
				});
			},
			function (wave, callback) { // get all questions
				var opts = {
					select: pb.DAO.PROJECT_ALL,
					where: {
						type: wave.questionTypeId,
						channel: {
							$in: wave.channels_user
						}
					},
					order: {
						created: pb.DAO.ASC
					}
				};
				self.dao.q('custom_object', opts, function (err, questions) {
					wave.questions = questions;
					callback(null, wave);
				});
			}
		], function (err, data) {
			cb(null, data);
		});
	};

	QuestionService.prototype.getAvailableForUserByIdExtendion = function (uidUser, opt, cb) {
		var self = this;
		async.waterfall([
			function (callback) {
				var wave = {};
				callback(null, wave);
			},
			function (wave, callback) {
				self.cos.loadTypeByName(name_obj_question, function (err, questionType) {
					wave.questionTypeId = questionType._id.toJSON();
					callback(null, wave);
				});
			},
			function (wave, callback) {
				self.channelService.getChannelsForUserById(uidUser, function (err, chennals) {
					wave.channels_user = [];
					var i = 0;
					var iChennal = {};
					for (i = 0; i < chennals.length; i++) {
						iChennal = chennals[i];
						wave.channels_user.push(iChennal._id.toJSON());
					}

					callback(null, wave);
				});
			},
			function (wave, callback) { // get all questions

				var opts = {
					select: pb.DAO.PROJECT_ALL,
					where: {
						type: wave.questionTypeId,
						channel: {
							$in: wave.channels_user
						}
					},
					order: {
						created: pb.DAO.ASC
					}
				};
				if ('limit' in opt)
					opts.limit = opt.limit;
				if ('offset' in opt)
					opts.offset = opt.offset;

				self.dao.q('custom_object', opts, function (err, questions) {
					wave.questions = questions;
					callback(null, wave);
				});
			}
		], function (err, data) {
			cb(null, data);
		});
	};

	/*
	 * Question
	 */

	var validationQuestion = function (question) {
		var result = true;
		return result;
	};

	QuestionService.prototype.newQuestion = function (post, cb) {
		var self = this;
		if (validationQuestion(post)) {

			var validQuestion = {
//				author: post.author,
				author_title: post.author_title,
				name: post.name,
				publish_date: new Date(post.publish_date),
//        meta_keywords: post.meta_keywords,
//        question_sections: post.question_sections,
//        question_topics: post.question_topics,
//        url: post.url,
				allow_comments: post.allow_comments,
				channel: post.channel,
				question_layout: post.question_layout,
				created: new Date()
//        last_modified: post.last_modified
			};

			var answerDocument = pb.DocumentCreator.create(dbTableName.questions, validQuestion, ['meta_keywords']);
			var dao = new pb.DAO();
			dao.save(answerDocument, function (err, result) {
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

	QuestionService.prototype.getAllQuestions = function (cb) {
		var self = this;
		var opts = {
			select: pb.DAO.PROJECT_ALL,
			where: {},
			order: {
				created: pb.DAO.ASC
			}
		};
		self.dao.q(dbTableName.questions, opts, function (err, questions) {
			cb(null, questions);
		});
	};

	QuestionService.prototype.getQuestionsByChannels = function (arrIdsChannel, cb) {
		_getQuestionByChannelsId(arrIdsChannel, cb);
	};

	QuestionService.prototype.getQuestionsByIdOfAuthor = function (idAuthor, cb) {
		var self = this;
		var opts = {
			select: pb.DAO.PROJECT_ALL,
			where: {
				author: idAuthor
			},
			order: {
				created: pb.DAO.ASC
			}
		};
		self.dao.q(dbTableName.questions, opts, function (err, questions) {
			cb(null, questions);
		});
	};

	QuestionService.prototype.getQuestionById = function (idQuestion, cb) {
		var self = this;
		var opts = {
			select: pb.DAO.PROJECT_ALL,
			where: {
				_id: pb.DAO.getObjectID(idQuestion)
			},
			order: {
				created: pb.DAO.ASC
			}
		};
		self.dao.q(dbTableName.questions, opts, function (err, questions) {
			var question = null;
			if (questions.length > 0)
				question = questions[0];

			cb(err, question);
		});
	};

	QuestionService.prototype.getQuestionByCustUrl = function (custUrl, cb) {
		var self = this;
		if (pb.validation.isIdStr(custUrl)) {
			where = {
				_id: pb.DAO.getObjectID(custUrl)
			};
			if (pb.log.isSilly()) {
				pb.log.silly("QuestionController: The custom URL was not an object ID [%s].  Will now search url field. [%s]", custUrl, e.message);
			}
		} else {
			where = {
				url: custUrl
			};
		}

		// fall through to URL key
		if (where === null) {
			where = {
				url: custUrl
			};
		}

		//attempt to load object
		var dao = new pb.DAO();
		var opts = {
			select: pb.DAO.PROJECT_ALL,
			where: where,
			order: {
				created: pb.DAO.ASC
			}
		};
		self.dao.q(dbTableName.questions, opts, function (err, questions) {
			var question = null;
			if (questions.length > 0)
				question = questions[0];
			cb(null, question);
		});
	};
	/*
	 * Answers
	 */

	var validationAnswer = function (answer) {
		var result = false;
		var validation = new pb.ValidationService();
		if ((!'message' in answer && answer.message !== '')
						|| (!'author' in answer && answer.author !== '')
						|| (!'date' in answer && answer.date !== '')
						|| (!'question' in answer && answer.question !== ''))
		{
			result = false;
		} else {
			result = true;
		}
		return result;
	};

	QuestionService.prototype.newAnswer = function (answer, cb) {
		var self = this;
		if (validationAnswer(answer)) {

			var validAnswer = {
				author: answer.author,
				message: answer.message,
				date: answer.date,
				question: answer.question
			};
			var answerDocument = pb.DocumentCreator.create(dbTableName.answer, validAnswer, ['meta_keywords']);
			var dao = new pb.DAO();
			dao.save(answerDocument, cb);
		} else {
			cb({
				code: 500,
				content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE,
								self.ls.get('ERROR_SAVING'))
			});
		}

	};

	QuestionService.prototype.getAnswerById = function (id, cb) {
		var self = this;
		var opts = {
			select: pb.DAO.PROJECT_ALL,
			where: {
				_id: pb.DAO.getObjectID(id)
			},
			order: {
				created: pb.DAO.ASC
			}
		};
		self.dao.q(dbTableName.answer, opts, function (err, questions) {
			var question = null;
			if (questions.length > 0)
				question = questions[0];

			cb(err, question);
		});
	};

	QuestionService.prototype.getAnswerOfUser = function (uidAnswer, uidUser, cb) {
		var dao = new pb.DAO();
		var where = {
			question: uidAnswer,
			author: uidUser
		};
		dao.loadByValues(where, dbTableName.answer, function (err, answer) {
			cb(err, answer);
		});
	};

	QuestionService.prototype.getAllAnswerForQuestion = function (uidQuestion, cb) {
		var self = this;
		var opts = {
			select: pb.DAO.PROJECT_ALL,
			where: {
				question: uidQuestion
			},
			order: {
				created: pb.DAO.ASC
			}
		};
		self.dao.q(dbTableName.answer, opts, function (err, answers) {
			cb(null, answers);
		});
	};
	/*
	 * Router
	 */

	QuestionService.getRoutes = function (cb) {
		var routes = [{
				method: 'post',
				path: "/actions/admin/content/questions_answer/new",
				access_level: pb.SecurityService.ACCESS_WRITER,
				handler: 'saveanswer',
				auth_required: true,
				content_type: 'text/html'
			}];
		cb(null, routes);
	};
//   util.inherits(QuestionService, pb.BaseController);

	return QuestionService;
};