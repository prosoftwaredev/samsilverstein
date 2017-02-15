var async = require('async');

module.exports = function (pb) {

	//pb dependencies
	var util = pb.util;

	/**
	 * Saves the site's email settings
	 */
	function NewToken() {
		var TokenService = require('./../../../../services/TokensService')(pb);
		this.tokenService = new TokenService();
	}

	util.inherits(NewToken, pb.BaseController);

	NewToken.prototype.save = function (cb) {
		var self = this;

		var data = {
			username: self.pathVars.user_name,
			token: self.pathVars.token,
			device_type: self.pathVars.device_type
		};

		self.tokenService.checkExistToken(data, function (err, response) {
			if (response) {
				data._id = response;
			}
			self.tokenService.newToken(data, function (err, response) {
				if (err) {
					return cb({
						code: 404,
						content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, JSON.stringify(err))
					});
				}
				return self.redirect('/', cb);
			});
		});
	};

	NewToken.getRoutes = function (cb) {
		var routes = [{
				method: 'get',
				path: "/actions/admin/content/notifications/:device_type/:token/:user_name/save",
				//access_level: pb.SecurityService.ACCESS_READER,
				handler: 'save',
				content_type: 'text/html'
			}];
		cb(null, routes);
	};

	//exports
	return NewToken;
};