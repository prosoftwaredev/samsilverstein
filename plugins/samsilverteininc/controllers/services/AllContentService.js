module.exports = function (pb) {

  var path = require('path');
  var async = require('async');
  var util = pb.util;
  var ArticleService = pb.ArticleService;
  var ss_baseController = require('../baseController.js')(pb);
  var ChannelService = require('./ChannelService.js')(pb);
  var QuestionService = require('./QuestionService.js')(pb);
  var PollService = require('./PollService.js')(pb);

  var articleService = new ArticleService();
  var channelService = new ChannelService();
  var questionService = new QuestionService();
  var pollService = new PollService();

  function AllContentService(pb) {
  }

  util.inherits(AllContentService, ss_baseController);

  AllContentService.prototype.loadContent = function (options, contentCallback) {
	var dao = new pb.DAO();
	var self = this;
	var uidUser = options.userId ? options.userId : null;

	if (uidUser === null) {
	  contentCallback(null, []);
	} else {
	  var sectionName = options.sectionName || null;
	  var tasks = [
		function (callback) { // start wave
		  var wave = {
			uidUser: uidUser,
			sectionName: sectionName,
			limit: options.limit,
			offset: options.offset,
			minPublishDate: new Date()
		  };
		  callback(null, wave);
		},
		function (wave, callback) { // get curent section
		  dao.loadByValues({
			url: wave.sectionName
		  },
				  'section', function (err, sectionObj) {
					wave.section = sectionObj;
					callback(err, wave);
				  });
		},
		function (wave, callback) { // get channel for users
		  channelService.getChannelsIdForUserById(wave.uidUser, function (err, channels) {
			if ('channels' in options && (options.channels !== null || options.channels !== '')) {
			  var availableChannel = [];
			  var i, c, channalId;

			  for (i = 0; options.channels.length > i; i++) {
				channalId = options.channels[i];
				for (c = 0; channels.length > c; c++) {
				  if (channalId == channels[c])
					availableChannel.push(channalId);
				}
			  }

			  wave.useChannels = availableChannel;
			  callback(null, wave);
			} else {
			  wave.useChannels = channels;
			  callback(null, wave);
			}
		  });
		},
		function (wave, callback) { // get articles for user
		  wave.articles = [];

		  if (wave.sectionName !== null && wave.sectionName.toLowerCase() === 'questions' && wave.sectionName.toLowerCase() === 'polls') {
			callback(null, wave);
			return true;
		  }

		  var getArticles = function (limit, startOffset, channels, cdFunction) {
			var dbTableName = 'article';
			var opts = {
			  select: pb.DAO.PROJECT_ALL,
			  where: {
				publish_date: {
				  $lte: wave.minPublishDate
				},
				channel: {
				  $in: channels
				}
			  },
			  limit: limit,
			  offset: startOffset,
			  order: {
				publish_date: pb.DAO.ASC
			  }
			};
			if (wave.sectionName !== null) {
			  opts.where.article_sections = wave.section._id.toJSON();
			}

			dao.q(dbTableName, opts, function (err, articles) {
			  if (startOffset == 0 || articles.length == limit) {
				wave.articles = articles;
				cdFunction(err, wave);
			  } else {
				getArticles(limit, startOffset - 1, channels, cdFunction);
			  }
			});
		  };

		  var getForPage = function (limit, startOffset, channels, cdFunction) {
			var dbTableName = 'article';
			var opts = {
			  select: pb.DAO.PROJECT_ALL,
			  where: {
				publish_date: {
				  $lte: wave.minPublishDate
				},
				channel: {
				  $in: channels
				}
			  },
			  limit: limit,
			  offset: startOffset,
			  order: {
				publish_date: pb.DAO.ASC
			  }
			};
			if (wave.sectionName !== null) {
			  opts.where.article_sections = wave.section._id.toJSON();
			}

			dao.q(dbTableName, opts, function (err, articles) {
			  wave.articles = articles;
			  cdFunction(err, wave);
			});
		  }

		  if (options.sectionName) {
			getForPage(wave.limit, wave.offset, wave.useChannels, callback);
		  } else {
			getArticles(wave.limit, wave.offset, wave.useChannels, callback);
		  }

		  return true;
		},
		function (wave, callback) {//get questions for user
		  wave.questions = [];
		  var section = questionService.getImitateQuestionSection();
		  if (wave.sectionName === null || wave.sectionName == section.name) {

			var getQuestions = function (limit, startOffset, channels, cbFunction) {
			  var dbTableName = questionService.getQuestionNameCollection();
			  var opts = {
				select: pb.DAO.PROJECT_ALL,
				where: {
				  publish_date: {
					$lte: wave.minPublishDate
				  },
				  channel: {
					$in: channels
				  }
				},
				limit: limit,
				offset: startOffset,
				order: {
				  publish_date: pb.DAO.ASC
				}
			  };
			  var dao = new pb.DAO();
			  dao.q(dbTableName, opts, function (err, questions) {
				if (startOffset == 0 || questions.length == limit) {
				  wave.questions = questions;
				  cbFunction(err, wave);
				} else {
				  getQuestions(limit, startOffset - 1, channels, cbFunction)
				}
			  });
			};
			var getForPage = function (limit, startOffset, channels, cbFunction) {
			  var dbTableName = questionService.getQuestionNameCollection();
			  var opts = {
				select: pb.DAO.PROJECT_ALL,
				where: {
				  publish_date: {
					$lte: wave.minPublishDate
				  },
				  channel: {
					$in: channels
				  }
				},
				limit: limit,
				offset: startOffset,
				order: {
				  publish_date: pb.DAO.ASC
				}
			  };
			  var dao = new pb.DAO();
			  dao.q(dbTableName, opts, function (err, questions) {
				wave.questions = questions;
				cbFunction(err, wave);
			  });
			};

			if (options.sectionName) {
			  getForPage(wave.limit, wave.offset, wave.useChannels, callback);
			} else {
			  getQuestions(wave.limit, wave.offset, wave.useChannels, callback);
			}

		  } else {
			callback(null, wave);
		  }
		},
		function (wave, callback) { //get polls for user
		  wave.polls = [];
		  var section = pollService.getImitatePollSections();
		  if (wave.sectionName === null || wave.sectionName == section.name) {

			var getPolls = function (limit, startOffset, channels, cbFunction) {
			  var dbTableName = pollService.pollQuestionsService.getTableCollection();

			  var opts = {
				select: pb.DAO.PROJECT_ALL,
				where: {
				  publish_date: {
					$lte: wave.minPublishDate
				  },
				  channel: {
					$in: wave.useChannels
				  }
				},
				order: {
				  publish_date: pb.DAO.ASC
				},
				limit: limit,
				offset: startOffset
			  };

			  var dao = new pb.DAO();
			  dao.q(dbTableName, opts, function (err, polls) {
				if (startOffset == 0 || polls.length == limit) {
				  wave.polls = polls;
				  cbFunction(err, wave);
				} else {
				  getPolls(limit, startOffset - 1, channels, cbFunction)
				}
			  });
			};
			var getForPge = function (limit, startOffset, channels, cbFunction) {
			  var dbTableName = pollService.pollQuestionsService.getTableCollection();

			  var opts = {
				select: pb.DAO.PROJECT_ALL,
				where: {
				  publish_date: {
					$lte: wave.minPublishDate
				  },
				  channel: {
					$in: wave.useChannels
				  }
				},
				order: {
				  publish_date: pb.DAO.ASC
				},
				limit: limit,
				offset: startOffset
			  };

			  var dao = new pb.DAO();
			  dao.q(dbTableName, opts, function (err, polls) {
				wave.polls = polls;
				cbFunction(err, wave);
			  });
			};
			if (options.sectionName) {
			  getForPge(wave.limit, wave.offset, wave.useChannels, callback);
			} else {
			  getPolls(wave.limit, wave.offset, wave.useChannels, callback);
			}
			//pollService.loadQuestionByChennals(wave.useChannels, function (err, polls) {
			//    wave.polls = polls;
			//    callback(err, wave);
			//});
		  } else {
			callback(null, wave);
		  }
		},
		function (wave, cllback) { //get all sections
		  var opts = {
			select: pb.DAO.PROJECT_ALL,
			where: {
			  type: {
				$in: ['container', 'section']
			  }
			},
			order: {
			  name: pb.DAO.ASC
			}
		  };
		  var where = {
			type: {
			  $in: ['container', 'section']
			}
		  };
		  dao.q('section', opts, function (err, sections) {
			wave.allSection = sections;
			cllback(err, wave);
		  });
		},
		function (wave, callback) { //get all channels
		  channelService.getAllChannels(function (err, allChannels) {
			wave.allChannels = allChannels;
			callback(null, wave);
		  });
		},
		function (wave, wcallback) { //get thumbnail for chennals
		  self.mediaService = new pb.MediaService();
		  var tasks = util.getTasks(wave.allChannels, function (content, i) {
			return function (callback) {
			  wave.allChannels[i].thumbnail_details = null;
			  async.parallel({
				thumbnail_details: function (callbk) {
				  if ('thumbnail' in wave.allChannels[i] && wave.allChannels[i].thumbnail == '') {
					callbk(null, {});
				  } else {
					// need change to find gb_tags
					self.mediaService.loadById(wave.allChannels[i].thumbnail, function (err, thumbnail_details) {
					  wave.allChannels[i].thumbnail_details = thumbnail_details;
					  callbk(err, thumbnail_details);
					});
				  }
				},
				bg_image_details: function (callbk) {
//				  if ('bg_image' in wave.allChannels[i] && wave.allChannels[i].bg_image == '') {
//					callbk(null, {});
//				  } else {
//					self.mediaService.loadById(wave.allChannels[i].bg_image, function (err, data) {
//					  callbk(err, data);
//					});
				  if (!Array.isArray(wave.allChannels[i].bg_tags) || wave.allChannels[i].bg_tags.length == 0) {
					callbk(null, {});
				  } else {
//					var randomTag = (function (tags) {
//					  return tags[Math.floor(Math.random() * (tags.length - 0)) + 0];
//					})(wave.allChannels[i].bg_tags);

					var dao = new pb.DAO();
					dao.q('media', {
					  select: pb.DAO.PROJECT_ALL,
					  where: {
						tags: wave.allChannels[i].bg_tags
					  }
					}, function (err, media) {
					  if (media.length == 0) {
						callbk(null, {});
					  } else {
//						var randomMedia = (function (media) {
//						  return media[Math.floor(Math.random() * (media.length - 0)) + 0];
//						})(media);
						wave.allChannels[i].thumbnail_details = media;
						callbk(err, media);
					  }
					});
				  }
//				  }
				}
			  },
					  function (err, results) {
						wave.allChannels[i].bg_image_details = results.bg_image_details;
						wave.allChannels[i].thumbnail_details = results.thumbnail_details;
						callback(err, wave.allChannels[i]);
					  });
			};
		  });
		  async.parallel(tasks, function (err, result) {
			wave.allChannels = result;
			wcallback(err, wave);
		  });
		},
		function (wave, callback) { // marge all content to one list
		  var i = 0;
		  wave.content = [];

		  for (i = 0; wave.articles.length > i; i++) {
			wave.content.push(wave.articles[i]);
		  }

		  for (i = 0; wave.questions.length > i; i++) {
			wave.content.push(wave.questions[i]);
		  }

		  for (i = 0; wave.polls.length > i; i++) {
			wave.content.push(wave.polls[i]);
		  }

		  callback(null, wave);
		},
		function (wave, callback) { //extendion description content
		  var iContent = null,
				  i = 0,
				  j = 0,
				  k = 0;
		  for (i = 0; wave.content.length > i; i++) {
			iContent = wave.content[i];
			iContent.section_description = [];
			iContent.channel_desctiprion = {};
			if (self.isArticle(iContent)) {
			  for (j = 0; wave.allSection.length > j; j++) {
				for (k = 0; iContent.article_sections.length > k; k++) {
				  if (iContent.article_sections[k] == wave.allSection[j]._id.toJSON())
					iContent.section_description.push(wave.allSection[j]);
				}
			  }

			  for (j = 0; wave.allChannels.length > j; j++) {
				if (iContent.channel == wave.allChannels[j]._id.toJSON()) {
				  iContent.channel_desctiprion = wave.allChannels[j];
				}
			  }
			} else if (self.isQuestion(iContent)) {
			  iContent.section_description = [questionService.getImitateQuestionSection()];
			  for (j = 0; wave.allChannels.length > j; j++) {
				if (iContent.channel == wave.allChannels[j]._id.toJSON()) {
				  iContent.channel_desctiprion = wave.allChannels[j];
				}
			  }
			} else if (self.isPoll(iContent)) {
			  iContent.section_description = [pollService.getQuestionSection()];
			  for (j = 0; wave.allChannels.length > j; j++) {
				if (iContent.channel == wave.allChannels[j]._id.toJSON()) {
				  iContent.channel_desctiprion = wave.allChannels[j];
				}
			  }
			}

		  }

		  callback(null, wave);
		},
		function (wave, callback) { // sort content
		  wave.content = wave.content.sort(function (d, a) {
			aAate = new Date(a.publish_date);
			dDate = new Date(d.publish_date);
			return (aAate - dDate);
		  });
		  callback(null, wave);
		},
		function (wave, callback) { // withdraw content for page
		  if (wave.sectionName == null)
			wave.content = wave.content.splice(wave.offset, wave.limit);

		  callback(null, wave);
		}
	  ];
	  async.waterfall(tasks, function (err, data) {
		contentCallback(err, data.content);
	  });
	}
  };

  AllContentService.getRoutes = function (cb) {
	var routes = [];
	cb(null, routes);
  };

  return AllContentService;
};