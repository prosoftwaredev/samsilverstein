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

module.exports = function(pb) {
    
    //pb dependencies
    var util = pb.util;
    var c_baseController = require('./../../../baseController.js')(pb);
    /**
     * Interface for managing comments
     */
    function SS_ManageComments() {

    }
    util.inherits(SS_ManageComments, c_baseController);

    /**
     *
     * @private
     * @static
     * @property SUB_NAV_KEY
     * @type {String}
     */
    var SUB_NAV_KEY = 'ss_manage_comments';

    /**
     * @see BaseController.render
     * @method render
     * @param {Function} cb
     */
    SS_ManageComments.prototype.render = function(settings, cb) {
        var self = this;

        //query for comments (limited to 500)
        var opts = settings.opts;
        var dao  = new pb.DAO();
        dao.q('comment', opts, function(err, comments) {
            if (util.isError(err)) {
                return self.reqHandler.serveError(err);
            }

            //retrieve the content settings or defaults if they have not yet been configured
            var contentService = new pb.ContentService();
            contentService.getSettings(function(err, contentSettings) {
                //TODO handle error

                //retrieve any details
                self.getCommentDetails(comments, dao, function(commentsWithDetails) {
                    var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY);
                    var angularObjects = pb.ClientJs.getAngularObjects({
                        navigation: pb.AdminNavigation.get(self.session, ['content', 'comments'], self.ls),
                        pills: pills,
                        comments: commentsWithDetails,
                        allowComments: contentSettings.allow_comments
                    });

                    //load the template
                    self.setPageName(self.ls.get('MANAGE_COMMENTS'));
                    self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
                    self.ts.load('admin/content/comments/manage_comments', function(err, result) {
                        cb({content: result});
                    });
                });
            });
        });
    };

    SS_ManageComments.prototype.renderComments = function (cb) {
        var self = this;
        var type = self.pathVars.comments_type;
        switch (type) {
            case 'articles':
                self.renderArticlesComments(cb);
                break;
            case 'polls':
                self.renderPollsComments(cb);
                break;
            case 'questions':
                self.renderQuestionsComments(cb);
                break;
            default:
                self.renderArticlesComments(cb);
                break
        }

    };
    SS_ManageComments.prototype.renderArticlesComments = function (cb) {
        var self = this;
        var settings = {
            opts: {
                select: pb.DAO.PROJECT_ALL,
                where: {comment_type: 'article'},
                order: {created: -1},
                limit: 500
            }
        };
        self.render(settings, cb);
    };

    SS_ManageComments.prototype.renderPollsComments = function(cb) {
        var self = this;
        var settings = {
            opts: {
                where: {comment_type: 'poll'},
                order: {created: -1},
                limit: 500
            }
        };
        self.render(settings, cb);
    };

    SS_ManageComments.prototype.renderQuestionsComments = function(cb) {
        var self = this;
        var settings = {
            opts: {
                where: {comment_type: 'question'},
                order: {created: -1},
                limit: 500
            }
        };
        self.render(settings, cb);
    };

    /**
     *
     * @method getCommentDetails
     * @param {Array} comments
     * @param {DAO} dao
     * @param {Function} cb
     */
    SS_ManageComments.prototype.getCommentDetails = function(comments, dao, cb) {
        var self = this;

        if(comments.length === 0) {
            cb(comments);
            return;
        }

        this.getCommentingUser = function(index) {
            dao.loadById(comments[index].commenter, 'user', function(err, user) {
                if(!util.isError(err) && user !== null) {
                    comments[index].user_name = user.first_name + ' ' + user.last_name;
                }

                dao.loadById(comments[index].article, 'article', function(err, article) {
                    if(!util.isError(err) && article !== null) {
                        comments[index].article_url = article.url;
                        comments[index].article_headline = article.headline;
                    }

                    index++;
                    if(index >= comments.length) {
                        cb(comments);
                        return;
                    }

                    self.getCommentingUser(index);
                });
            });
        };

        this.getCommentingUser(0);
    };

    /**
     *
     * @static
     * @method getSubNavItems
     * @param {String} key
     * @param {Localization} ls
     * @param {*} data
     */
    SS_ManageComments.getSubNavItems = function(key, ls, data) {
        return [
            {
                name: SUB_NAV_KEY,
                title: "Articles Comments",
                /*icon: 'refresh',*/
                href: '/admin/content/comments/articles'
            },
            {
                name: SUB_NAV_KEY,
                title: "Polls Comments",
                /*icon: 'refresh',*/
                href: '/admin/content/comments/polls'
            },
            {
                name: SUB_NAV_KEY,
                title: "Questions Comments",
                /*icon: 'refresh',*/
                href: '/admin/content/comments/questions'
            }
        ];
    };

    SS_ManageComments.getRoutes = function (cb) {
        var routes = [
            {
                method: 'get',
                path: "/admin/content/comments",
                auth_required: true,
                handler: "renderComments",
                access_level: pb.SecurityService.ACCESS_EDITOR
            },
            {
                method: 'get',
                path: "/admin/content/comments/:comments_type",
                auth_required: true,
                handler: "renderComments",
                access_level: pb.SecurityService.ACCESS_EDITOR
            }
        ];
        cb(null, routes);
    };


    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, SS_ManageComments.getSubNavItems);

    //exports
    return SS_ManageComments;
};
