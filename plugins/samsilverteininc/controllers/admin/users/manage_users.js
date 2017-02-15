/*
 Copyright (C) 2015  PencilBlue, LLC
 
 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.
 
 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
 
 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
var async = require('async');

module.exports = function (pb) {

  var PluginService  = pb.PluginService;
  //pb dependencies
  var util = pb.util;
  /**
   * Interface for managing users
   */
  var ss_baseController = require('./../../baseController.js')(pb);

  function ManageUsers() {
    var OrganizationService = require('./../../services/OrganizationService.js')(pb);

    this.organizationService = new OrganizationService();
  }
  util.inherits(ManageUsers, ss_baseController);

  //statics
  var SUB_NAV_KEY = 'm_manage_users';

  ManageUsers.prototype.render = function (cb) {
    var self = this;

    //TODO: see if there is a user service function with this


    self.gatherData(function (err, data) {
      if (util.isError(err)) {
        throw err;
      }
//      else if (!data.user) {
//        self.reqHandler.serve404();
//        return;
//      }
      (function (users, organizations) {//extend description organizations of users 
        var iUser = 0, iOrg = 0;
        for (iUser = 0; users.length > iUser; iUser++) {
          for (iOrg = 0; organizations.length > iOrg; iOrg++) {
            if (data.users[iUser].organization == organizations[iOrg]._id.toJSON())
              data.users[iUser].organization = organizations[iOrg];
          }
        }
      })(data.users, data.organizations);

      var angularObjects = pb.ClientJs.getAngularObjects({
        navigation: pb.AdminNavigation.get(self.session, ['users', 'manage'], self.ls),
        pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY),
        users: data.users,
        currentUserId: self.session.authentication.user_id
      });

      self.setPageName(self.ls.get('MANAGE_USERS'));

      self.ts.registerLocal('dir_public', PluginService.getPublicPath('samsilverteininc'));

      self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects,
        false));
      self.ts.load('admin/users/manage_users', function (err, result) {
        cb({
          content: result
        });
      });
    });
  };

  ManageUsers.prototype.gatherData = function (cb) {
    var self = this;
    var tasks = {
      users: function (callback) {
        var where = {};
//      where.admin = {
//         $lte: self.session.authentication.user.admin
//      };
        where = self.permissionQueryUser(where);
        self.permissionQueryUser(where);
        var opts = {
          where: where
        };

        var dao = new pb.DAO();
        dao.q('user', opts, function (err, users) {
          if (util.isError(err)) {
            return self.reqHandler.serveError(err);
          } else if (users.length === 0) {
            return self.redirect('/admin', cb);
          }
          callback(err, users);
        });
      },
      organizations: function (callback) {
        self.organizationService.getAllOrganizations(function (err, channel) {
          callback(err, channel);
        });
      }
    };

    async.series(tasks, cb);
  };

  ManageUsers.getSubNavItems = function (key, ls, data) {
    return [{
        name: 'manage_users',
        title: ls.get('MANAGE_USERS'),
        icon: 'refresh',
        href: '/admin/users'
      }
      , {
        name: 'new_user',
        title: '',
        icon: 'plus',
        href: '/admin/users/new'
      }];
  };

  ManageUsers.getRoutes = function (cb) {
    var routes = [
      {
        method: 'get',
        path: "/admin/users",
        auth_required: true,
        access_level: pb.SecurityService.ACCESS_EDITOR
      }];
    cb(null, routes);
  };

/*  pb.AdminSubnavService.unregisterFor(SUB_NAV_KEY, function () {
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManageUsers.getSubNavItems);
  });*/
  pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManageUsers.getSubNavItems);

  //exports
  return ManageUsers;
};
