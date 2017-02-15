var async = require('async');

module.exports = function (pb) {

   //PB dependencies
   var util = pb.util;
   var BaseController = pb.BaseController;
   var organization_type_name = 'organization_obj';

   function OrganizationService() {
      this.customObjectService = new pb.CustomObjectService();

      this.dao = new pb.DAO();
   }

   var getchannelIdFromSession = function (session) {
      return session.authentication.user.organization;
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
            customObjectService.loadTypeByName(organization_type_name, function (err, channalsType) {
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
            customObjectService.loadTypeByName('channel_type', function (err, channalsType) {
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

   var getUserOrganization = function (userObj) {
      return userObj.organization;
   };

   /*
    *  Access
    */

   OrganizationService.prototype.getChannelsForUserById = function (uidUser, cb) {
      var self = this;

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
               channals: function (parCallback) {
                  getAllChannals(parCallback);
               }
            },
            function (err, result) {
               callback(null, result);
            });
         },
         function (result, callback) {
            // get User channel
            var dao = new pb.DAO();

            var opts = {
               select: pb.DAO.PROJECT_ALL,
               where: {
                  _id: pb.DAO.getObjectID(result.user.organization)
               },
               order: {
                  name: pb.DAO.ASC
               }
            };

            dao.q('custom_object', opts, function (err, channel) {
               if (channel[0] !== undefined) {
                  channel = channel[0];
               } else {
                  channel = null;
               }

               result.organization = channel;
               callback(null, result);
            });
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
                  if (array[i] === value) return i;
               }

               return -1;
            };

            for (i = 0; i < result.channals.length; i++) {
               iCahnnel = result.channals[i];
               if ((result.organization && iCahnnel._id.toJSON() == result.organization._id.toJSON()) || find(
                 result.channalsFreeType,
                 iCahnnel.channel) > -1)
                  channels.push(iCahnnel);
            }

            callback(null, channels);
         }
      ], function (err, channels) {
         return cb(null, channels);
      });

   };

   //  organizationService.prototype.isAccessBy

   /*
    *  Organization
    */
   OrganizationService.prototype.getUserOrganization = function (userObj) {
      return  getUserOrganization(userObj);
   };

   OrganizationService.prototype.getOrganizationIdUser = function (userObj) {
      return getUserOrganization(userObj);
   };

   OrganizationService.prototype.getOrganizationIdUserById = function (uidUser, cb) {
      async.waterfall([
         function (callback) {
            getUserById(uidUser, function (err, user) {
               var wave = {};
               wave.user = user;
               callback(err, wave);
            });
         },
         function (wave, callback) {
            wave.organization = getUserOrganization(wave.user);
            callback(null, wave);
         }
      ], function (err, result) {
         cb(err, result.organization);
      });
   };

   OrganizationService.prototype.getOrganizationForUserById = function (uidUser, cb, isFree) {
      var self = this;

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
               channals: function (parCallback) {
                  getAllChannals(parCallback);
               }
            },
            function (err, result) {
               callback(null, result);
            });
         },
         function (result, callback) {
            // get User channel
            var dao = new pb.DAO();

            var opts = {
               select: pb.DAO.PROJECT_ALL,
               where: {
                  _id: pb.DAO.getObjectID(result.user.organization)
               },
               order: {
                  name: pb.DAO.ASC
               }
            };

            dao.q('custom_object', opts, function (err, channel) {
               if (channel[0] !== undefined) {
                  channel = channel[0];
               } else {
                  channel = null;
               }

               result.organization = channel;
               callback(null, result);
            });
         },
         function (result, callback) {
            var channels = [];
            var iCahnnel = {};
            var i = 0;

            var find = function (array, value) {
               if (array.indexOf) {
                  return array.indexOf(value);
               }

               for (var i = 0; i < array.length; i++) {
                  if (array[i] === value) return i;
               }

               return -1;
            };

            for (i = 0; i < result.channals.length; i++) {
               iCahnnel = result.channals[i];
               if ((result.organization && iCahnnel._id.toJSON() == result.organization._id.toJSON()) || find(
                 result.channalsFreeType,
                 iCahnnel.channel) > -1)
                  channels.push(iCahnnel);
            }

            callback(null, channels);
         }
      ], function (err, channels) {
         return cb(null, channels);
      });

   };

   OrganizationService.prototype.getAllOrganizations = function (cb) {
      var self = this;

      var opts = {
         select: pb.DAO.PROJECT_ALL,
         where: {
         },
         order: {
            name: pb.DAO.ASC
         }
      };

      self.customObjectService.loadTypeByName(organization_type_name, function (err, organization) {

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

   OrganizationService.prototype.getAllOrganizationsForUser = function (session, cb) {
      var self = this;

      self.customObjectService.loadTypeByName(organization_type_name, function (err, organization) {

         var opts = {
            select: pb.DAO.PROJECT_ALL,
            where: {
               type: organization._id.toJSON()
            },
            order: {
               name: pb.DAO.ASC
            }
         };
         var uidCennel = getchannelIdFromSession(session);

         if (session.authentication.admin_level <= 3) {
            opts.where._id = pb.DAO.getObjectID(uidCennel);
         }

         self.dao.q('custom_object', opts, function (err, chennals) {
            cb(null, chennals);
         });

      });

   };

   OrganizationService.prototype.getAllOrganizationForUser = function (session, cb) {
      var self = this;

      self.customObjectService.loadTypeByName(organization_type_name, function (err, organization) {

         var opts = {
            select: pb.DAO.PROJECT_ALL,
            where: {
               type: organization._id.toJSON()
            },
            order: {
               name: pb.DAO.ASC
            }
         };
         var uidCennel = getchannelIdFromSession(session);

         if (session.authentication.admin_level <= 3) {
            opts.where._id = pb.DAO.getObjectID(uidCennel);
         }

         self.dao.q('custom_object', opts, function (err, chennals) {
            cb(null, chennals);
         });

      });

   };

   //old need remowe
   OrganizationService.prototype.getAllChennals = function (cb) {
      var self = this;

      var opts = {
         select: pb.DAO.PROJECT_ALL,
         where: {
         },
         order: {
            name: pb.DAO.ASC
         }
      };

      self.customObjectService.loadTypeByName(organization_type_name, function (err, organization) {

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

   OrganizationService.prototype.getChennalById = function (uidChennal, cb) {
      var self = this;
      var session = self.session;

      self.customObjectService.loadTypeByName(organization_type_name, function (err, organization) {

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

   OrganizationService.prototype.getAllChennalsForUser = function (session, cb) {
      var self = this;

      self.customObjectService.loadTypeByName(organization_type_name, function (err, organization) {

         var opts = {
            select: pb.DAO.PROJECT_ALL,
            where: {
               type: organization._id.toJSON()
            },
            order: {
               name: pb.DAO.ASC
            }
         };
         var uidCennel = getchannelIdFromSession(session);

         if (session.authentication.admin_level <= 3) {
            opts.where._id = pb.DAO.getObjectID(uidCennel);
         }

         self.dao.q('custom_object', opts, function (err, chennals) {
            cb(null, chennals);
         });

      });

   };

   OrganizationService.prototype.getAllChennalsForUserByUid = function (uidUser, cb) {
      var self = this;
      var userService = new pb.UserService();


      self.customObjectService.loadTypeByName(organization_type_name, function (err, organization) {

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

   OrganizationService.prototype.getChennalIdForUser = function (uidUser, cb) {
      var self = this;

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

         cb(null, user[0].organization);
      });
   };

   OrganizationService.prototype.getIdEmptyOrg = function (cb) {
      var self = this;

      var opts = {
         select: pb.DAO.PROJECT_ALL,
         where: {
            name: '(no_organization)'
         },
         order: {
            name: pb.DAO.ASC
         }
      };

      self.dao.q('custom_object', opts, function (
        err,
        organizations) {

         cb(null, organizations[0]._id.toJSON());
      });
   };

   /* 
    *  Organization Type
    */

   OrganizationService.prototype.getOrganizationType = function (cb) {
      var self = this;

      var opts = {
         select: pb.DAO.PROJECT_ALL,
         where: {
         },
         order: {
            name: pb.DAO.ASC
         }
      };

      self.customObjectService.loadTypeByName(organization_type_name, function (err, chennal) {
         cb(null, chennal);
      });
   };

   //old need remowe
   OrganizationService.prototype.getChennalType = function (cb) {
      var self = this;

      var opts = {
         select: pb.DAO.PROJECT_ALL,
         where: {
         },
         order: {
            name: pb.DAO.ASC
         }
      };

      self.customObjectService.loadTypeByName(organization_type_name, function (err, chennal) {
         cb(null, chennal);
      });
   };

   OrganizationService.getRoutes = function (cb) {
      var routes = [];
      cb(null, routes);
   };
//   util.inherits(channelService, pb.BaseController);

   return OrganizationService;
};