module.exports = function (pb) {

  //pb dependencies
  var util = pb.util;

  /**
   * Edits a user
   */
  function EditUser() {
  }
  util.inherits(EditUser, pb.BaseController);


  EditUser.prototype.render = function (cb) {
	var self = this;
	var vars = this.pathVars;

	this.getJSONPostParams(function (err, post) {
	  var message = self.hasRequiredParams(post, self.getRequiredFields());
	  if (message) {
		cb({
		  code: 400,
		  content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
		});
		return;
	  }

	  if (!pb.security.isAuthorized(self.session, {
		admin_level: post.admin
	  })) {
		cb({
		  code: 400,
		  content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR,
				  self.ls.get('INSUFFICIENT_CREDENTIALS'))
		});
		return;
	  }

	  var dao = new pb.DAO();
	  dao.loadById(vars.id, 'user', function (err, user) {
		if (util.isError(err) || user === null) {
		  cb({
			code: 400,
			content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR,
					self.ls.get('INVALID_UID'))
		  });
		  return;
		}

		delete post[pb.DAO.getIdField()];
		pb.DocumentCreator.update(post, user);

		var UsersService = require('../../../services/UsersService')(pb);
		if (!UsersService.usernameIsValid(user.username)) {
		  cb({
			code: 400,
			content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, 'not correctly username')
		  });
		  return;
		}

		pb.users.isUserNameOrEmailTaken(user.username, user.email, vars.id, function (err,
				isTaken) {
		  if (util.isError(err) || isTaken) {
			cb({
			  code: 400,
			  content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR,
					  self.ls.get('EXISTING_USERNAME'))
			});
			return;
		  }

		  dao.save(user, function (err, result) {
			if (util.isError(err)) {
			  cb({
				code: 500,
				content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR,
						self.ls.get('ERROR_SAVING'))
			  });
			  return;
			}

			cb({
			  content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS,
					  self.ls.get('USER_EDITED'))
			});
		  });
		});
	  });

	});
  };

  EditUser.prototype.getRequiredFields = function () {
	return ['username', 'email', 'admin'];
  };

  EditUser.getRoutes = function (cb) {
	var routes = [{
		method: 'post',
		path: "/actions/admin/users/:id",
		access_level: pb.SecurityService.ACCESS_EDITOR,
		auth_required: true
	  }];
	cb(null, routes);
  };

  //exports
  return EditUser;
};
