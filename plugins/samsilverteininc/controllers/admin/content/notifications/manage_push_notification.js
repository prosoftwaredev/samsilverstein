/* now not used */

var async = require('async');
module.exports = function (pb) {

  //pb dependencies
  var util = pb.util;
  /**
   * Interface for managing articles
   */
  var ss_baseController = require('./../../../baseController.js')(pb);
  var dao = new pb.DAO();

  function ManagePushNotifications() {
	var ChannelService = require('./../../../services/ChannelService.js')(pb);

	this.channelService = new ChannelService();
  }

  util.inherits(ManagePushNotifications, ss_baseController);
  //statics
  var SUB_NAV_KEY = 'manage_push_notifications';
  var SECTION_KEY = 'content';

  var getSectionID = function (callback) {
	var dbTableName = 'section';
	var opts = {
	  select: pb.DAO.PROJECT_ALL,
	  where: {
		url: SECTION_KEY
	  },
	  limit: 1,
	  offset: 0
			  //order: {
			  //   created: pb.DAO.ASC
			  //}
	};

	dao.q(dbTableName, opts, function (err, sections) {
	  callback(err, sections[0]._id.toJSON());
	});
  };

  ManagePushNotifications.prototype.render = function (cb) {
	var self = this;
	var dao = new pb.DAO();

	var vars = {
	  userUid: this.session.authentication.user_id
	};

	self.gatherData(vars, function (err, data) {
//         where = self.permissionQueryArticle(where);

	  var opts = {
		select: pb.DAO.PROJECT_ALL,
		where: {
		  channel: {
			$in: data.user_channels
		  },
		  article_sections: data.section
		},
		order: {
		  publish_date: pb.DAO.ASC
		}
	  };

	  dao.q('article', opts, function (err, articles) {
		if (util.isError(err)) {
		  return self.reqHandler.serveError(err);
		} else if (articles.length <= 0) {
		  return self.redirect('/admin/content/content/new', cb);
		}

		pb.users.getAuthors(articles, function (err, articlesWithAuthorNames) {
		  articles = self.getArticleStatuses(articlesWithAuthorNames);
		  var angularObjects = pb.ClientJs.getAngularObjects(
				  {
					navigation: pb.AdminNavigation.get(self.session, ['content', 'push_notification'],
							self.ls),
					pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY),
					articles: articles
				  });
		  var manageArticlesStr = self.ls.get('MANAGE_ARTICLES');
		  self.setPageName(manageArticlesStr);

		  self.ts.registerLocal('article_url', '/admin/content/content');

		  self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
		  self.ts.load('admin/content/articles/manage_articles', function (err, data) {
			var result = '' + data;
			cb({
			  content: result
			});
		  });
		});
	  });
	});
  };

  ManagePushNotifications.prototype.gatherData = function (vars, cb) {
	var self = this;
	async.series({
	  section: function (callback) {
		getSectionID(callback);
	  },
	  user_channels: function (callback) {
		self.channelService.getChannelsIdForUserById(vars.userUid, callback, {
		  userBelongsToOrganization: true
		});
	  }
	}, function (err, results) {
	  cb(err, results);
	});
  };

  ManagePushNotifications.prototype.getArticleStatuses = function (articles) {
	var now = new Date();
	for (var i = 0; i < articles.length; i++) {
	  if (articles[i].draft) {
		articles[i].status = this.ls.get('DRAFT');
	  } else if (articles[i].publish_date > now) {
		articles[i].status = this.ls.get('UNPUBLISHED');
	  } else {
		articles[i].status = this.ls.get('PUBLISHED');
	  }
	}

	return articles;
  };

  ManagePushNotifications.getSubNavItems = function (key, ls, data) {
	return [
	  {
		name: 'manage_objects',
		title: 'Push notifications',
		icon: 'chevron-left',
		href: '/admin/content/push_notifications'
	  },
	  {
		name: 'new_object',
		title: '',
		icon: 'plus',
		href: '/admin/content/push_notifications/new'
	  }
	];
  };

  ManagePushNotifications.getRoutes = function (cb) {
	var routes = [
//	  {
//		method: 'get',
//		path: "/admin/content/push_notifications",
//		access_level: pb.SecurityService.ACCESS_WRITER,
//		auth_required: true,
//		content_type: 'text/html'
//	  }
	];
	cb(null, routes);
  };

  //register admin sub-nav
  pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManagePushNotifications.getSubNavItems);
  //exports
  return ManagePushNotifications;
};
