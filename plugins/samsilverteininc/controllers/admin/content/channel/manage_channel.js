var async = require('async');

module.exports = function (pb) {

//pb dependencies
  var util = pb.util;
  var ss_baseController = require('./../../../baseController.js')(pb);

  function Managechannel() {
	var ChannelService = require('./../../../services/ChannelService.js')(pb);

	this.channelService = new ChannelService();
  }

  util.inherits(Managechannel, ss_baseController);
  //statics
  var SUB_NAV_KEY = 'manage_objects';

  Managechannel.prototype.render = function (cb) {
	var self = this;
	var vars = this.pathVars;

	self.gatherData(vars, function (err, results) {
	  var chennalTypeId = results.chennalType._id.toJSON();

	  if (!pb.validation.isIdStr(chennalTypeId, true)) {
		return this.reqHandler.serve404();
	  }

//    var service = new pb.CustomObjectService();
	  self.channelService.getChennalType(function (err, custObjType) {
		if (util.isError(err)) {
		  return self.serveError(err);
		} else if (!util.isObject(custObjType)) {
		  return self.reqHandler.serve404();
		}

//      service.findByTypeWithOrdering(custObjType, function (err, customObjects) {
		if (self.session.authentication.user.admin >= 4) {
		  self.channelService.getAllChennals(function (err, chennals) {
			//exdended for admin - get all channals
			renderContentChennals(chennals);
		  });
		} else {
		  self.channelService.getAllChennalsForUser(self.session.authentication.user, function (err, chennals) {
			//exdended for admin - get all channals
			renderContentChennals(chennals);
		  });
		}



		function renderContentChennals(chennals) {
		  if (util.isError(chennals)) {
			return self.reqHandler.serveError(err);
		  }

		  var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'manage_objects', custObjType);
		  for (var i = 0; i < pills.length; i++) {
			if (pills[i].name == 'manage_objects') {
			  pills[i].title += ' (' + chennals.length + ')';
			  break;
			}
		  }

		  var angularObjects = pb.ClientJs.getAngularObjects({
					navigation: pb.AdminNavigation.get(self.session, ['content', 'channel'], self.ls),
					pills: pills,
					customObjects: chennals,
					objectType: custObjType
				  });

		  var title = 'Manage channels';
		  self.setPageName(title);
		  self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));

		  self.ts.load('admin/content/channel/manage_channel', function (err, result) {
			cb({
			  content: result
			});
		  });
		}
	  });

	});

  };

  Managechannel.prototype.gatherData = function (vars, cb) {
	var self = this;
	var dao = new pb.DAO();
	var tasks = {
	  chennalType: function (callback) {
		self.channelService.getChennalType(function (err, chennalType) {
		  callback(null, chennalType);
		});
	  }
	};
	async.parallelLimit(tasks, 2, cb);
  };

  Managechannel.getSubNavItems = function (key, ls, data) {
	return [{
		name: 'manage_channel',
		title: 'Manage channels',
		icon: 'chevron-left',
		href: '/admin/content/channel'
	  }
//         , {
//            name: 'sort_objects',
//            title: '',
//            icon: 'sort-amount-desc',
//            href: '/admin/content/objects/' + data[pb.DAO.getIdField()] + '/sort'
	  //         }
	  , {
		name: 'new_object',
		title: 'New',
		icon: 'plus',
		href: '/admin/content/channel/' + data[pb.DAO.getIdField()] + '/new'
	  }
	  , {
		name: 'dublicate_object',
		title: ' Copy',
		icon: 'share-square-o',
		href: '/admin/content/channel/copy'
	  }
	];
  };

  Managechannel.getRoutes = function (cb) {
	var routes = [
	  {
		path: "/admin/content/channel",
		access_level: pb.SecurityService.ACCESS_WRITER,
		auth_required: true,
		handler: 'render',
		content_type: 'text/html'
	  }];
	cb(null, routes);
  };

  //register admin sub-nav
  pb.AdminSubnavService.registerFor(SUB_NAV_KEY, Managechannel.getSubNavItems);
  //exports
  return Managechannel;
};