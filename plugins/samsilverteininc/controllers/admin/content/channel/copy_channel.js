//dependencies

var async = require('async');

module.exports = function (pb) {

    //pb dependencies
    var util = pb.util;
    var ss_baseController = require('./../../../baseController.js')(pb);

    function CopyChannelController() {
        var ChannelService = require('./../../../services/ChannelService.js')(pb);
        var OrganizationService = require('./../../../services/OrganizationService.js')(pb);

        this.cos = new pb.CustomObjectService();
        this.channelService = new ChannelService();
        this.organizationService = new OrganizationService();
    }

    util.inherits(CopyChannelController, ss_baseController);

    var SUB_NAV_KEY = 'copy_channel';

    CopyChannelController.prototype.render = function (cb) {
        var self = this;
        var vars = this.pathVars;

        if (!pb.validation.isIdStr(vars.type_id, true)) {
            return self.redirect('/admin/content/objects/types', cb);
        }

        this.gatherData(vars, function (err, data) {
            if (util.isError(err)) {
                return self.reqHandler.serveError(err);
            }
            else if (!data.customObject) {
                return self.reqHandler.serve404();
            }

            data.pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY, {
                objectType: self.objectType,
                customObject: self.customObject
            });
        });

    };

    CopyChannelController.prototype.gatherData = function (vars , cb) {
        var self = this;

        var tasks = {
            tabs: function (callback) {
                var tabs = [{
                    active: 'active',
                    href: '#object_fields',
                    icon: 'list-ul',
                    title: self.ls.get('FIELDS')
                }];
            },
            navigation: function (callback) {
                callback(null, pb.AdminNavigation.get(self.session, ['content', 'channel'], self.ls));
            }
        };
        async.series(tasks, function (err, data) {
            cb(null, data);
        });
    };


    CopyChannelController.getSubNavItems = function (ls, data) {
        return [
            {
                name: 'manage_objects',
                title: data.customObject[pb.DAO.getIdField()] ? ls.get('EDIT') + ' ' + data.customObject.name : ls.get(
                    'NEW') + ' ' + 'channel',
                icon: 'chevron-left',
                href: '/admin/content/channel'
            }
        ];
    };


    CopyChannelController.getRoutes = function (cb) {
        var routes = [
            {
                path: "/admin/content/copy_channel/copy_channel/:id",
                access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
                auth_required: true,
                handler: 'render',
                content_type: 'text/html'
            }
        ];
        cb(null, routes);
    };


    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, CopyChannelController.getSubNavItems);

    return CopyChannelController;

};
