var async = require('async');

module.exports = function (pb) {
  //pb dependencies
  var util = pb.util;
  var ss_baseController = require('./../../../baseController.js')(pb);

  var ChannelCopy = function (cb) {
	this.cos = new pb.CustomObjectService();

	var ChannelService = require('./../../../services/ChannelService.js')(pb);
	this.channelService = new ChannelService();
  };

  util.inherits(ChannelCopy, ss_baseController);
  //statics
  var SUB_NAV_KEY = 'channel_copy';

  ChannelCopy.prototype.renderPage = function (cb) {
	var self = this;

	this.gatherData(function (err, data) {

	  var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY);

	  data.pills = pills;

	  var angularObjects = pb.ClientJs.getAngularObjects(data);
	  self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));

	  self.ts.load('admin/content/channel/channel_copy', function (err, result) {
		cb({
		  content: result
		});
	  });

	});

//	this.copyChannel(cb);

  };

  ChannelCopy.prototype.gatherData = function (cb) {
	var self = this;
	var tasks = {
	  tabs: function (callback) {
		var tabs = [
		  {
			active: 'active',
			href: '#object_fields',
			icon: 'list-ul',
			title: self.ls.get('FIELDS')
		  }
		];
		callback(null, tabs);
	  },
	  navigation: function (callback) {
		callback(null, pb.AdminNavigation.get(self.session, ['content', 'channel'], self.ls));
	  },
	  chennals: function (callback) {
		self.channelService.getAllChennals(callback);
	  }
	};
	async.series(tasks, function (err, data) {
	  cb(null, data);
	});
  };

  ChannelCopy.prototype.copyChannel = function (cb) {
	var self = this;

	this.getJSONPostParams(function (err, post) {
	  self.dao = new pb.DAO();

	  var parentChannelId = post.channel;

	  var tasks = [
		function (callback) {
		  var data = {
			oldChannel: post.channel,
			newNameChannel: post.name,
			maskPrefix: post.maskPrefix
		  };
		  callback(null, data);
		}, function (data, callback) {
		  self.cos.loadById(parentChannelId, {fetch_depth: 1}, function (err, parentChannel) {
			data.parentChannel = parentChannel;
			callback(err, data);
		  });
		}, function (data, callback) {
		  self.cos.loadTypeById(data.parentChannel.type, function (err, cosChannel) {
			data.cosChannel = cosChannel;
			callback(err, data);
		  });
		}
		, function (data, callback) { // channel duplication
		  var newChannel = {};
		  util.deepMerge(data.parentChannel, newChannel);
		  newChannel.name = data.newNameChannel;
		  newChannel.thumbnail = newChannel.thumbnail._id.toString();
		  newChannel.channel_type = newChannel.channel_type._id.toString();
//		  newChannel.bg_image = newChannel.bg_image._id.toString();
		  delete newChannel._id;

		  data.newChannel = newChannel;
		  data.prefix = data.maskPrefix;

		  pb.CustomObjectService.formatRawForType(data.newChannel, data.cosChannel);
		  //util.deepMerge(data.newChannel, data.newChannel);

		  self.cos.save(data.newChannel, data.cosChannel, function (err, result) {
			data.savedNewChannel = {
			  err: err,
			  result: result
			};
			callback(err, data);
		  });

		}
		, function (data, callback) { // all content of channel duplication
		  data.copy = {
			articles: [],
			questions: []
		  };
		  /*
		   article copy
		   */
		  var tasks = {
			articles: function (callback) {
			  self.dao.q('article', {
				where: {
				  channel: data.parentChannel._id.toString()
				}
			  }, function (err, articles) {

				var subTask = tasks = util.getTasks(articles, function (arrArticle, i) {
				  var article = arrArticle[i];
				  return function (subCallback) {
					delete article._id;
					var prefix = data.prefix;
					article.channel = data.savedNewChannel.result._id.toString();
					article.url += prefix;
					article.headline += prefix;
					var docArticle = pb.DocumentCreator.create('article', article, ['meta_keywords']);
					self.dao.save(docArticle, function (err, result) {
					  data.copy.articles.push(result);
					  subCallback(err, result);
					});
				  };
				});

				async.parallel(subTask, function (err, copedArticles) {
				  callback(err, data);
				});
			  });
			},
			questions: function (callback) {
			  var QuestionService = require('./../../../services/QuestionService.js')(pb);
			  self.questionService = new QuestionService();

			  self.questionService.getQuestionsByChannels([data.parentChannel._id.toString()], function (err, questions) {

				var subTask = tasks = util.getTasks(questions, function (arrQuestion, i) {
				  var question = arrQuestion[i];
				  var prefix = data.prefix;
				  return function (subCallback) {
					delete question._id;
					question.name += prefix;
					question.channel = data.savedNewChannel.result._id.toString();
					var docArticle = pb.DocumentCreator.create(self.questionService.getQuestionNameCollection(), question);
					self.dao.save(docArticle, function (err, result) {
					  data.copy.questions.push(result);
					  subCallback(err, result);
					});
				  };
				});

				async.parallel(subTask, function (err, copedQuestions) {
				  callback(err, data);
				});

			  });
			},
			polls: function (callback) {
			  var PollQuestionsService = require('./../../../services/poll/PollQuestionsService.js')(pb);
			  self.pollQuestionsService = new PollQuestionsService();

			  self.pollQuestionsService.getQuestionsByChannels([data.parentChannel._id.toString()], function (err, questions) {

				var subTask = tasks = util.getTasks(questions, function (arrQuestion, i) {
				  var question = arrQuestion[i];
				  var prefix = data.prefix;
				  return function (subCallback) {
					delete question._id;
					question.title += prefix;
					question.channel = data.savedNewChannel.result._id.toString();
					var docArticle = pb.DocumentCreator.create(self.pollQuestionsService.getTableCollection(), question);
					self.dao.save(docArticle, function (err, result) {
					  data.copy.questions.push(result);
					  subCallback(err, result);
					});
				  };
				});

				async.parallel(subTask, function (err, copedQuestions) {
				  callback(err, data);
				});

			  });
			}
		  };
		  async.parallel(tasks, function (err, resultsCopy) {
			callback(err, data);
		  });
		}
	  ];

	  async.waterfall(tasks, function (err, data) {
		cb({
		  content: pb.BaseController.apiResponse(data)
		});
	  });

	});
  };
  ChannelCopy.getRoutes = function (cb) {
	var routes = [
	  {
		method: 'post',
		path: "/admin/content/channel/copychannel",
		access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
		auth_required: true,
		handler: 'copyChannel',
		content_type: 'text/html'
	  },
	  {
		path: "/admin/content/channel/copy",
		access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
		auth_required: true,
		handler: 'renderPage',
		content_type: 'text/html'
	  }
	];
	cb(null, routes);
  };

  //register admin sub-nav
  ChannelCopy.getSubNavItems = function (key, ls, data) {
	return [{
		name: 'manage_channel',
		title: 'Manage channels',
		icon: 'chevron-left',
		href: '/admin/content/channel'
	  }
//	  , {
//		name: 'new_object',
//		title: 'New',
//		icon: 'plus',
//		href: '/admin/content/channel/' + data[pb.DAO.getIdField()] + '/new'
//	  }
	];
  };

  //register admin sub-nav
  pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ChannelCopy.getSubNavItems);

  //exports
  return ChannelCopy;
};