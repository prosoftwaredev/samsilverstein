module.exports = function (pb) {

  //pb dependencies
  var util = pb.util;

  /**
   * Creates an object
   * @class NewChannelController
   * @constructor
   * @extends BaseController
   */
  function NewChannelController() {
  }
  util.inherits(NewChannelController, pb.BaseController);

  NewChannelController.prototype.render = function (cb) {
    var self = this;
    var vars = this.pathVars;

    if (!vars.type_id) {
      cb({
        code: 400,
        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
      });
      return
    }

    var service = new pb.CustomObjectService();
    service.loadTypeById(vars.type_id, function (err, customObjectType) {
      if (util.isError(err) || !util.isObject(customObjectType)) {
        return cb({
          code: 400,
          content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
        });
      }

      self.customObjectType = customObjectType;

      //format the incoming object
      self.getJSONPostParams(function (err, post) {
        pb.CustomObjectService.formatRawForType(post, customObjectType);
        var customObjectDocument = pb.DocumentCreator.create('custom_object', post);

        //validate and persist the object
        service.save(customObjectDocument, customObjectType, function (err, result) {
          if (util.isError(err)) {
            return cb({
              code: 500,
              content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
            });
          }
          else if (util.isArray(result) && result.length > 0) {
            return cb({
              code: 400,
              content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'), result)
            });
          }

          cb({
            content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, customObjectDocument.name + ' ' + self.ls.get('CREATED'), result)
          });
        });
      });
      
    });
  };

  NewChannelController.getRoutes = function (cb) {
    var routes = [
      {
        method: 'post',
        path: "/actions/admin/content/channel/:type_id",
        handler: 'render',
        access_level: pb.SecurityService.ACCESS_EDITOR,
        auth_required: true,
        content_type: 'text/html'
      }];
    cb(null, routes);
  };

  //exports
  return NewChannelController;
};
