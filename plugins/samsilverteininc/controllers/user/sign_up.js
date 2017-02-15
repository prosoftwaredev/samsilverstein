module.exports = function SignUpModule(pb) {

  //pb dependencies
  var util = pb.util;

  /**
   * Interface for creating a new READER level user
   */
  function SS_SignUp() {
  }
  util.inherits(SS_SignUp, pb.BaseController);

  SS_SignUp.prototype.render = function (cb) {
    var self = this;

    var contentService = new pb.ContentService();
    contentService.getSettings(function (err, contentSettings) {
      if (!contentSettings.allow_comments) {
        self.redirect('/', cb);
        return;
      }

      self.ts.load('user/sign_up', function (err, data) {
        cb({
          content: self.ls.localize([], data)
        });
      });
    });
  };

  SS_SignUp.getRoutes = function (cb) {
    var routes = [
      {
        method: 'get',
        path: "/user/sign_up",
        handler: 'render',
        content_type: 'text/html'
      }
    ];
    cb(null, routes);
  };

  //exports
  return SS_SignUp;
};
