//dependencies
var async = require('async');

module.exports = function SS_AdminIndexControllerModule(pb) {

   //pb dependencies
   var util = pb.util;

   /**
    * Interface for the admin dashboard
    * @class SS_AdminIndexController
    * @constructor
    */
   function SS_AdminIndexController() {
      var channelService = require('./../services/ChannelService.js')(pb);

      this.channelService = new channelService();
   }
   util.inherits(SS_AdminIndexController, pb.BaseController);

   /**
    * @see BaseController#render
    */
   SS_AdminIndexController.prototype.render = function (cb) {
      var self = this;

      //gather all the data
      this.gatherData(function (err, data) {
         if (util.isError(err)) {
            //throw err;
         }

         var name = self.localizationService.get('ARTICLES');
         
         var contentInfo = [
            {
               name: name,
               count: data.articleCount,
               href: '/admin/content/articles',
            },
         ];
         
         var angularObjects = pb.ClientJs.getAngularObjects({
            navigation: pb.AdminNavigation.get(self.session, ['dashboard'], self.localizationService),
            contentInfo: contentInfo,
            cluster: data.clusterStatus,
            access: self.session.authentication.admin_level
         });

         self.setPageName(self.localizationService.get('DASHBOARD'));
         self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
         self.ts.load('admin/index', function (error, result) {
            cb({
               content: result
            });
         });

      });
   };

   /**
    * Gather all necessary data for rendering the dashboard.
    * <ul>
    * <li>Article count</li>
    * <li>Page Count</li>
    * <li>Cluster Status</li>
    * </ul>
    * @method gatherData
    * @param {Function} cb A callback that provides two parameters: cb(Error, Object)
    */
   SS_AdminIndexController.prototype.gatherData = function (cb) {
      var tasks = {
         //article count
         articleCount: function (callback) {
            var dao = new pb.DAO();
            dao.count('article', pb.DAO.ANYWHERE, callback);
         },
         //page count
//         pageCount: function (callback) {
//            var dao = new pb.DAO();
//            dao.count('page', pb.DAO.ANYWHERE, callback);
//         },
         //cluster status
         clusterStatus: function (callback) {
            var service = pb.ServerRegistration.getInstance();
            service.getClusterStatus(function (err, cluster) {
               callback(err, cluster);
            });
         }
      };
      async.parallel(tasks, cb);
   };

   SS_AdminIndexController.getRoutes = function (cb) {
      var routes = [{
            method: 'get',
            path: "/admin",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            content_type: 'text/html'
         }];
      cb(null, routes);
   };


   //exports
   return SS_AdminIndexController;
};
