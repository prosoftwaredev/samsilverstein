module.exports = function (pb) {

   //pb dependencies
   var util = pb.util;

   /**
    * Creates a new article
    */
   function SS_NewArticlePostController() {
      var ChannelService = require('./../../../../services/ChannelService.js')(pb);

      this.channelService = new ChannelService();
   }

   util.inherits(SS_NewArticlePostController, pb.BaseController);

   var getSectionID = function(sectionKEY, callback){
      var dbTableName = 'section';
      var opts = {
         select: pb.DAO.PROJECT_ALL,
         where: {
            url: sectionKEY
         },
         limit: 1,
         offset: 0
         //order: {
         //   created: pb.DAO.ASC
         //}
      };

      dao.q(dbTableName, opts, function (err, sections) {
         callback(err, sections[0]._id.toJSON());
      });
   };
   var dao = new pb.DAO();

   SS_NewArticlePostController.prototype.newArticles = function(cb){
      var self = this;
      getSectionID('challenges', function(err, sectionID){
         self.makeNew(sectionID, cb);
      });
   };

   SS_NewArticlePostController.prototype.newContent = function(cb){
      var self = this;
      getSectionID('content', function(err, sectionID){
         self.makeNew(sectionID, cb);
      });
   };

   SS_NewArticlePostController.prototype.makeNew = function(sectionID, cb) {
      var self = this;

      this.getJSONPostParams(function (err, post) {
         if (self.session.authentication.user.admin < pb.SecurityService.ACCESS_EDITOR || !post.author) {
            post.author = self.session.authentication.user[pb.DAO.getIdField()];
         }

         post.article_sections = [sectionID];
         post.publish_date = new Date(parseInt(post.publish_date));
         delete post[pb.DAO.getIdField()];

         var message = self.hasRequiredParams(post, self.getRequiredFields());
         if (message) {
            return cb({
               code: 400,
               content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)
            });
         }

         post = pb.DocumentCreator.formatIntegerItems(post, ['draft']);


         var articleDocument = pb.DocumentCreator.create('article', post, ['meta_keywords'
         ]);
         pb.RequestHandler.isSystemSafeURL(articleDocument.url, null, function (err,
           isSafe) {
            if (util.isError(err) || !isSafe) {
               cb({
                  code: 400,
                  content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE,
                    self.ls.get('EXISTING_URL'))
               });
               return;
            }

            var dao = new pb.DAO();
            dao.save(articleDocument, function (err, result) {
               if (util.isError(err)) {
                  return cb({
                     code: 500,
                     content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE,
                       self.ls.get('ERROR_SAVING'))
                  });
               }

               cb({
                  content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS,
                    articleDocument.headline + ' ' + self.ls.get('CREATED'), result)
               });
            });
         });
      });
   };

   SS_NewArticlePostController.prototype.getRequiredFields = function () {
      return ['url', 'headline', 'article_layout'];
   };

   SS_NewArticlePostController.prototype.getSanitizationRules = function () {
      return {
         article_layout: pb.BaseController.getContentSanitizationRules()
      };
   };

   SS_NewArticlePostController.getRoutes = function (cb) {
      var routes = [
         {
            method: 'post',
            path: "/actions/admin/content/articles",
            access_level: pb.SecurityService.ACCESS_WRITER,
            handler: 'newArticles',
            auth_required: true,
            content_type: 'text/html'
         },
         {
            method: 'post',
            path: "/actions/admin/content/content",
            access_level: pb.SecurityService.ACCESS_WRITER,
            handler: 'newContent',
            auth_required: true,
            content_type: 'text/html'
         }];

      cb(null, routes);
   };

   //exports
   return SS_NewArticlePostController;
};
