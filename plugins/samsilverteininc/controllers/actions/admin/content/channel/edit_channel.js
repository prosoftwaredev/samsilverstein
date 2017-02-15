module.exports = function (pb) {

  //pb dependencies
  var util = pb.util;

  /**
   * Edits an object
   * @class EditChannel
   * @constructor
   * @extends FormController
   */
  function EditChannel() {
  }
  util.inherits(EditChannel, pb.BaseController);

  EditChannel.prototype.render = function (cb) {
    var self = this;
    var vars = this.pathVars;

    if (!pb.validation.isIdStr(vars.type_id, true) || !pb.validation.isIdStr(vars.id, true)) {
      cb({
        code: 400,
        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
      });
      return;
    }

    var service = new pb.CustomObjectService();
    service.loadById(vars.id, function (err, custObj) {
      if (util.isError(err) || !util.isObject(custObj)) {
        return cb({
          code: 400,
          content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
        });
      }

      //load the type definition
      service.loadTypeById(vars.type_id, function (err, custObjType) {
        if (util.isError(err) || !util.isObject(custObjType)) {
          return cb({
            code: 400,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
          });
        }

        self.customObjectType = custObjType;

        //format post fields

        self.getJSONPostParams(function (err, post) {
//          var post = self.body;
          pb.CustomObjectService.formatRawForType(post, custObjType);
          util.deepMerge(post, custObj);

          custObj.organization = post.organization;

          //validate and persist
          service.save(custObj, custObjType, function (err, result) {
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
              content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, custObj.name + ' ' + self.ls.get('EDITED'))
            });
          });

        });

      });
    });
  };

  EditChannel.getRoutes = function (cb) {
    var routes = [
      {
        method: 'post',
        path: "/actions/admin/content/channel/:type_id/:id",
        handler: 'render',
        access_level: pb.SecurityService.ACCESS_EDITOR,
        auth_required: true,
        content_type: 'text/html'
      }];
    cb(null, routes);
  };

  //exports
  return EditChannel;
};
