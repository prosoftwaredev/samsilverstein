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
    * Interface for creating and editing articles
    */
   function SS_ArticleForm() {
      var ChannelService = require('./../../../services/ChannelService.js')(pb);

      this.channelService = new ChannelService();
   }
   util.inherits(SS_ArticleForm, pb.BaseController);

   SS_ArticleForm.prototype.render = function (cb) {
      var self = this;
      var vars = this.pathVars;
      this.vars = vars;

      self.gatherData(vars, function (err, results) {
         if (util.isError(err)) {
            throw err;
         }
         else if (!results.article) {
            self.reqHandler.serve404();
            return;
         }

         self.article = results.article;
         if (!self.article.author) {
            self.article.author =
              self.session.authentication.user[pb.DAO.getIdField()].toString();
         }

         if (self.session.authentication.user.admin >= pb.SecurityService.ACCESS_EDITOR) {
            pb.users.getWriterOrEditorSelectList(self.article.author, true, function (err,
              availableAuthors) {
               if (availableAuthors && availableAuthors.length > 1) {
                  results.availableAuthors = availableAuthors;
               }
               self.finishRender(results, cb);
            });
            return;
         }

         self.finishRender(results, cb);
      });
   };

   SS_ArticleForm.prototype.finishRender = function (results, cb) {
      var self = this;

      var tabs = self.getTabs();

      self.setPageName(self.article[pb.DAO.getIdField()] ? self.article.headline
        : self.ls.get('NEW_ARTICLE'));
      self.ts.registerLocal('angular_script', '');

      self.ts.registerLocal('angular_objects', new pb.TemplateValue(self.getAngularObjects(tabs, results), false));

      self.ts.load('admin/content/articles/article_form', function (err, data) {
         self.onTemplateRetrieved('' + data, function (err, data) {
            var result = '' + data;
            self.checkForFormRefill(result, function (newResult) {
               result = newResult;
               cb({
                  content: result
               });
            });
         });
      });
   };

   SS_ArticleForm.prototype.onTemplateRetrieved = function (template, cb) {
      cb(null, template);
   };

   SS_ArticleForm.prototype.getAngularObjects = function (tabs, data) {
      var self = this;
      if (data.article[pb.DAO.getIdField()]) {
         var media = [];
         var i, j;

         for (i = 0; i < data.article.article_media.length; i++) {
            for (j = 0; j < data.media.length; j++) {
               if (pb.DAO.areIdsEqual(data.media[j][pb.DAO.getIdField()],
                 data.article.article_media[i])) {
                  media.push(data.media[j]);
                  data.media.splice(j, 1);
                  break;
               }
            }
         }
         data.article.article_media = media;

         var sections = [];
         for (i = 0; i < data.article.article_sections.length; i++) {
            for (j = 0; j < data.sections.length; j++) {
               if (pb.DAO.areIdsEqual(data.sections[j][pb.DAO.getIdField()],
                 data.article.article_sections[i])) {
                  sections.push(data.sections[j]);
                  data.sections.splice(j, 1);
                  break;
               }
            }
         }
         data.article.article_sections = sections;

//         var topics = [];
//         for (i = 0; i < data.article.article_topics.length; i++) {
//            for (j = 0; j < data.topics.length; j++) {
//               if (pb.DAO.areIdsEqual(data.topics[j][pb.DAO.getIdField()],
//                 data.article.article_topics[i])) {
//                  topics.push(data.topics[j]);
//                  data.topics.splice(j, 1);
//                  break;
//               }
//            }
//         }
//         data.article.article_topics = topics;

      }
      data.article.author_organization = self.session.authentication.user.organization;

      var objects = {
         navigation: pb.AdminNavigation.get(this.session, ['content', 'articles'], this.ls),
         pills: pb.AdminSubnavService.get(this.getActivePill(), this.ls, this.getActivePill(), data),
         tabs: tabs,
         templates: data.templates,
         sections: data.sections,
//         topics: data.topics,
         media: data.media,
         article: data.article,
         channels: data.channels,
         actions_url: '/actions/admin/content/articles',
         post_url: '/admin/content/articles'
      };

      if (data.availableAuthors) {
         objects.availableAuthors = data.availableAuthors;
      }
      return pb.ClientJs.getAngularObjects(objects);
   };

   SS_ArticleForm.getSubNavItems = function (key, ls, data) {
      return [{
            name: 'manage_articles',
            title: data.article[pb.DAO.getIdField()] ? ls.get(
              'EDIT') + ' ' + data.article.headline : ls.get('NEW_ARTICLE'),
            icon: 'chevron-left',
            href: '/admin/content/articles'
         }, {
            name: 'new_article',
            title: '',
            icon: 'plus',
            href: '/admin/content/articles/new'
         }];
   };

   SS_ArticleForm.prototype.getActivePill = function () {
      return 'new_article';
   };

   SS_ArticleForm.prototype.gatherData = function (vars, cb) {
      var self = this;
      var dao = new pb.DAO();
      var tasks = {
         templates: function (callback) {
            callback(null, pb.TemplateService.getAvailableContentTemplates());
         },
         sections: function (callback) {
            var opts = {
               select: pb.DAO.PROJECT_ALL,
               where: {
                  type: {
                     $in: ['container', 'section']
                  }
               },
               order: {
                  name: pb.DAO.ASC
               }
            };
            var where = {
               type: {
                  $in: ['container', 'section']
               }
            };
            dao.q('section', opts, callback);
         },
//         topics: function (callback) {
//            var opts = {
//               select: pb.DAO.PROJECT_ALL,
//               where: pb.DAO.ANYWHERE,
//               order: {
//                  name: pb.DAO.ASC
//               }
//            };
//            dao.q('topic', opts, callback);
//         },
         channels: function (callback) {
            self.channelService.getChannelsForUserById(self.session.authentication.user_id, callback, {
               userBelongsToOrganization: true
            });
         },
         media: function (callback) {
            var mservice = new pb.MediaService();
            mservice.get(callback);
         },
         article: function (callback) {
            if (!pb.validation.isIdStr(vars.id, true)) {
               callback(null, {});
               return;
            }

            //TODO call article service
            dao.loadById(vars.id, 'article', callback);
         }
      };
      async.parallelLimit(tasks, 2, cb);
   };

   SS_ArticleForm.prototype.getTabs = function () {
      var router = [
         {
            active: 'active',
            href: '#content',
            icon: 'quote-left',
            title: this.ls.get('CONTENT')
         },
         {
            href: '#media',
            icon: 'camera',
            title: this.ls.get('MEDIA')
         }
         //,{
         //   href: '#sections_dnd',
         //   icon: 'th-large',
         //   title: this.ls.get('SECTIONS')
         //}
//         , {
//            href: '#topics_dnd',
//            icon: 'tags',
//            title: this.ls.get('TOPICS')
//         },
//         {
//            href: '#seo',
//            icon: 'tasks',
//            title: this.ls.get('SEO')
//         }
      ];

      return router;
   };

   SS_ArticleForm.getRoutes = function (cb) {
      var routes = [
         {
            method: 'get',
            path: "/admin/content/articles/new",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            content_type: 'text/html'
         }, {
            method: 'get',
            path: "/admin/content/articles/:id",
            access_level: pb.SecurityService.ACCESS_WRITER,
            auth_required: true,
            content_type: 'text/html'
         }];
      cb(null, routes);
   };

   //register admin sub-nav
//   pb.AdminSubnavService.registerFor('new_article', SS_ArticleForm.getSubNavItems);

   //exports
   return SS_ArticleForm;
};
