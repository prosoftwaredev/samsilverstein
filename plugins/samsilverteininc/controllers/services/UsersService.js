module.exports = function (pb) {

  //PB dependencies
  var util = pb.util;
  var util = pb.util;
  var BaseController = pb.BaseController;

  function UsersService() {
	this.cos = new pb.CustomObjectService();
	this.dao = new pb.DAO();
  }

  UsersService.prototype.getAllusers = function (cb) {
	var self = this;

	var opts = {
	  select: pb.DAO.PROJECT_ALL,
	  where: {},
	  order: {
		name: pb.DAO.ASC
	  }
	};

	self.dao.q('user', opts, function (
			err,
			users) {

	  cb(null, users);
	});
  };

  UsersService.prototype.getListOfUsersByUsername = function (listUserName, cb) {
	var self = this, i = 0;
	var listObj = [];
	if (listUserName.length === 0)
	  return cb(null, []);

	var opts = {
	  select: pb.DAO.PROJECT_ALL,
	  where: {
		username: {
		  $in: listUserName
		}
	  },
	  order: {
		name: pb.DAO.ASC
	  }
	};

	self.dao.q('user', opts, function (
			err,
			users) {

	  cb(null, users);
	});
  };

  UsersService.prototype.getListOfUsersById = function (listUserId, cb) {
	var self = this, i = 0;
	var listObj = [];
	if (listUserId.length === 0)
	  return cb(null, []);

	for (i = 0; listUserId.length > i; i++) {
	  listObj.push(pb.DAO.getObjectID(listUserId[i]));
	}

	var opts = {
	  select: pb.DAO.PROJECT_ALL,
	  where: {
		_id: {
		  $in: listObj
		}
	  },
	  order: {
		name: pb.DAO.ASC
	  }
	};

	self.dao.q('user', opts, function (
			err,
			users) {

	  cb(null, users);
	});
  };

  UsersService.prototype.loadById = function (id, cb) {
	var self = this;
	var opts = {
	  select: pb.DAO.PROJECT_ALL,
	  where: {
		_id: pb.DAO.getObjectId(id)
	  },
	  order: {
		created: pb.DAO.ASC
	  }
	};
	self.dao.q('user', opts, function (err, user) {
	  var user = user;
	  if (user[0] !== undefined) {
		user = user[0];
	  }
	  cb(null, user);
	});
  };

  UsersService.getRoutes = function (cb) {
	var routes = [];
	cb(null, routes);
  };


  UsersService.usernameIsValid = function (username) {
	return /^[0-9a-zA-Z_.-]+$/.test(username);
  }
//   util.inherits(UsersService, pb.BaseController);

  return UsersService;
};