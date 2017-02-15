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

module.exports = function (pb) {

  //pb dependencies
  var util = pb.util;

  /**
   * Interface for managing objects
   * @class ManageQuestions
   * @constructor
   * @extends BaseController
   */
  function ManageQuestions() {
    var QuestionService = require('./../../../services/QuestionService.js')(pb);
    var PollService = require('./../../../services/PollService.js')(pb);

    this.pollService = new PollService();
    this.questionService = new QuestionService();
  }

  util.inherits(ManageQuestions, pb.BaseController);

  //statics
  var SUB_NAV_KEY = 'manage_polls';

  ManageQuestions.prototype.render = function (cb) {
    var self = this;

    self.pollService.loadAllPoll(function (err, customObjects) {

      //none to manage
      if (customObjects.length === 0) {
        return self.redirect(pb.UrlService.urlJoin('/admin/content/polls/new'), cb);
      }


      var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'manage_objects', {
        name: 'polls'
      });
      for (var i = 0; i < pills.length; i++) {
        if (pills[i].name == 'manage_objects') {
          pills[i].title += ' (' + customObjects.length + ')';
          break;
        }
      }

      var angularObjects = pb.ClientJs.getAngularObjects({
        navigation: pb.AdminNavigation.get(self.session, ['content', 'polls'], self.ls),
        pills: pills,
        customObjects: customObjects
      });

      var title = self.ls.get('MANAGE') + ' ' + 'polls';
      self.setPageName(title);
      self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));

      self.ts.load('admin/content/polls/manage_polls', function (err, result) {
        cb({
          content: result
        });
      });
    });

  };

  ManageQuestions.getSubNavItems = function (key, ls, data) {
    return [{
        name: 'manage_objects',
        title: ls.get('MANAGE') + ' ' + data.name,
        icon: 'chevron-left',
        href: '/admin/content/polls'
      }
      , {
        name: 'new_object',
        title: '',
        icon: 'plus',
        href: '/admin/content/polls/new'
      }];
  };

  ManageQuestions.getRoutes = function (cb) {
    var routes = [
      {
        path: "/admin/content/polls",
        access_level: pb.SecurityService.ACCESS_WRITER,
        auth_required: true,
        handler: 'render',
        content_type: 'text/html'
      }];
    cb(null, routes);
  };
  //register admin sub-nav
  pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManageQuestions.getSubNavItems);

  //exports
  return ManageQuestions;
};
