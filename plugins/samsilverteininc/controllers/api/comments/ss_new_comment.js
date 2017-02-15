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
    var util           = pb.util;
    var BaseController = pb.BaseController;
    
    /**
     * Creates a new comment
     */
    function SS_NewComment(){}
    util.inherits(SS_NewComment, pb.FormController);

    SS_NewComment.prototype.onPostParamsRetrieved = function(post, cb) {
        var self = this;

        var contentService = new pb.ContentService();
        contentService.getSettings(function(err, contentSettings) {
            if(!contentSettings.allow_comments) {
                cb({content: BaseController.apiResponse(BaseController.API_FAILURE, 'commenting not allowed'), code: 400});
                return;
            }

            var message = self.hasRequiredParams(post, ['article', 'content', 'comment_type']);
            if (message) {
                cb({content: BaseController.apiResponse(BaseController.API_FAILURE, 'parameters missing'), code: 400});
                return;
            }
            var commentType = {
                id: post.article
            };

            switch (post.comment_type) {
                case 'poll':
                    commentType.collection = 'poll_questions';
                    break;
                case 'article':
                    commentType.collection = 'article';
                    break;
                case 'question':
                    commentType.collection = 'questions';
                    break;
                default:
                    commentType.collection = '';
                    break;
            }

            var dao = new pb.DAO();
            dao.loadById(commentType.id, commentType.collection, function(err, article) {
                if(util.isError(err) || article == null) {
                    cb({content: BaseController.apiResponse(BaseController.API_FAILURE, commentType.collection + ' does not exist'), code: 400});
                    return;
                }

                var commentDocument       = pb.DocumentCreator.create('comment', post);
                commentDocument.commenter = self.session.authentication.user_id;

                dao.save(commentDocument, function(err, data) {
                    if (util.isError(err)) {
                        return cb({content: BaseController.apiResponse(BaseController.API_FAILURE, 'error saving'), code: 500});
                    }

                    var timestamp  = pb.ContentService.getTimestampTextFromSettings(commentDocument.created, contentSettings, self.ls);
                    commentDocument.timestamp = self.localizationService.localize(['timestamp'], timestamp);
                    cb({content: BaseController.apiResponse(BaseController.API_SUCCESS, 'comment created' , commentDocument)});
                });
            });
        });
    };
    SS_NewComment.getRoutes = function (cb) {
        var routes = [
            {
                method: 'post',
                path: "/api/comments/ss_new_comment",
                auth_required: true,
                access_level: pb.SecurityService.ACCESS_EDITOR
            }
        ];
        cb(null, routes);
    };
    //exports
    return SS_NewComment;
};
