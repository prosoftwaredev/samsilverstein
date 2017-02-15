var async = require('async');

module.exports = function (pb) {

  //pb dependencies
  var util = pb.util;

  /**
   * Saves the site's email settings
   */
  function Notification() {
	var TokenService = require('./../../../../services/TokensService')(pb);
	var PushNotificationService = require('./../../../../services/PushNotificationService')(pb);
	this.tokenService = new TokenService();
	this.pushNotificationService = new PushNotificationService();
  }

  util.inherits(Notification, pb.BaseController);


  Notification.prototype.send = function (cb) {
	var self = this;

	this.getJSONPostParams(function (err, post) {
	  self.pushNotificationService.new(post, function (err, response) {
//		self.pushNotificationService.sendPushNotification(post, function(){});;
		if (err === undefined || err === null) {
		  cb({
			content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'Push Notifications successfully sent')
		  });
		} else {
		  cb({
			content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'Empty Subscribers List')
		  });
		}
	  });
	});
  };


  Notification.getRoutes = function (cb) {
	var routes = [{
		method: 'post',
		path: "/actions/admin/content/notifications/push_notification/send",
		access_level: pb.SecurityService.ACCESS_WRITER,
		handler: 'send',
		content_type: 'text/html'
	  }];
	cb(null, routes);
  };

  //exports
  return Notification;
};