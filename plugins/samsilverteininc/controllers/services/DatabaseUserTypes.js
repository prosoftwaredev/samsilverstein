module.exports = function (pb) {

   //PB dependencies
   var util = pb.util;
   var util = pb.util;
   var BaseController = pb.BaseController;

   function DatabaseUserTypeService() {
      this.cos = new pb.CustomObjectService();
      this.dao = new pb.DAO();
   }

   DatabaseUserTypeService.prototype.isSuperAdmin = function (userObj) {
      if (userObj.admin == 4)
         return true;

      return false;
   };

   DatabaseUserTypeService.prototype.isAdmin = function (userObj) {

   };

   DatabaseUserTypeService.getRoutes = function (cb) {
      var routes = [];
      cb(null, routes);
   };

//   util.inherits(DatabaseUserTypeService, pb.BaseController);

   return DatabaseUserTypeService;
};