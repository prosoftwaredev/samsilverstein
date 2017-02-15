//dependencies
var async = require('async');

module.exports = function (pb) {

   //pb dependencies
   var util = pb.util;

   /**
    * Interface for editing a user
    */

   function MUserForm() {
      var ChennalServis = require('./../../services/ChannelService.js')(pb);
      var OrganizationService = require('./../../services/OrganizationService.js')(pb);
      var AppUserTypeService = require('./../../services/AppUserTypeService.js')(pb);

      this.auts = new AppUserTypeService();
      this.chennalServis = new ChennalServis();
      this.organizationService = new OrganizationService();
   }
   
   var ss_baseController = require('./../../baseController.js')(pb);
   
   util.inherits(MUserForm, ss_baseController);

   //statics
   var SUB_NAV_KEY = 'm_user_form';

   MUserForm.prototype.render = function (cb) {
      var self = this;
      var vars = this.pathVars;

      this.gatherData(vars, function (err, data) {
         if (util.isError(err)) {
            throw err;
         }
         else if (!data.user) {
            self.reqHandler.serve404();
            return;
         }

         self.user = data.user;
         data.pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY, {
            session: self.session,
            user: self.user
         });

//         data.adminOptions = [{
//               name: self.ls.get('ADMINISTRATOR'),
//               value: pb.SecurityService.ACCESS_ADMINISTRATOR
//            }];

         data.authentication = self.session.authentication;
//         if (!data.user[pb.DAO.getIdField()] || self.session.authentication.user_id !== data.user[pb.DAO.getIdField()].toString()) {
         data.adminOptions = pb.users.getAdminOptions(self.session, self.localizationService);
//         }

         var angularObjects = pb.ClientJs.getAngularObjects(data);

         self.setPageName(data.user[pb.DAO.getIdField()] ? data.user.username : self.ls.get(
             'NEW_USER'));
         self.ts.registerLocal('image_title', self.ls.get('USER_PHOTO'));
         self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects,
             false));

         self.ts.load('admin/users/user_form', function (err, result) {
            cb({
               content: result
            });
         });

      });
   };

   MUserForm.prototype.gatherData = function (vars, cb) {
      var self = this;
      var tasks = {
         tabs: function (callback) {
            var tabs = [{
                  active: 'active',
                  href: '#account_info',
                  icon: 'cog',
                  title: self.ls.get('ACCOUNT_INFO')
               }, {
                  href: '#personal_info',
                  icon: 'user',
                  title: self.ls.get('PERSONAL_INFO')
               }];
            callback(null, tabs);
         },
         navigation: function (callback) {
            callback(null, pb.AdminNavigation.get(self.session, ['users'], self.ls));
         },
         user: function (callback) {
            if (!vars.id) {
               callback(null, {});
               return;
            }
            var dao = new pb.DAO();
            dao.loadById(vars.id, 'user', function (err, user) {
               delete user.password;

               async.series(
                   {
//                  user_channel: function (cb) {
//                     dao.loadById(user.organization, 'custom_object', function (err,
//                         custom_object) {
//                        delete user.password;
//                        user.user_channel = custom_object;
//                        
//                        cb(err, true);
//                     });
//                  },
                      user_appUserType: function (cb) {
                         cb(err, true);
                      }

                   },
               function (err, result) {
                  callback(err, user);
               });

            });
         },
         appUserTypes: function (callback) {
            self.auts.getAllType(function (err, appUserType) {
               callback(null, appUserType);
            });
         },
         channels: function (callback) {
            self.chennalServis.getAllChennals(function (err, channel) {
               callback(null, channel);
            });
         },
         organizations: function (callback) {
            self.organizationService.getAllOrganizations(function (err, channel) {
               callback(null, channel);
            });
         }
//         user_channel: function (callback) {
//            self.chennalServis.getChennalIdForUser(vars.id, function (err, idOfChennalForUser) {
//               self.chennalServis.getChennalById(idOfChennalForUser, function (err, channelType) {
//                  callback(null, channelType);
//               });
//            });
//         }
      };

      async.series(tasks, cb);
   };

   MUserForm.getSubNavItems = function (key, ls, data) {
      var pills = [{
            name: 'manage_users',
            title: data.user[pb.DAO.getIdField()] ? ls.get('EDIT') + ' ' + data.user.username
                : ls.get('NEW_USER'),
            icon: 'chevron-left',
            href: '/admin/users'
         }];

      if (data.user[pb.DAO.getIdField()]) {
         if (data.session.authentication.user_id === data.user[pb.DAO.getIdField()].toString()) {
            pills.push({
               name: 'change_password',
               title: ls.get('CHANGE_PASSWORD'),
               icon: 'key',
               href: '/admin/users/password/' + data.user[pb.DAO.getIdField()].toString()
            });
         }
         else if (data.session.authentication.admin_level >= pb.SecurityService.ACCESS_MANAGING_EDITOR) {
//            pills.push({
//               name: 'reset_password',
//               title: ls.get('RESET_PASSWORD'),
//               icon: 'key',
//               href: '/actions/admin/users/send_password_reset/' + data.user[pb.DAO.getIdField()].toString()
//            });
         }
      }

      pills.push({
         name: 'new_user',
         title: '',
         icon: 'plus',
         href: '/admin/users/new'
      });

      return pills;
   };

   MUserForm.getRoutes = function (cb) {
      var routes = [
         {
            method: 'get',
            path: "/admin/users/new",
            handler: 'render',
            auth_required: true,
            content_type: 'text/html'
         }, {
            method: 'get',
            path: "/admin/users/:id",
            handler: 'render',
            auth_required: true,
            content_type: 'text/html'
         }];
      cb(null, routes);
   };
   //register admin sub-nav
   pb.AdminSubnavService.registerFor(SUB_NAV_KEY, MUserForm.getSubNavItems);

   //exports
   return MUserForm;
};
