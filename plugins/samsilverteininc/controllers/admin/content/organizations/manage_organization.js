var async = require('async');

module.exports = function (pb) {

//pb dependencies
   var util = pb.util;
   var ss_baseController = require('./../../../baseController.js')(pb);

   function MnagerOrganizations() {
      var OrganizationService = require('./../../../services/OrganizationService.js')(pb);

      this.organizationService = new OrganizationService();
   }

   util.inherits(MnagerOrganizations, ss_baseController);
   //statics
   var SUB_NAV_KEY = 'manage_organization';

   MnagerOrganizations.prototype.render = function (cb) {
      var self = this;
      var vars = this.pathVars;

      self.gatherData(vars, function (err, results) {
         var organizationTypeId = results.organizationType._id.toJSON();

         if (!pb.validation.isIdStr(organizationTypeId, true)) {
            return this.reqHandler.serve404();
         }

//         var service = new pb.CustomObjectService();
         self.organizationService.getChennalType(function (err, custObjType) {
            if (util.isError(err)) {
               return self.serveError(err);
            }
            else if (!util.isObject(custObjType)) {
               return self.reqHandler.serve404();
            }

//            service.findByTypeWithOrdering(custObjType, function (err, customObjects) {
            self.organizationService.getAllOrganizationForUser(self.session, function (err, customObjects) {
               if (util.isError(customObjects)) {
                  return self.reqHandler.serveError(err);
               }

               var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'manage_objects', custObjType);
               for (var i = 0; i < pills.length; i++) {
                  if (pills[i].name == 'manage_objects') {
                     pills[i].title += ' (' + customObjects.length + ')';
                     break;
                  }
               }

               var angularObjects = pb.ClientJs.getAngularObjects(
                   {
                      navigation: pb.AdminNavigation.get(self.session, ['content', 'organizations'], self.ls),
                      pills: pills,
                      customObjects: customObjects,
                      objectType: custObjType
                   });

               var title = self.ls.get('MANAGE') + ' ' + custObjType.name;
               self.setPageName(title);
               self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));

               self.ts.load('admin/content/organizations/manage_organizations', function (err, result) {
                  cb({
                     content: result
                  });
               });

            });
         });

      });

   };

   MnagerOrganizations.prototype.gatherData = function (vars, cb) {
      var self = this;
      var dao = new pb.DAO();
      var tasks = {
         organizationType: function (callback) {
            self.organizationService.getOrganizationType(function (err, organizationType) {
               callback(null, organizationType);
            });
         }
      };
      async.parallelLimit(tasks, 2, cb);
   };

   MnagerOrganizations.getSubNavItems = function (key, ls, data) {
      return [{
            name: 'manage_channel',
            title: ls.get('MANAGE') + ' ' + 'organizations',
            icon: 'chevron-left',
            href: '/admin'
         }
//         , {
//            name: 'sort_objects',
//            title: '',
//            icon: 'sort-amount-desc',
//            href: '/admin/content/objects/' + data[pb.DAO.getIdField()] + '/sort'
//         }
         , {
            name: 'new_object',
            title: '',
            icon: 'plus',
            href: '/admin/content/organizations/' + data[pb.DAO.getIdField()] + '/new'
         }];
   };

   MnagerOrganizations.getRoutes = function (cb) {
      var routes = [
         {
            path: "/admin/content/organizations",
            access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
            auth_required: true,
            handler: 'render',
            content_type: 'text/html'
         }];
      cb(null, routes);
   };

   //register admin sub-nav
   pb.AdminSubnavService.registerFor(SUB_NAV_KEY, MnagerOrganizations.getSubNavItems);
   //exports
   return MnagerOrganizations;
};