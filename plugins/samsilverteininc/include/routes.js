var path = require('path');

//exports
module.exports = function Routes(pb) {
  return [
    /*
     * actions
     * /
     */
    // articles
    {
     method: 'get',
     path: "/channels/:idChannel/all",
     handler: 'render',
     access_level: 0,
     auth_required: false,
     content_type: 'text/html',
     controller: path.join(pb.config.docRoot, 'samsilverteininc', 'controllers', 'channels.js')
    }
    ];
};