var async = require('async');

module.exports = function (pb) {

  //pb dependencies
  var util = pb.util;
  /**
   * Interface for managing users
   */
  var ss_baseController = require('./../../baseController.js')(pb);

  function ImportUsers() {
    var OrganizationService = require('./../../services/OrganizationService.js')(pb);

    this.organizationService = new OrganizationService();
  }

  util.inherits(ImportUsers, ss_baseController);

  //statics
  var SUB_NAV_KEY = 'import_users';

  ImportUsers.prototype.render = function (cb) {
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
        navigation: pb.AdminNavigation.get(self.session, ['users', 'import_users'], self.ls),
        pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY),
        users: data.users,
        currentUserId: self.session.authentication.user_id,
        organizations: data.organizations
      });

      self.setPageName(self.ls.get('MANAGE_USERS'));
      self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects,
        false));

      self.ts.load('admin/users/import_users', function (err, result) {
        cb({
          content: result
        });
      });
    });
  };

  ImportUsers.prototype.gatherData = function (cb) {
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

  ImportUsers.getSubNavItems = function (key, ls, data) {
    return [/*{
     name: 'manage_users',
     title: ls.get('MANAGE_USERS'),
     icon: 'refresh',
     href: '/admin/users'
     }
     , */{
        name: 'new_user',
        title: '',
        icon: 'plus',
        href: '/admin/users/new'
      }];
  };

  ImportUsers.getRoutes = function (cb) {
    var routes = [
      {
        method: 'get',
        path: "/admin/users/import_users",
        auth_required: true,
        access_level: pb.SecurityService.ACCESS_EDITOR
      }];
    cb(null, routes);
  };

  pb.AdminSubnavService.unregisterFor(SUB_NAV_KEY, function () {
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ImportUsers.getSubNavItems);
  });

  //exports
  return ImportUsers;
};
