var json2csv = require('json2csv');
var async = require('async');
var http = require('http');
var path = require('path');
var url = require('url');
var fs = require('fs');

module.exports = function (pb) {
    //pb dependencies
    var util = pb.util;
    var file_name = 'users';
    var ext = 'csv';

    function ExportUsers() {
        var UsersService = require('./../../services/UsersService.js')(pb);
        var OrganizationService = require('./../../services/OrganizationService.js')(pb);

        this.usersService = new UsersService();
        this.organizationService = new OrganizationService();
    }

    util.inherits(ExportUsers, pb.BaseController);

    ExportUsers.prototype.render = function (cb) {
        var self = this;

        self.gatherData(function (err, data) {
            if (util.isError(err)) {
                throw err;
            }
            if (data) {

                var users = data.users;

                var excluded_fields = ['user_appUserType', 'password', '_id'];

                var fields = self.getFields(users[0], excluded_fields);

                //extend description organizations of users
                (function (users, organizations) {
                    var iUser = 0, iOrg = 0;
                    for (iUser = 0; users.length > iUser; iUser++) {
                        for (iOrg = 0; organizations.length > iOrg; iOrg++) {
                            if (data.users[iUser].organization == organizations[iOrg]._id.toJSON())
                                data.users[iUser].organization = organizations[iOrg].name;
                        }
                    }
                })(data.users, data.organizations);

                //Excluded fields
                (function (users) {
                    for (var i in users) {
                        var keys = Object.keys(users[i]);
                        for (var j in excluded_fields) {
                            if (keys.indexOf(excluded_fields[j]) != -1) {
                                delete users[i][excluded_fields[j]];
                            }
                        }
                    }
                })(data.users);

                //export to cvs
                json2csv({data: users, fields: fields}, function (err, csv) {
                    if (err) console.log(err);
                    return cb({
                        content: {
                            content: csv,
                            filename: file_name,
                            ext: ext
                        }
                    });
                });
            } else {
                return cb({
                    code: 500,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_DELETING'))
                });
            }
        });
    };

    ExportUsers.prototype.getFields = function(user, excluded_field) {
        var fields = Object.keys(user);

            for (var f in excluded_field) {
                var i = fields.indexOf(excluded_field[f]);
                if (i != -1) {
                    fields.splice(i, 1);
                }
            }
        return fields;
    };

    ExportUsers.prototype.gatherData = function (cb) {
        var self = this;
        var tasks = {
            users: function (callback) {
                var where = {};
                where.admin = {
                    $lte: self.session.authentication.user.admin
                };
                /*where = self.permissionQueryUser(where);
                 self.permissionQueryUser(where);*/
                var opts = {
                    where: where
                };

                var dao = new pb.DAO();
                dao.q('user', opts, function (err, users) {
                    if (util.isError(err)) {
                        return self.reqHandler.serveError(err);
                    } else if (users.length === 0) {
                        return self.redirect('/admin/users', cb);
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


    ExportUsers.getRoutes = function (cb) {
        var routes = [
            {
                method: 'get',
                path: "/api/user/export_users",
                auth_required: true,
                access_level: pb.SecurityService.ACCESS_EDITOR
            }
        ];
        cb(null, routes);
    };
    //exports
    return ExportUsers;
};
