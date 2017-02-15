var async = require('async');

module.exports = function AdminIndexControllerModule(pb) {
  var util = pb.util;
  var OrganizationService = require('./services/OrganizationService.js')(pb);
  var ChannelService = require('./services/ChannelService.js')(pb);
  var organizationService = new OrganizationService();
  var channelService = new ChannelService();
  function BaseController() {
  }
  util.inherits(BaseController, pb.BaseController);
  /*
   *  private method
   */

  var getUserById = function (uidUser, callback) {
    var dao = new pb.DAO();
    var opts = {
      select: pb.DAO.PROJECT_ALL,
      where: {
        _id: pb.DAO.getObjectID(uidUser)
      },
      order: {
        name: pb.DAO.ASC
      }
    };
    dao.q('user', opts, function (err, user) {
      var user = user;
      if (user[0] !== undefined) {
        user = user[0];
      }

      callback(null, user);
    });
  };

  var getAllChannals = function (cb) {
    var customObjectService = new pb.CustomObjectService();
    var dao = new pb.DAO();
    async.waterfall([
      function (callback) {
        customObjectService.loadTypeByName('channel_obj', function (err, channalsType) {
          callback(null, channalsType);
        });
      }, function (channalsType, callback) {
        var opts = {
          select: pb.DAO.PROJECT_ALL,
          where: {
            type: channalsType._id.toJSON()
          },
          order: {
            name: pb.DAO.ASC
          }
        };
        dao.q('custom_object', opts, function (err, channel) {
          callback(null, channel);
        });
      }
    ], function (err, result) {
      cb(err, result);
    });
  };

  var getAllChannalType = function (cb) {
    var customObjectService = new pb.CustomObjectService();
    var dao = new pb.DAO();
    async.waterfall([
      function (callback) {
        customObjectService.loadTypeByName('channel_type', function (err, channalsType) {
          callback(null, channalsType);
        });
      }, function (channalsType, callback) {
        var opts = {
          select: pb.DAO.PROJECT_ALL,
          where: {
            type: channalsType._id.toJSON()
          },
          order: {
            level: pb.DAO.ASC
          }
        };
        dao.q('custom_object', opts, function (err, channel) {
          callback(null, channel);
        });
      }
    ], function (err, result) {
      cb(err, result);
    });
  };
  
  
  /*
   * Services
   */
  BaseController.prototype.getAllContentService = function(pb){
	return require('./services/AllContentService.js')(pb);
  };
  
  /*
   * Users
   */

  BaseController.prototype.permissionQueryUser = function (where) {
    var self = this;
    if (where === undefined)
      var where = {};
    if (self.session.authentication.user.admin <= 3)
      where.user_channel = self.session.authentication.user.user_channel;
    return where;
  };
  BaseController.prototype.userIsSigned = function (modelUser) {
    var self = this;
    var result = false;
    if (modelUser === undefined) {
      modelUser = self.session.authentication.user;
    }

    if (new Date(modelUser.signed_before) > new Date() || modelUser.admin > 2)
      result = true;
    return result;
  };
  BaseController.prototype.user = {
    getUserById: getUserById,
    getSignedDateById: function (uidUser, cb) {
      /* User types
       * 0 - Free
       * 1 - Organizational Developmenthennel
       * 2 - Premium
       */
      var dao = new pb.DAO();
      var customObjectService = new pb.CustomObjectService();
      async.waterfall([
        function (callback) {
          var opts = {
            select: pb.DAO.PROJECT_ALL,
            where: {
              _id: pb.DAO.getObjectID(uidUser)
            },
            order: {
              name: pb.DAO.ASC
            }
          };
          dao.q('user', opts, function (err, user) {
            var user = user;
            if (user[0] !== undefined) {
              user = user[0];
            }

            callback(null, user);
          });
        },
        function (user, callback) {
          var appUserTypeId = user.user_appUserType;
          var opts = {
            select: pb.DAO.PROJECT_ALL,
            where: {},
            order: {
              name: pb.DAO.ASC
            }
          };
          customObjectService.loadById(pb.DAO.getObjectID(appUserTypeId), opts, function (err, channel) {
            callback(null, channel, user);
          });
        },
      ], function (err, appUserTypeId, user) {

        var getDateChannel = function (uidChannel, callback) {
          var opts = {
            select: pb.DAO.PROJECT_ALL,
            where: {},
            order: {
              name: pb.DAO.ASC
            }
          };
          customObjectService.loadById(pb.DAO.getObjectID(uidChannel), opts, function (err, channel) {
            callback(null, channel.date);
          });
        };
        switch (parseInt(appUserTypeId.level)) {
          case 2: // Organizational Developmenthennel   
            getDateChannel(user.user_channel, cb);
            break
          case 1: // Premium
            cb(err, user.signed_before);
            break
          default:
            cb(err, null);
        }
      });
    }
  };
  /*
   * Channels
   */
  BaseController.prototype.isQuestion = function (data) {
    if (data.object_type == 'questions')
      return true;
    return false;
  };

  BaseController.prototype.getOrganizationIdForUser = function () {
    var channel = [];
    var self = this;
    if (this.session.authentication.user
      && this.session.authentication.user.user_channel
      && self.userIsSigned()
      ) {
      channel.push(this.session.authentication.user.user_channel); //!!
    }

    return channel;
  };
  // old - need remove
  BaseController.prototype.getChannelsForUserById = function (uidUser, cb) {
    var self = this;
    async.waterfall([
      function (callback) {
        async.parallel({
          user: function (parCallback) {
            getUserById(uidUser, parCallback);
          },
          channalsFreeType: function (parCallback) {
            getAllChannalType(function (err, chennals) {
              var result = [];
              var i = 0;
              var iChennal = {};
              for (i = 0; i < chennals.length; i++) {
                iChennal = chennals[i];
                if (iChennal.level <= 0)
                  result.push(iChennal._id.toString());
              }

              parCallback(null, result);
            });
          },
          channals: function (parCallback) {
            getAllChannals(parCallback);
          }
        },
        function (err, result) {
          callback(null, result);
        });
      },
      function (result, callback) {
        // get User channel
        var dao = new pb.DAO();
        var opts = {
          select: pb.DAO.PROJECT_ALL,
          where: {
            _id: pb.DAO.getObjectID(result.user.user_channel)
          },
          order: {
            name: pb.DAO.ASC
          }
        };
        dao.q('custom_object', opts, function (err, channel) {
          if (channel[0] !== undefined) {
            channel = channel[0];
          } else {
            channel = null;
          }

          result.user_channel = channel;
          callback(null, result);
        });
      },
      function (result, callback) {
        var channels = [];
        var iCahnnel = {};
        var i = 0;
        var find = function (array, value) {
          if (array.indexOf) { // если метод существует
            return array.indexOf(value);
          }

          for (var i = 0; i < array.length; i++) {
            if (array[i] === value) return i;
          }

          return -1;
        };
        for (i = 0; i < result.channals.length; i++) {
          iCahnnel = result.channals[i];
          if ((result.user_channel && iCahnnel._id.toJSON() == result.user_channel._id.toJSON()) || find(
            result.channalsFreeType,
            iCahnnel.channel) > -1)
            channels.push(iCahnnel);
        }

        callback(null, channels);
      }
    ], function (err, channels) {
      return cb(null, channels);
    });
  };
  /*
   *  Articles
   */

  BaseController.prototype.isArticle = function (data) {
    if (data.object_type == 'article')
      return true
    return false;
  };
  
  BaseController.prototype.isPoll = function (data) {
    if (data.object_type == 'poll_questions')
      return true
    return false;
  };
  
  

  BaseController.prototype.permissionQueryArticle = function (where) {
    var self = this;
    if (self.session.authentication.user.admin <= 3)
      where.channel = self.session.authentication.user.user_channel;
    return where;
  };

  BaseController.prototype.getAffordableArticles = function (uidUser, where, cb, extend) {
    var self = this;
    var articleService = new pb.ArticleService();
//      var sectionService = new pb.SectionService();
//      var userchannel = self.getOrganizationIdForUser();
    var extend = (extend) ? true : false;
    var dao = new pb.DAO();

    var cbGetArticle = function (err, articleObj) {
      if (!extend) {
        cb(null, articleObj);
      } else {
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
        dao.q('section', opts, function (
          err,
          sectionObjs) {
          var i = 0;
          var j = 0;
          var k = 0;
          var curenSection = {};
          for (i = 0; articleObj.length > i; i++) {
            articleObj[i].section_description = [];
            for (j = 0; articleObj[i].article_sections.length > j; j++) {
              for (k = 0; sectionObjs.length > k; k++) {
                if (articleObj[i].article_sections[j] === sectionObjs[k]._id.toJSON())
                  curenSection = sectionObjs[k];
              }
            }
            articleObj[i].section_description.push(curenSection);
          }
          cb(null, articleObj);
        });
      }
    };

    async.waterfall([
      function (callback) {
        var wave = {};
        callback(null, wave);
      },
      function (wave, callback) {
        channelService.getChannelsForUserById(uidUser, function (err, channels) {
          wave.channels = channels;
          callback(null, wave);
        });
      },
      function (wave, callback) {
        var i = 0;
        var channels = wave.channels;
        var channelsId = [];
        for (i = 0; channels.length > i; i++) {
          channelsId.push(channels[i]._id.toJSON());
        }
        wave.channesId = channelsId;
        callback(null, wave);
      }
    ], function (err, result) {
      where.channel = {
        $in: result.channesId, //need Channel
      };

      where.object_type = "article";
      var options = {
        order: {
          created: pb.DAO.DESC
        }
      };

      articleService.find(where, options, cbGetArticle);
    });
  };

  /*
   * Routers
   */

  BaseController.getRoutes = function (cb) {
    var routes = [];
    cb(null, routes);
  };
  return BaseController;
};