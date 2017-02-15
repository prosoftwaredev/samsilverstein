module.exports = function (pb) {

  //pb dependencies
  var util = pb.util;

  /**
   * Edits a user
   */
  function UserIfnfo() {
  }
  util.inherits(UserIfnfo, pb.BaseController);

  UserIfnfo.prototype.render = function (cb) {
	var self = this;
	var vars = this.pathVars;
	var username = self.session.authentication.user.username;

	cb({
	  content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS,
			  'this auth user', {username: username})
	});
  };

  UserIfnfo.prototype.getRequiredFields = function () {
	return ['username', 'email', 'admin'];
  };

  UserIfnfo.getRoutes = function (cb) {
	var routes = [{
		method: 'get',
		path: "/actions/get_auth",
		access_level: pb.SecurityService.ACCESS_USER,
		auth_required: true
	  }];
	cb(null, routes);
  };

  //exports
  return UserIfnfo;
};
