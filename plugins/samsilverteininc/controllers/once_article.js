//dependencies
var path = require('path');
var async = require('async');
var _ = require('underscore');

module.exports = function (pb) {

//PB dependencies
	var util = pb.util;
	var BaseController = pb.BaseController;
	var Comments = pb.CommentService;

	var TopMenu = pb.TopMenuService;
	// Instantiate the controller & extend the base controller
	function OnceArticle() {
		var ChannelService = require('./services/ChannelService.js')(pb);
		var UsersService = require('./services/UsersService.js')(pb);
		var ManuController = require('./manu.js')(pb);

		this.manuController = new ManuController();
		this.channelService = new ChannelService();
		this.mediaService = new pb.MediaService();
		this.usersServices = new UsersService();
	}
	var dao = new pb.DAO();

	util.inherits(OnceArticle, pb.BaseController);

	OnceArticle.prototype.render = function (cb) {
		var self = this;

		self.gatherData(function (err, data) {
			var article = data.article;

//			if (article.article_layout.indexOf('^read_more^') > -1) {
//				article.layout = article.article_layout.substr(article.article_layout.indexOf(
//								'^read_more^') + 11, article.article_layout.length);
//			} else {
//				article.layout = article.article_layout;
//			}

			self.renderOnceArticle(data, cb);

		});
	};

	OnceArticle.prototype.getArticle = function (custUrl, cb) {
		var self = this;

		//check for object ID as the custom URL
		var where = null;
		if (pb.validation.isIdStr(custUrl)) {
			where = {
				_id: pb.DAO.getObjectId(custUrl)
			};
			if (pb.log.isSilly()) {
				pb.log.silly(
								"ArticleController: The custom URL was not an object ID [%s].  Will now search url field. [%s]",
								custUrl, e.message);
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
		dao.loadByValues(where, 'article', function (err, article) {
			var ArticleService = pb.ArticleService;
			var service = new ArticleService();
			service.findById(article._id.toString(), function (err, data) {
				cb(err, data[0]);
			});
//			cb(err, article);
		});
	};

	OnceArticle.prototype.renderOnceArticle = function (data, cb) {
		var self = this;
		var articleIndex = 0;

		var output = {
			content_type: 'text/html',
			code: 200
		};
		var extendedAngularObject = '';
		self.ts.registerLocal('angular_objects', new pb.TemplateValue(extendedAngularObject, false));
		self.ts.registerLocal('one_article_subheading', data.article.subheading ? data.article.subheading : '');
		self.ts.registerLocal('channel_name', data.channel.name ? data.channel.name : '');
		self.ts.registerLocal('one_article_layout', new pb.TemplateValue(data.article.layout, false));
		self.ts.registerLocal('channel_thumbnail', data.thumbnail_info ? data.thumbnail_info.location : '');
		self.ts.registerLocal('channel_color', data.channel.bg_color ? data.channel.bg_color : '#4c76fe');
		self.ts.registerLocal('article_name', data.section.name ? data.section.name : '');
		self.ts.registerLocal('article_headline_nolink', data.article.headline);
		self.ts.registerLocal('author', data.author.first_name && data.author.last_name ? data.author.first_name + ' ' + data.author.last_name : '');
		self.ts.registerLocal('date_published', data.date_published ? data.date_published : '');
		self.ts.registerLocal('manu', data.manu);
		self.ts.registerLocal('navigation', new pb.TemplateValue(data.nav.navigation, false));
		self.ts.registerLocal('article_index', articleIndex);


		self.ts.registerLocal('comments', function (flag, cb) {
			if (!pb.ArticleService.allowComments(data.contentSettings, data.article)) {
				return cb(null, '');
			}

			self.renderComments(data.comments, {
				atricleID: data.article.id,
				articleIndex: articleIndex,
				countComments: data.comments.length,
				contentSettings: data.contentSettings,
				channelColor: data.channel.bg_color
			}, self.ts, extendedAngularObject, function (err, comments) {
				cb(err, new pb.TemplateValue(comments, false));
			});

		});

		self.ts.load('one_article', function (error, result) {
			output.content = result;
			cb(output);
		});

	};

	OnceArticle.prototype.renderComment = function (comment, contentSettings, cb) {
		var self = this;
		var cts = new pb.TemplateService(self.ls);
		var showTimestamp = contentSettings.display_timestamp;

		cts.reprocess = false;

		cts.registerLocal('commenter_photo', comment.commenter_photo ? comment.commenter_photo : '');
		cts.registerLocal('display_photo', comment.commenter_photo ? 'block' : 'none');
		cts.registerLocal('commenter_name', comment.commenter_detail.username || '');
		cts.registerLocal('commenter_position', comment.commenter_position ? ', ' + comment.commenter_position : '');
		cts.registerLocal('content', comment.content);
		//cts.registerLocal('timestamp', comment.last_modified || '');
		cts.registerLocal('timestamp', showTimestamp && comment.last_modified
						? pb.ContentService.getTimestampTextFromSettings(
										comment.last_modified,
										contentSettings
										) : '');

		cts.load('elements/comments/comment_s1', cb);
	};

	OnceArticle.prototype.renderComments = function (comments, extra, ts, extendedAngularObject, cb) {
		var self = this;
		var commentingUser = null;
		var sessionUserId = self.session.authentication.user_id;
		var articleID = extra.atricleID;
		var articleIndex = extra.articleIndex;
		var countComments = extra.countComments;
		var contentSettings = extra.contentSettings;
		var channelColor = extra.channelColor;

		if (pb.security.isAuthenticated(self.session)) {
			commentingUser = Comments.getCommentingUser(this.session.authentication.user);
		}

		ts.registerLocal('user_photo', function (flag, cb) {
			if (commentingUser) {
				cb(null, commentingUser.photo ? commentingUser.photo : '');
			} else {
				cb(null, '');
			}
		});
		ts.registerLocal('user_position', function (flag, cb) {
			if (commentingUser && util.isArray(commentingUser.position) && commentingUser.position.length > 0) {
				cb(null, ', ' + commentingUser.position);
			} else {
				cb(null, '');
			}
		});
		ts.registerLocal('user_name', commentingUser ? commentingUser.name : '');
		ts.registerLocal('display_submit', commentingUser ? 'block' : 'none');
		ts.registerLocal('display_login', commentingUser ? 'none' : 'block');
		ts.registerLocal('channel_color', channelColor ? channelColor : '#4c76fe');
		ts.registerLocal('comments_length', util.isArray(comments) ? comments.length : 0);
		ts.registerLocal('individual_comments', function (flag, cb) {
			if (!util.isArray(comments) || comments.length == 0) {
				cb(null, '');
				return;
			}

			var tasks = util.getTasks(comments, function (comments, i) {
				return function (callback) {
					self.renderComment(comments[i], contentSettings, callback);
				};
			});
			async.parallel(tasks, function (err, results) {
				cb(err, new pb.TemplateValue(results.join(''), false));
			});
		});

		var angularObjects = pb.ClientJs.getAngularObjects(_.extend({
			formData: {},
			theAuthorOfTheNewComment: sessionUserId,
			articleID: articleID,
			articleIndex: articleIndex,
			countComments: countComments,
			comment_type: 'article'
		}, extendedAngularObject || {}));

		ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));

		ts.load('elements/article_comments', cb);
	}
	;

	OnceArticle.prototype.getNavigation = function (sectionURL, cb) {
		var self = this;
		var options = {
			currUrl: '/section/' + sectionURL //this.req.url
		};

		TopMenu.getTopMenu(self.session, self.ls, options, function (themeSettings, navigation, accountButtons) {
			TopMenu.getBootstrapNav(navigation, accountButtons, function (navigation, accountButtons) {
				cb(themeSettings, navigation, accountButtons);
			});
		});
	};

	OnceArticle.prototype.getCommentsArticle = function (idArticle, cb) {
		var self = this;
		var where = null;
		var dao = new pb.DAO();

		var extendComments = function (err, comments, pCallback) {
			var i = 0, idObsUser = [];

			var tasks = {
				allComenters: function (callback) {
					where = {
						_id: {
							$in: idObsUser
						}
					};
					dao.q('user', where, function (err, commenters) {
						callback(err, commenters);
					});
				}
			};

			for (i = 0; comments.length > i; i++) {
				idObsUser.push(pb.DAO.getObjectId(comments[i].commenter));
			}

			async.parallel(tasks, function (err, response) {
				var i = 0, c = 0;

				for (i = 0; comments.length > i; i++) {
					for (c = 0; response.allComenters.length > c; c++) {
						if (comments[i].commenter == response.allComenters[c]._id.toJSON())
							comments[i].commenter_detail = response.allComenters[c];
					}
				}

				pCallback(err, comments);
			});
		};

		var opts = {
			where: {
				$and: [{article: idArticle}, {comment_type: 'article'}]
			}
		};
		//attempt to load object
		dao.q('comment', opts, function (err, comments) {
			extendComments(err, comments, cb);
		});
	};

	OnceArticle.prototype.gatherData = function (cb) {
		var self = this;

		var tasks = {
			//manu
			manu: function (callback) {
				self.manuController.getHtml(self.session, cb, callback);
			},
			article: function (callback) {
				var custUrl = self.pathVars.customUrl;
				self.getArticle(custUrl, callback);
			},
			contentSettings: function (callback) {
				var contentService = new pb.ContentService();
				contentService.getSettings(function (err, contentSettings) {
					callback(err, contentSettings);
				});
			}
		};

		async.parallel(tasks, function (err, response) {
			var articleChannel = response.article.channel;
			var articleId = response.article._id.toJSON();
			var allowComments = response.contentSettings.allow_comments;
			var sectionID = response.article.article_sections[0];

			var getSectionID = function (sectionID, callback) {
				var dbTableName = 'section';
				var opts = {
					select: pb.DAO.PROJECT_ALL,
					where: {
						_id: pb.DAO.getObjectID(sectionID)
					}
				};

				dao.q(dbTableName, opts, function (err, sections) {
					callback(err, sections[0]);
				});
			};

			var tasks = {
				//navigation
				nav: function (callback) {
					self.getNavigation(response.section.url, function (themeSettings, navigation, accountButtons) {
						callback(null, {
							themeSettings: themeSettings,
							navigation: navigation,
							accountButtons: accountButtons
						});
					});
				},
				channel: function (callback) {
					self.channelService.getChennalById(articleChannel, function (err, channel) {
						callback(err, channel);
					});
				},
				comments: function (callback) {
					if (!allowComments)
						callback(null, []);

					self.getCommentsArticle(articleId, function (err, comments) {
						callback(err, comments);
					});
				},
				author: function (callback) {
					self.usersServices.loadById(response.article.author, function (err, user) {
						callback(err, user);
					});
				},
				date_published: function (callback) {
					callback(err, pb.ContentService.getTimestampTextFromSettings(new Date(response.article.created), response.contentSettings, self.ls));
				}
			};

			getSectionID(sectionID, function (err, section) {
				response.section = section;

				async.parallel(tasks, function (err, data) {
					response.channel = data.channel;
					response.comments = data.comments;
					response.nav = data.nav;
					response.author = data.author;
					response.date_published = data.date_published;

					var tasks = {
						thumbnail_info: function (callback) {
							self.mediaService.loadById(response.channel.thumbnail, function (err, media) {
								callback(err, media);
							});
						}
					};
					async.parallel(tasks, function (err, data) {
						response.thumbnail_info = data.thumbnail_info;
						cb(err, response);
					});
				});

			});

		});
	};

	OnceArticle.getRoutes = function (cb) {
		var routes = [{
				method: 'get',
				path: "/article/:id",
				handler: 'render',
				auth_required: true,
				content_type: 'text/html'
			}];
		cb(null, routes);
	};

// return the controller prototype so it can be loaded into the application
	return OnceArticle;
}
;