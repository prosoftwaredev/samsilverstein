var async = require('async');

module.exports = function (pb) {

  //pb dependencies
  var util = pb.util;

  /**
   * Saves the site's email settings
   */
  function NotificationService() {
  }

  util.inherits(NotificationService, pb.BaseController);

  var sendOneEmail = function (options, cb) {
    var emailService = new pb.EmailService();

    emailService.sendFromLayout(options, function (err, data) {
      cb(err, data);
    });
  };

  NotificationService.prototype.sendEmails = function (options, cb) {
    var tasks = [], i = 0;

    var EmailObj = function (email, sendOneEmail) {
      this.mail = {
        to: email.to,
        subject: email.subject,
        layout: email.layout
      };
      this.sendOneEmail = sendOneEmail;
    };

    EmailObj.prototype = {
      constructor: EmailObj,
      setEmail: function (email) {
        this.mail.to = email;
        return true;
      },
      getTask: function () {
        var self = this;
        return function (callback) {
          self.sendOneEmail(self.mail, function (err, response) {
            callback(err, response);
          });
        };
      }
    };

    for (i = 0; options.length > i; i++) {
      var emailObj = new EmailObj(options[i], sendOneEmail);
      tasks.push(emailObj.getTask());
    }

    async.parallel(tasks, function (err, response) {
      if (err) {
        return cb({
          code: 500,
          content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, JSON.stringify(err))
        });
      }
      cb(err, response);
    });
  };

  NotificationService.prototype.sendEmail = function (post, cb) {
    var self = this;
    var message = self.hasRequiredParams(post, self.getRequiredFields());

    if (message) {
      return cb({
        code: 400,
        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)
      });
    }

    var options = {
      to: post.to,
      subject: post.subject,
      layout: post.layout
    };

    sendOneEmail(options, function (err, data) {
      if (err) {
        return cb({
          code: 500,
          content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, JSON.stringify(err))
        });
      }
      cb({
        content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'email successfully sent')
      });
    });
  };

  NotificationService.prototype.send = function (post, cb) {
    var self = this;

    if (Array.isArray(post)) {
      self.sendEmails(post, cb);
    } else {
      self.sendEmail(post, cb);
    }
  };

  NotificationService.prototype.getRequiredFields = function () {
    return ['to', 'subject', 'layout'];
  };

  NotificationService.getRoutes = function (cb) {
    var routes = [];
    cb(null, routes);
  };

  //exports
  return NotificationService;
};