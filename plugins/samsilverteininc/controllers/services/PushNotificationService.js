var async = require('async');
var apn = require('apn');
var gcm = require('node-gcm');
var StringDecoder = require('string_decoder').StringDecoder;
var CronJob = require('cron').CronJob;
var fs = require('fs');

module.exports = function (pb) {

  var dbTableName = {
	pushNotification: 'push_notification'
  };

  var dir_conf = pb.config.pushNotification.dirKey;

  validationPushNotification = function (data) {
	return true;
  };

  function PushNotificationService() {

	var TokenService = require('./TokensService')(pb);
	this.tokenService = new TokenService();

	this.dao = new pb.DAO();

	this.batchLimitGCM = 1000;

	this.options = {
	  apn: {
		cert: dir_conf + "/conf/cert.pem",
		key: dir_conf + "/conf/key.pem",
//		passphrase: "admin",
		passphrase: null,
		port: 2195
	  },
	  gcm: {
		apiKey: 'AIzaSyDQoTPQ8mJqk11r79dchoRuCtv2C9KwI0o'
	  }
	};
	this.feedback_options = {
	  batchFeedback: true,
	  interval: 100,
	  cert: dir_conf + "/conf/cert.pem",
	  key: dir_conf + "/conf/key.pem",
//	  passphrase: "admin"
	  passphrase: null
	};
  }

  /*
   *
   *
   * APN Settings
   *
   *
   * */

  PushNotificationService.prototype.APNConnection = function () {
	return new apn.Connection(this.options.apn);
  };

  PushNotificationService.prototype.initIOSDevice = function (token) {
	return new apn.Device(token);
  };

  PushNotificationService.prototype.createIOSNote = function (data) {
	var note = new apn.Notification();
	note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
	note.badge = 3;
	note.sound = "ping.aiff";
	note.alert = data.message;
	return note;
  };

  PushNotificationService.prototype.feedbackAPNPushNotification = function () {
	var self = this;
	var feedback = new apn.Feedback(self.feedback_options);
	feedback.on("feedback", function (devices) {
	  devices.forEach(function (item) {
		var decoder = new StringDecoder('utf8');
		var token = decoder.write(item.device);

		self.tokenService.deleteToken(token, function (err) {
		  if (err) {
			return cb({
			  code: 500,
			  content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, JSON.stringify(err))
			});
		  }
		  item.time = new Date(item.time * 1000);
		  item.device = token;

		  console.log(item);
		});
	  });
	});
  };

  /*
   *
   *
   * GCM Settings
   *
   *
   * */

  PushNotificationService.prototype.GCMMessage = function (notification) {
	return new gcm.Message({
	  notification: {
		title: notification.title,
		icon: "ic_launcher",
		body: notification.body,
		sound: "default",
		click_action: "ca.shelson.samsilverteininc.sam.NOTIFACATION"
	  }
	});
  };

  PushNotificationService.prototype.GCMSender = function () {
	return new gcm.Sender(this.options.gcm.apiKey);
  };

  PushNotificationService.prototype.sendGCM = function (GCMMessage, tokens) {

	var gcmSender = this.GCMSender();

	// Traverse tokens and split them up into batches of 1,000 devices each
	for (var start = 0; start < tokens.length; start += this.batchLimitGCM)
	{
	  // Get next 1,000 tokens
	  var slicedTokens = tokens.splice(start, start + this.batchLimitGCM);

	  gcmSender.send(GCMMessage, {registrationIds: slicedTokens}, function (err, result) {
		err ? console.error(err) : console.log(result);
	  });
	}
  };

  /*
   *
   *
   * Push Notifications
   *
   *
   * */

  PushNotificationService.prototype.sendPushNotification = function (data, cb) {
	var self = this;
	var tokens = data.tokens;
//        self.tokenService.getAllTokens(function (err, tokens) {
//            if (err) {
//                return cb({
//                    code: 500,
//                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, JSON.stringify(err))
//                });
//            }
	/*create notes for ios & android devices*/
	if (tokens.length) {
	  var android_tokens = [];
	  tokens.map(function (token) {
		if (token.device_type == "ios") {
		  var APNConnection = self.APNConnection();
		  var iosNote = self.createIOSNote(data);
		  APNConnection.pushNotification(iosNote, self.initIOSDevice(token.token)); // sending message to IOS devices
		  console.log({token: token.token, device_type: 'ios', date: Date.now()});
		  self.feedbackAPNPushNotification(); // APN Feedback
		}
		if (token.device_type == "android") {
		  var GCMMessage = self.GCMMessage({title: data.from, body: data.message});
		  android_tokens.push(token.token); // collect tokens of android devices
		  self.sendGCM(GCMMessage, android_tokens); // sending message to android devices
		  console.log({token: token.token, device_type: 'android', date: Date.now()});
		}
	  });

//	  cb({
//		content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'Push Notifications successfully sent')
//	  });
	} else {
//	  cb({
//		content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'Empty Subscribers List')
//	  });
	}
//        });
	cb(data);
  };

  PushNotificationService.prototype.new = function (data, cb) {
	var self = this;
	if (validationPushNotification(data)) {
	  data.send_date = new Date(data.send_date);
	  data.is_sent = false;

	  var pushNotification = pb.DocumentCreator.create(dbTableName.pushNotification, data, ['meta_keywords']);
	  var dao = new pb.DAO();
	  dao.save(pushNotification, function (err, result) {
		cb(err, result);
	  });
	} else {
	  cb(true, {
		code: 500,
		content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'Empty Subscribers List')
	  });
	}
  };

  PushNotificationService.prototype._markingIsSent = function (pushNotification, cb) {
	var self = this;
	pushNotification.is_sent = true;
	var answerDocument = pb.DocumentCreator.create(dbTableName.pushNotification, pushNotification, ['meta_keywords']);
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
  };

  PushNotificationService.prototype.getListOfUnsent = function (cb) {
	var self = this;
	var opts = {
	  select: pb.DAO.PROJECT_ALL,
	  where: {
		is_sent: false
	  },
	  order: {
		send_date: pb.DAO.ASC
	  }
	};
	self.dao.q(dbTableName.pushNotification, opts, function (err, pushNotifications) {
	  cb(null, pushNotifications);
	});
  };

  PushNotificationService.prototype.getListForSending = function (cb) {
	var self = this;
	var opts = {
	  select: pb.DAO.PROJECT_ALL,
	  where: {
		is_sent: false,
		send_date: {
		  $lte: new Date()
		}
	  },
	  order: {
		send_date: pb.DAO.ASC
	  }
	};
	self.dao.q(dbTableName.pushNotification, opts, function (err, pushNotifications) {
	  cb(null, pushNotifications);
	});
  };

  PushNotificationService.prototype.runТewsletter = function (interval) {
	var self = this;
	var job = new CronJob({
	  cronTime: '00 * * * * *',
	  onTick: function () {
		self.getListForSending(function (err, pushNotifications) {
		  pushNotifications.forEach(function (pushNotification) {
			self.sendPushNotification(pushNotification, function (pushNotification) {
			  self._markingIsSent(pushNotification, function () {});
			});
		  }, self);
		});
	  },
	  start: true
	});
	return job;
  };
  /*
   * Router
   */

  PushNotificationService.getRoutes = function (cb) {
	var routes = [];
	cb(null, routes);
  };

  return PushNotificationService;
};