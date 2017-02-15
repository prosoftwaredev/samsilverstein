var async = require('async');

module.exports = function (pb) {

  //PB dependencies
  var util = pb.util;
  var BaseController = require('./../../../baseController.js')(pb);

  // Instantiate the controller & extend the base controller
  function NotificationFormController() {
	var TokenService = require('./../../../services/TokensService')(pb);
	var UsersService = require('./../../../services/UsersService')(pb);
	var OrganizationService = require('./../../../services/OrganizationService')(pb);

	this.tokenService = new TokenService();
	this.usersService = new UsersService();
	this.organizationService = new OrganizationService();
  }

  util.inherits(NotificationFormController, BaseController);
  var SUB_NAV_KEY = 'notification_for';

  NotificationFormController.prototype.render = function (cb) {
	var self = this;

	self.gatherData(function (err, data) {

	  var output = {
		content_type: 'text/html',
		code: 200
	  };

	  data.pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY, {
		objectType: self.objectType,
		customObject: self.customObject
	  });

	  data.notificationForm = {};
	  data.session = self.session.authentication;

	  var angularObjects = pb.ClientJs.getAngularObjects(data);

	  self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));

	  self.ts.load('admin/content/notifications/notification_form', function (error, result) {
		output.content = result;
		cb(output);
	  });

	});
  };

  NotificationFormController.getSubNavItems = function (key, ls, data) {
	return [
//	  {
//		name: 'manage_objects',
//		title: 'Push notifications',
//		icon: 'chevron-left',
//		href: '/admin/content/push_notifications'
//	  },
	  {
		name: 'new_object',
		title: '',
		icon: 'plus',
		href: '/admin/content/push_notifications/new'
	  }
	];
  };

  NotificationFormController.prototype.gatherData = function (cb) {
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
		callback(null, pb.AdminNavigation.get(self.session, ['content', 'push_notification'], self.ls));
	  },
	  tokens: function (callback) {
		self.tokenService.getAllTokens(callback);
	  },
	  organizations: function (callback) {
		self.organizationService.getAllOrganizations(function (err, organizations) {
		  organizations = organizations.filter(function (organization) {
			return organization.name != '(no_organization)';
		  });
		  callback(err, organizations);
		});
	  }
	};
	async.series(tasks, function (err, date) {
	  var task = {
		extendToken: function (callback) {
		  var listNames = date.tokens.map(function (token) {
			return token.username;
		  });
		  self.usersService.getListOfUsersByUsername(listNames, function (err, users) {
			date.tokens = date.tokens.map(function (token) {
			  users.forEach(function (user) {
				if (user.username == token.username)
				  token.userDetails = user;

			  });
			  return token;
			});
			callback(null, date);
		  });
		},
		extendOrganizationForToken: function (callback) {
		  date.tokens.forEach(function (token, i, tokens) {
			  if (token.userDetails) {
				  token.userDetails.organizationDetails = date.organizations.find(function (organization) {
					  var organizationId = organization._id.toJSON();
					  return organizationId == token.userDetails.organization;
				  });
			  }
		  });

		  callback(null, date);
		}
	  };

	  async.series(task, function (err, data) {
		data = data.extendToken;
		cb(err, data);
	  });
	});
  };

  NotificationFormController.getRoutes = function (cb) {
	var routes = [{
		method: 'get',
		path: "/admin/content/push_notifications/new",
		handler: 'render',
		auth_required: true,
		content_type: 'text/html'
	  }];
	cb(null, routes);
  };

  //register admin sub-nav
  pb.AdminSubnavService.registerFor(SUB_NAV_KEY, NotificationFormController.getSubNavItems);

  // return the controller prototype so it can be loaded into the application
  return NotificationFormController;
};