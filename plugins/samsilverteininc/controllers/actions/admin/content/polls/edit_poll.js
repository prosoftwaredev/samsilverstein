module.exports = function (pb) {

  //pb dependencies
  var util = pb.util;

  /**
   * Edits an object
   * @class EditPoll
   * @constructor
   * @extends FormController
   */

  function EditPoll() {
    var PollService = require('./../../../../services/PollService.js')(pb);
    this.pollService = new PollService();
  }
  util.inherits(EditPoll, pb.BaseController);

  EditPoll.prototype.render = function (cb) {
    var self = this;
    var vars = this.pathVars;

    self.pollService.loadQuestionById(vars.id, function (err, poll) {
      if (!poll) {
        cb({
          code: 404,
          content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
        });
        return;
      }
      self.getJSONPostParams(function (err, post) {

        poll._id = pb.DAO.getObjectId(poll._id);
        poll.channel = post.channel;
        poll.title = post.title;
        poll.content = post.content;
        poll.allow_comments = post.allow_comments;
        poll.answers = post.answers;
        poll.last_modified = new Date();
        poll.publish_date = new Date(post.publish_date);
		poll.author_title = post.author_title;

        var dao = new pb.DAO();
        //validate and persist
        dao.save(poll, function (err, result) {
          if (util.isError(err)) {
            return cb({
              code: 500,
              content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
            });
          }
          else if (util.isArray(result) && result.length > 0) {
            return cb({
              code: 400,
              content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'), result)
            });
          }

          cb({
            content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, poll.title + ' ' + self.ls.get('EDITED'))
          });
        });
      });
    });

  };

  EditPoll.prototype.delete = function(cb) {
    var self = this;
    var vars = this.pathVars;

    if (!pb.validation.isIdStr(vars.id, true)) {
      return cb({
        code: 400,
        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
      });
    }

    var dao = new pb.DAO();
    dao.loadById(vars.id, 'poll_questions', function(err, poll) {
      var isError = util.isError(err);
      if(isError || !poll) {
        return cb({
          code: isError ? 500 : 400,
          content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, isError ? err.stack : self.ls.get('INVALID_UID'))
        });
      }

      dao.deleteById(vars.id, 'poll_questions', function(err, pollsDeleted) {
        if(util.isError(err) || pollsDeleted <= 0) {
          return cb({
            code: 500,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_DELETING'))
          });
        }

        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, poll.title + ' ' + self.ls.get('DELETED'))});
      });
    });

  };

  EditPoll.getRoutes = function (cb) {
    var routes = [
      {
        path: "/actions/admin/content/polls/:id",
        access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
        auth_required: true,
        handler: 'render',
        content_type: 'text/html'
      },
      {
        path: "/actions/admin/content/polls/:id/remove",
        access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
        auth_required: true,
        handler: 'delete',
        content_type: 'text/html'
      }
    ];
    cb(null, routes);
  };
  //exports
  return EditPoll;
};