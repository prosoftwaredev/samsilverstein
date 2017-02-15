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

    this.questionService = new QuestionService();
  }

  util.inherits(ManageQuestions, pb.BaseController);

  //statics
  var SUB_NAV_KEY = 'manage_questions_objects';

  ManageQuestions.prototype.render = function (cb) {
    var self = this;

    self.questionService.getQuestionTypeId(function (err, uidQuestionType) {

      if (!pb.validation.isIdStr(uidQuestionType, true)) {
        return this.reqHandler.serve404();
      }

      var service = new pb.CustomObjectService();
//
      service.loadTypeById(uidQuestionType, function (err, custObjType) {
        if (util.isError(err)) {
          return self.serveError(err);
        }
        else if (!util.isObject(custObjType)) {
          return self.reqHandler.serve404();
        }

        self.questionService.getAllQuestions(function (err, customObjects) {

          //none to manage
          if (customObjects.length === 0) {
            return self.redirect(pb.UrlService.urlJoin('/admin/content/questions/new'), cb);
          }


          var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'manage_objects', custObjType);
          for (var i = 0; i < pills.length; i++) {
            if (pills[i].name == 'manage_objects') {
              pills[i].title += ' (' + customObjects.length + ')';
              break;
            }
          }

          var angularObjects = pb.ClientJs.getAngularObjects({
            navigation: pb.AdminNavigation.get(self.session, ['content', 'questions'], self.ls),
            pills: pills,
            customObjects: customObjects,
            objectType: custObjType
          });

          var title = self.ls.get('MANAGE') + ' ' + custObjType.name;
          self.setPageName(title);
          self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
          self.ts.load('admin/content/questions/manage_questions', function (err, result) {
            cb({
              content: result
            });
          });
        });

      });
//
    });

  };

  ManageQuestions.getSubNavItems = function (key, ls, data) {
    return [{
        name: 'manage_objects',
        title: ls.get('MANAGE') + ' ' + data.name + ' ' + ls.get('OBJECTS'),
        icon: 'chevron-left',
        href: '/admin/content/questions'
      }
      , {
        name: 'new_object',
        title: '',
        icon: 'plus',
        href: '/admin/content/questions/new'
      }];
  };

  ManageQuestions.getRoutes = function (cb) {
    var routes = [
      {
        path: "/admin/content/questions",
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
