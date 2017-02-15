module.exports = function (pb) {

  var util = pb.util;
  var BaseController = pb.BaseController;
  var tableCollection = 'poll_questions';

  function PollQuestionsService() {
	this.cos = new pb.CustomObjectService();
	this.dao = new pb.DAO();
  }

  var validationQuestion = function (obj) {
	return true;
  };

  var getImitatePollSections = {
	name: 'polls'
  };

  PollQuestionsService.prototype.tableCollection = function () {
	return tableCollection;
  };

  PollQuestionsService.prototype.getTableCollection = function () {
	return tableCollection;
  };

  PollQuestionsService.prototype.newQuestion = function (obj, cb) {
	var self = this;

	if (validationQuestion(obj)) {

	  var validPollQuestions = {
		channel: obj.channel,
		title: obj.title,
		content: obj.content,
		allow_comments: obj.allow_comments,
		answers: obj.answers,
		last_modified: new Date(),
		author: obj.author,
		publish_date: new Date(obj.publish_date)
	  };

	  var answerDocument = pb.DocumentCreator.create(tableCollection, validPollQuestions, ['meta_keywords']);
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

  PollQuestionsService.prototype.getImitatePollSections = function () {
	return getImitatePollSections;
  };

  PollQuestionsService.prototype.loadQuestionByChennals = function (channels, cb) {
	var self = this;
	var opts = {
	  select: pb.DAO.PROJECT_ALL,
	  where: {
		channel: {
		  $in: channels
		}
	  },
	  order: {
		publish_date: pb.DAO.ASC
	  }
	};

	self.dao.q(tableCollection, opts, function (err, polls) {
	  if (util.isError(err)) {
		return self.reqHandler.serveError(err);
	  }

	  cb(err, polls);
	});
  };

  PollQuestionsService.prototype.loadAll = function (cb) {
	var self = this;
	var opts = {
	  select: pb.DAO.PROJECT_ALL,
	  where: {},
	  order: {
		publish_date: pb.DAO.ASC
	  }
	};

	self.dao.q(tableCollection, opts, function (err, polls) {
	  if (util.isError(err)) {
		return self.reqHandler.serveError(err);
	  }
	  cb(err, polls);
	})
  };

  PollQuestionsService.prototype.getQuestionsByChannels = function (arrIdsChannel, cb) {
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
	self.dao.q(tableCollection, opts, function (err, questions) {
	  cb(err, questions);
	});
  };


  PollQuestionsService.prototype.loadById = function (id, cb) {
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
	self.dao.q(tableCollection, opts, function (err, questions) {
	  var question = null;
	  if (questions.length > 0)
		question = questions[0];

	  cb(err, question);
	});
  };

  PollQuestionsService.getRoutes = function (cb) {
	var routes = [];
	cb(null, routes);
  };

  return PollQuestionsService;
};