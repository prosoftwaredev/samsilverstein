var async = require('async');

module.exports = function (pb) {

  //pb dependencies
  var util = pb.util;

  /**
   * Saves the site's email settings
   */
  function NewPoll() {
    var PollService = require('./../../../../services/PollService.js')(pb);
    this.pollService = new PollService();
  }

  util.inherits(NewPoll, pb.BaseController);

  NewPoll.prototype.save = function (cb) {
    var self = this;

    this.getJSONPostParams(function (err, post) {
      post.author = ('author' in post) ? post.author : self.session.authentication.user_id;
      
      self.pollService.newPoll(post, function (err, response) {
        if (err) {
          return cb({
            code: 500,
            content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, JSON.stringify(err))
          });
        }
        cb({
          content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'poll successfully created')
        });
      });


    });
  };

  NewPoll.getRoutes = function (cb) {
    var routes = [{
        method: 'post',
        path: "/actions/admin/content/polls/new",
        access_level: pb.SecurityService.ACCESS_WRITER,
        handler: 'save',
        auth_required: true,
        content_type: 'text/html'
      }];
    cb(null, routes);
  };

  //exports
  return NewPoll;
};