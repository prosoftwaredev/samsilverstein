module.exports = function UseremailAvailableModule(pb) {

  //pb dependencies
  var util = pb.util;

  /**
   * Checks to see if the proposed username is available
   */
  function UseremailAvailable() {}
  util.inherits(UseremailAvailable, pb.BaseController);

  UseremailAvailable.prototype.render = function (cb) {
	var get = this.query;

	var message = this.hasRequiredParams(get, ['email']);
	if (message) {
	  cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'useremail missing from request')});
	  return;
	}

	pb.users.isUserNameOrEmailTaken(get.email, '', null, function (error, isTaken) {
	  if (isTaken) {
		cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, get.username + ' is not available', false)});
		return;
	  }

	  cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, get.username + ' is available', true)});
	});
  };


  UseremailAvailable.getRoutes = function (cb) {
	var routes = [
	  {
		method: 'get',
		path: "/api/user/get_useremail_available",
		auth_required: false,
		access_level: pb.SecurityService.ACCESS_EDITOR
	  }
	];
	cb(null, routes);
  };
  //exports
  return UseremailAvailable;
};