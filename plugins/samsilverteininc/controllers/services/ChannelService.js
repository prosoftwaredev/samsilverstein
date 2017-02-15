var async = require('async');

module.exports = function (pb) {

  //PB dependencies
  var util = pb.util;
  var BaseController = pb.BaseController;

  var channel_obj_name = 'channel_obj';
  var channel_type_name = 'channel_type';

  function ChannelService() {
	var OrganizationService = require('./OrganizationService.js')(pb);
	var DatabaseUserTypes = require('./DatabaseUserTypes.js')(pb);

	this.customObjectService = new pb.CustomObjectService();
	this.organizationService = new OrganizationService();
	this.databaseUserTypes = new DatabaseUserTypes();
	this.dao = new pb.DAO();
  }

  var getchannelIdFromSession = function (session) {
	return session.authentication.user.user_channel;
  };

  var getUserById = function (uidUser, callback) {
	var dao = new pb.DAO();

	var opts = {
	  select: pb.DAO.PROJECT_ALL,
	  where: {
		_id: pb.DAO.getObjectID(uidUser)
	  },
	  order: {
		name: pb.DAO.ASC
	  }
	};

	dao.q('user', opts, function (err, user) {
	  var user = user;
	  if (user[0] !== undefined) {
		user = user[0];
	  }

	  callback(null, user);
	});
  };

  var getAllChannals = function (cb) {
	var customObjectService = new pb.CustomObjectService();
	var dao = new pb.DAO();

	async.waterfall([
	  function (callback) {
		customObjectService.loadTypeByName(channel_obj_name, function (err, channalsType) {
		  callback(null, channalsType);
		});
	  }, function (channalsType, callback) {
		var opts = {
		  select: pb.DAO.PROJECT_ALL,
		  where: {
			type: channalsType._id.toJSON()
		  },
		  order: {
			name: pb.DAO.ASC
		  }
		};

		dao.q('custom_object', opts, function (err, channel) {
		  callback(null, channel);
		});
	  }
	], function (err, result) {
	  cb(err, result);
	});
  };

  var getAllChannalType = function (cb) {
	var customObjectService = new pb.CustomObjectService();
	var dao = new pb.DAO();

	async.waterfall([
	  function (callback) {
		customObjectService.loadTypeByName(channel_type_name, function (err, channalsType) {
		  callback(null, channalsType);
		});
	  }, function (channalsType, callback) {
		var opts = {
		  select: pb.DAO.PROJECT_ALL,
		  where: {
			type: channalsType._id.toJSON()
		  },
		  order: {
			level: pb.DAO.ASC
		  }
		};

		dao.q('custom_object', opts, function (err, channel) {
		  callback(null, channel);
		});
	  }
	], function (err, result) {
	  cb(err, result);
	});
  };

  var getChannelsForUserById = function (uidUser, cb, opt) {
	var dao = new pb.DAO();
	var query = {};

	var DatabaseUserTypes = require('./DatabaseUserTypes.js')(pb);
	var databaseUserTypes = new DatabaseUserTypes();

	async.waterfall([
	  function (callback) {
		async.parallel({
		  user: function (parCallback) {
			getUserById(uidUser, parCallback);
		  },
		  channalsFreeType: function (parCallback) {
			getAllChannalType(function (err, chennals) {
			  var result = [];
			  var i = 0;
			  var iChennal = {};
			  for (i = 0; i < chennals.length; i++) {
				iChennal = chennals[i];
				if (iChennal.level <= 0)
				  result.push(iChennal._id.toString());
			  }

			  parCallback(null, result);
			});
		  },
		  allChannals: function (parCallback) {
			getAllChannals(parCallback);
		  }
		},
				function (err, result) {
				  callback(null, result);
				});
	  },
	  function (result, callback) {
		// get User organization
		if (databaseUserTypes.isSuperAdmin(result.user)) {
		  result.user_organization = false;
		  callback(null, result);
		} else {
		  query = {
			select: pb.DAO.PROJECT_ALL,
			where: {
			  _id: pb.DAO.getObjectID(result.user.organization)
			},
			order: {
			  name: pb.DAO.ASC
			}
		  };

		  dao.q('custom_object', query, function (err, organization) {
			if (organization[0] !== undefined) {
			  organization = organization[0];
			} else {
			  organization = false;
			}

			result.user_organization = organization;
			callback(null, result);
		  });
		}
	  },
	  function (result, callback) {
		var channels = [];
		var iCahnnel = {};
		var i = 0;
		var find = function (array, value) {
		  if (array.indexOf) { // если метод существует
			return array.indexOf(value);
		  }

		  for (var i = 0; i < array.length; i++) {
			if (array[i] === value)
			  return i;
		  }

		  return -1;
		};
		var user_organization = (result.user_organization) ? result.user_organization._id.toJSON() : false;

		if (databaseUserTypes.isSuperAdmin(result.user)) {
		  result.channels = result.allChannals;
		} else {
		  var k = 0,
				  organization;
		  for (i = 0; i < result.allChannals.length; i++) {
			iCahnnel = result.allChannals[i];
			for (k = 0; iCahnnel.organization.length > k; k++) {
			  organizationChennal = iCahnnel.organization[k];
			  if (organizationChennal == user_organization
					  || find(result.channalsFreeType, iCahnnel.channel_type) > -1)
				if (opt === undefined) {
				  channels.push(iCahnnel);
				} else {
				  if (opt.userBelongsToOrganization && organizationChennal == user_organization)
					channels.push(iCahnnel);
				}
			}
		  }
		  result.channels = channels;
		}
		callback(null, result);
	  }
	], function (err, result) {
	  return cb(null, result.channels);
	});
  };

  var getAllChennalByOrganizationId = function (uidOrganization, cb, freeChannal) {
	var self = this;

	var OrganizationService = require('./OrganizationService.js')(pb);
	var organizationService = new OrganizationService();
	var dao = new pb.DAO();

	uidOrganization = (uidOrganization !== undefined) ? uidOrganization : 'false';

	async.waterfall([
	  function (callback) {
		var wave = {
		  arrOrganization: [uidOrganization],
		  freeChannal: (freeChannal === undefined) ? true : false,
		  session: self.session
		};
		callback(null, wave);
	  },
	  function (wave, callback) {
		if (wave.freeChannal) {
		  organizationService.getIdEmptyOrg(function (err, IdEmptyOrg) {
			wave.IdEmptyOrg = IdEmptyOrg;
			wave.arrOrganization.push(IdEmptyOrg);
			callback(null, wave);
		  });
		} else {
		  callback(null, wave);
		}
	  },
	  function (wave, callback) {
		var opts = {
		  select: pb.DAO.PROJECT_ALL,
		  where: {
			organization: {
			  $in: wave.arrOrganization
			}
		  },
		  order: {
			type: pb.DAO.ASC
		  }
		};

		dao.q('custom_object', opts, function (err, channels) {
		  wave.channels = channels;
		  callback(err, wave);
		});
	  }
	], function (err, wave) {
	  return cb(null, wave.channels);
	});
  };

  ChannelService.prototype.getThumbnailForChnannels = function (allChannels, cb) {
	var self = this;
	self.mediaService = new pb.MediaService();

	var tasks = util.getTasks(allChannels, function (content, i) {
	  return function (callback) {
		allChannels[i].thumbnail_details = null;

		if ('thumbnail' in allChannels[i] && allChannels[i] == '') {
		  callback(err, allChannels[i]);
		}
		self.mediaService.loadById(allChannels[i].thumbnail, function (err, data) {
		  allChannels[i].thumbnail_details = data;
		  callback(err, allChannels[i]);
		});
	  };
	});

	async.parallel(tasks, function (err, result) {
	  cb(err, result);
	});
  };

  ChannelService.prototype.getAllChannels = function (cb) {
	getAllChannals(cb);
  };
  /*
   *  Access
   */
  ChannelService.prototype.getChannelsForUserById = function (uidUser, cb, opt) {
	getChannelsForUserById(uidUser, cb, opt);
  };

  ChannelService.prototype.getChannelsIdForUserById = function (uidUser, cb, opt) {
	getChannelsForUserById(uidUser, function (err, channels) {
	  var i = 0;
	  var chennalsId = [];
	  for (i = 0; channels.length > i; i++) {
		chennalsId.push(channels[i]._id.toJSON());
	  }
	  cb(null, chennalsId);
	}, opt);
  };

  //   channelService.prototype.isAccessBy

  /*
   *  Chennals
   */

  ChannelService.prototype.getAllChennals = function (cb) {
	var self = this;

	var opts = {
	  select: pb.DAO.PROJECT_ALL,
	  where: {
	  },
	  order: {
		name: pb.DAO.ASC
	  }
	};

	self.customObjectService.loadTypeByName(channel_obj_name, function (err, organization) {

	  var opts = {
		select: pb.DAO.PROJECT_ALL,
		where: {
		  type: organization._id.toJSON()
		},
		order: {
		  name: pb.DAO.ASC
		}
	  };

	  self.dao.q('custom_object', opts, function (
			  err,
			  organizations) {

		cb(null, organizations);
	  });
	});

  };

  ChannelService.prototype.getChennalById = function (uidChennal, cb) {
	var self = this;
	var session = self.session;

	self.customObjectService.loadTypeByName(channel_obj_name, function (err, organization) {

	  var opts = {
		select: pb.DAO.PROJECT_ALL,
		where: {
		  _id: pb.DAO.getObjectID(uidChennal),
		  type: organization._id.toString()
		},
		order: {
		  type: pb.DAO.ASC
		}
	  };

	  self.dao.q('custom_object', opts, function (err, chennals) {
		cb(null, chennals[0]);
	  });

	});

  };

  ChannelService.prototype.getAllChennalsForUser = function (userObj, cb) {
	var self = this;

	var self = this;

	async.waterfall([
	  function (callback) {
		var wave = {};
		callback(null, wave);
	  },
	  function (wave, callback) {
		var opts = {
		  select: pb.DAO.PROJECT_ALL,
		  where: {
			_id: pb.DAO.getObjectID(userObj._id.toJSON())
		  },
		  order: {
			name: pb.DAO.ASC
		  }
		};
		self.dao.q('user', opts, function (
				err,
				user) {
		  wave.user = user[0];
		  callback(err, wave);
		});
	  },
	  function (wave, callback) {
		getAllChennalByOrganizationId(wave.user.organization, function (err, channals) {
		  wave.channals = channals;
		  callback(null, wave);
		});
	  }
	], function (err, wave) {
	  cb(null, wave.channals);
	});

  };

  ChannelService.prototype.getAllChennalsForUserByUid = function (uidUser, cb) {
	var self = this;
	var userService = new pb.UserService();

	self.customObjectService.loadTypeByName(channel_obj_name, function (err, organization) {
	  var opts = {
		select: pb.DAO.PROJECT_ALL,
		where: {
		  type: organization._id.toJSON()
		},
		order: {
		  name: pb.DAO.ASC
		}
	  };

	  userService.hasAccessLevel(uidUser, 3, function (err, accessLevel) {
		if (!accessLevel) {
		  opts.where._id = pb.DAO.getObjectID(uidCennel);
		}

		self.dao.q('custom_object', opts, function (err, chennals) {
		  cb(null, chennals);
		});
	  });

	});

  };

  ChannelService.prototype.getChennalIdForUserById = function (uidUser, cb) {
	var self = this;

	async.waterfall([
	  function (callback) {
		var wave = {};
		callback(null, wave);
	  },
	  function (wave, callback) {
		var opts = {
		  select: pb.DAO.PROJECT_ALL,
		  where: {
			_id: pb.DAO.getObjectID(uidUser)
		  },
		  order: {
			name: pb.DAO.ASC
		  }
		};
		self.dao.q('user', opts, function (
				err,
				user) {
		  wave.user = user[0];
		  callback(err, wave);
		});
	  },
	  function (wave, callback) {
		self.getAllChennalByOrganizationId(wave.user.organization, function (err, channals) {
		  var i = 0;
		  var chennalsId = [];
		  for (i = 0; channals.length > i; i++) {
			chennalsId.push(channals[i]._id.toJSON());
		  }
		  wave.chennalsId = chennalsId;
		  callback(null, wave);
		});
	  }
	], function (err, wave) {
	  cb(null, wave.chennalsId);
	});
  };

  ChannelService.prototype.getAllChennalByOrganizationId = function (uidOrganization, cb, freeChannal) {
	var self = this;
	return getAllChennalByOrganizationId(uidOrganization, cb, freeChannal);
  };

  /* 
   *  Chennal Type
   */

  ChannelService.prototype.getChennalType = function (cb) {
	var self = this;

	var opts = {
	  select: pb.DAO.PROJECT_ALL,
	  where: {
	  },
	  order: {
		name: pb.DAO.ASC
	  }
	};

	self.customObjectService.loadTypeByName(channel_obj_name, function (err, chennal) {
	  cb(null, chennal);
	});
  };

  ChannelService.prototype.renderBgImg = function (channelObj) {
	if (channelObj.use_bg_image == false || !channelObj.bg_image_details)
	  return '';
	
	var randomMedia = (function (media) {
	  return media[Math.floor(Math.random() * (media.length - 0)) + 0];
	})(channelObj.bg_image_details);
	console.log(randomMedia);
	return new pb.TemplateValue(('location' in randomMedia) ? '<img src="' + randomMedia.location + '">' : '', false);
  };

  ChannelService.prototype.getAllChennalTypes = function (cb) {
	var self = this;

	getAllChannalType(cb);
  };

  ChannelService.getRoutes = function (cb) {
	var routes = [];
	cb(null, routes);
  };
//   util.inherits(channelService, pb.BaseController);

  return ChannelService;
};