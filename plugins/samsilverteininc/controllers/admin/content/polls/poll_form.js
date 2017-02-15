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

//dependencies
var async = require('async');

module.exports = function (pb) {

  //pb dependencies
  var util = pb.util;

  /**
   * Interface for editing an object
   * @class PollFormController
   * @constructor
   */
  var PollService = require('./../../../services/PollService.js')(pb);
  var pollService = new PollService();

  function PollFormController() {
    var ChannelService = require('./../../../services/ChannelService.js')(pb);

    this.channelService = new ChannelService();
  }
  util.inherits(PollFormController, pb.BaseController);

  var SUB_NAV_KEY = 'pull_question_form';

  PollFormController.prototype.render = function (cb) {
    var self = this;
    var vars = this.pathVars;

    self.gatherData(vars, function (err, data) {
      if (util.isError(err)) {
        return self.reqHandler.serveError(err);
      }
      else if (!data.customObject) {
        return self.reqHandler.serve404();
      }

      self.customObject = data.customObject;

      data.pollForm = self.customObject;
      if (!('answers' in data.pollForm))
        data.pollForm.answers = [];

      data.pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY, {
//        objectType: self.objectType,
        customObject: self.customObject
      });
      var angularObjects = pb.ClientJs.getAngularObjects(data);

      self.setPageName('Polls'/*self.customObject[pb.DAO.getIdField()] ? self.customObject.name : self.ls.get(
       'NEW') + ' ' + self.objectType.name + ' ' + self.ls.get('OBJECT')*/);

      self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));

      self.ts.load('admin/content/polls/poll_form', function (err, result) {
        cb({
          content: result
        });
      });
    });

  };

  PollFormController.prototype.gatherData = function (vars, cb) {
    var self = this;
    var cos = new pb.CustomObjectService();

    var tasks = {
      tabs: function (callback) {
        var tabs = [
          {
            active: 'active',
            href: '#object_fields',
            icon: 'list-ul',
            title: self.ls.get('FIELDS')
          }
        ];

        callback(null, tabs);
      },
      user: function (callback) {
        callback(null, self.session.authentication.user);
      },
      channels: function (callback) {
        self.channelService.getChannelsForUserById(self.session.authentication.user_id, callback, {
          userBelongsToOrganization: true
        });
      },
      navigation: function (callback) {
        callback(null, pb.AdminNavigation.get(self.session, ['content', 'polls'], self.ls));
      },
      customObject: function (callback) {
        if (!vars.id) {
          callback(null, {});
          return;
        }
        pollService.loadQuestionById(vars.id,
          function (err, question) {
            callback(err, question);
          });
      }
    };
    async.series(tasks, cb);
  };

  PollFormController.getSubNavItems = function (key, ls, data) {
    return [
      {
        name: 'manage_objects',
        title: 'New poll',
        icon: 'chevron-left',
        href: '/admin/content/polls'
      },
      {
        name: 'new_object',
        title: '',
        icon: 'plus',
        href: '/admin/content/polls/new'
      }
    ];
  };

  PollFormController.getRoutes = function (cb) {
    var routes = [
      {
        path: "/admin/content/polls/new",
        access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
        auth_required: true,
        handler: 'render',
        content_type: 'text/html'
      }
      , {
        path: "/admin/content/polls/:id",
        access_level: pb.SecurityService.ACCESS_ADMINISTRATOR,
        auth_required: true,
        handler: 'render',
        content_type: 'text/html'
      }
    ];
    cb(null, routes);
  };

  //register admin sub-nav
  pb.AdminSubnavService.registerFor(SUB_NAV_KEY, PollFormController.getSubNavItems);

  //exports
  return PollFormController;
};
