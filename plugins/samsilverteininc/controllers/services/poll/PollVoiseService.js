module.exports = function (pb) {

  var util = pb.util;
  var util = pb.util;
  var BaseController = pb.BaseController;

  function PollVoiseService() {


    this.cos = new pb.CustomObjectService();
    this.dao = new pb.DAO();
  }

  PollVoiseService.getRoutes = function (cb) {
    var routes = [];
    cb(null, routes);
  };

  return PollVoiseService;
};