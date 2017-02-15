var async = require('async');

module.exports = function (pb) {

//pb dependencies
  var util = pb.util;
  var ss_baseController = require('./../../../baseController.js')(pb);

  function ChannelContent() {
	var ChannelService = require('./../../../services/ChannelService.js')(pb);

	this.channelService = new ChannelService();
  }

  util.inherits(ChannelContent, ss_baseController);
  //statics
  var SUB_NAV_KEY = 'channel_content';

  ChannelContent.prototype.setUrlEditContent = function (arrContents) {
	arrContents = arrContents.map(function (content) {
	  switch (content.object_type) {
		case 'questions':
		  content.editUrl = '/admin/content/questions/' + content._id.toString();
		  break;
		case 'article':
		  content.editUrl = '/admin/content/articles/' + content._id.toString();
		  break;
		case 'poll_questions':
		  content.editUrl = '/admin/content/polls/' + content._id.toString();
		  break;
	  };

	  return content;
	});
	return arrContents;
  };

  ChannelContent.prototype.renderContentChannel = function (content, custObjType, cb) {
	var self = this;
	
	var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'manage_objects', custObjType);
	
	var angularObjects = pb.ClientJs.getAngularObjects({
	  navigation: pb.AdminNavigation.get(self.session, ['content', 'channel'], self.ls),
	  pills: pills,
	  content: content,
	  custObjType: custObjType
	});

	var title = 'Manage channels';
	self.setPageName(title);
	self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));

	self.ts.load('admin/content/channel/channel_content', function (err, result) {
	  cb({
		content: result
	  });
	});
  };

  ChannelContent.prototype.render = function (cb) {
	var self = this;
	var vars = this.pathVars;

	self.gatherData(vars, function (err, results) {
	  results.content = self.setUrlEditContent(results.content);

	  self.channelService.getAllChennals(function (err, chennals) {
		self.renderContentChannel(results.content, results.chennalType, cb);
	  });

	});

  };

  ChannelContent.prototype.gatherData = function (vars, cb) {
	var self = this;
	var dao = new pb.DAO();
	var tasks = {
	  chennalType: function (callback) {
		self.channelService.getChennalType(function (err, chennalType) {
		  callback(null, chennalType);
		});
	  },
	  content: function (callback) {
		self.loadContent({
		  channels: [self.pathVars.idChannel],
		  sectionName: null,
		  userId: (self.session.authentication.user_id) ? (self.session.authentication.user._id.toString()) : null,
		  limit: 10000,
		  offset: 0
		}, callback);
	  }
	};
	async.parallelLimit(tasks, 2, cb);
  };

  ChannelContent.prototype.loadContent = function (options, contentCallback) {
	var AllContentService = this.getAllContentService(pb);
	var allContentService = new AllContentService();
	allContentService.loadContent(options, contentCallback);
  };

  ChannelContent.getSubNavItems = function (key, ls, data) {
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

  ChannelContent.getRoutes = function (cb) {
	var routes = [
	  {
		path: "/admin/content/channel/content/:idChannel",
		access_level: pb.SecurityService.ACCESS_WRITER,
		auth_required: true,
		handler: 'render',
		content_type: 'text/html'
	  }];
	cb(null, routes);
  };

  //register admin sub-nav
  pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ChannelContent.getSubNavItems);
  //exports
  return ChannelContent;
};