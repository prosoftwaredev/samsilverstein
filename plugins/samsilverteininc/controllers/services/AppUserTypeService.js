module.exports = function (pb) {

  //PB dependencies
  var util = pb.util;
  var util = pb.util;
  var BaseController = pb.BaseController;

  function AppUserTypeService() {
    this.cos = new pb.CustomObjectService();
    this.dao = new pb.DAO();
  }

  AppUserTypeService.prototype.getAllType = function (cb) {
    var self = this;

    var opts = {
      select: pb.DAO.PROJECT_ALL,
      where: {
      },
      order: {
        name: pb.DAO.ASC
      }
    };

    self.cos.loadTypeByName('app_user_types', function (err, userType) {
      var opts = {
        select: pb.DAO.PROJECT_ALL,
        where: {
          type: userType._id.toJSON()
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

  AppUserTypeService.prototype.getIdTypeBylevel = function (level, cb) {
    var self = this;

    var opts = {
      select: pb.DAO.PROJECT_ALL,
      where: {
      },
      order: {
        name: pb.DAO.ASC
      }
    };

    self.cos.loadTypeByName('app_user_types', function (err, userType) {
      var opts = {
        select: pb.DAO.PROJECT_ALL,
        where: {
          level: level,
          type: userType._id.toJSON()
        },
        order: {
          name: pb.DAO.ASC
        }
      };

      self.dao.q('custom_object', opts, function (
        err,
        userTypes) {

        cb(null, userTypes[0]._id.toJSON());
      });
    });

  };
  /*
   AppUserTypeService.prototype.getUserType = function (uidUser, cb) {
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
   */
  AppUserTypeService.getRoutes = function (cb) {
    var routes = [];
    cb(null, routes);
  };
//   util.inherits(AppUserTypeService, pb.BaseController);

  return AppUserTypeService;
};