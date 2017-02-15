var fs = require('fs');
var formidable = require('formidable');
var async = require('async');
var xlsx = require('node-xlsx');

module.exports = function (pb) {

  var util = pb.util;

  function ImportUsersController() {
    var usersList = [];
    this.errored = 0;
  }

  util.inherits(ImportUsersController, pb.BaseController);

  ImportUsersController.prototype.render = function (cb) {
    var self = this;
    var organizationId = self.pathVars.organization;

    //set the limits on the file size
    var form = new formidable.IncomingForm();
    form.maxFieldSize = pb.config.media.max_upload_size;
    form.on('progress', function (bytesReceived, bytesExpected) {
      if (bytesReceived > pb.config.media.max_upload_size || bytesExpected > pb.config.max_upload_size) {
        if (!self.errored++) {
          this.emit('error', new Error(self.ls.get('FILE_TOO_BIG')));
        }
      }
    });

    //parse the form out and let us know when its done
    form.parse(this.req, function (err, fields, files) {
      if (util.isError(err)) {
        return self.onDone(err, null, files, cb);
      }

      var keys = Object.keys(files);
      if (keys.length === 0) {
        return self.onDone(new Error('No file inputs were submitted'), null, files, cb);
      }
      var fileDescriptor = files[keys[0]];

      var stream = fs.createReadStream(fileDescriptor.path);
      var mservice = new pb.MediaService();
      mservice.setContentStream(stream, fileDescriptor.name, function (err, sresult) {
        if (util.isError(err)) {
          return self.onDone(err, null, files, cb);
        }

        //write the response
        var content = {
          content: JSON.stringify({
            filename: sresult.mediaPath
          }),
          content_type: 'application/json'
        };

        self.onDone(null, content, files, cb);
      });
    });
  };

  ImportUsersController.prototype.onDone = function (err, content, files, cb) {
    var self = this;
    var organizationId = self.pathVars.organization;

    if (util.isFunction(files)) {
      cb = files;
      files = null;
    }
    if (!util.isObject(files)) {
      files = {};
    }

    //ensure all files are removed
    var self = this;
    var tasks = util.getTasks(Object.keys(files), function (fileFields, i) {
      return function (callback) {
        var fileDescriptor = files[fileFields[i]];

        //ensure file has a path to delete
        if (!fileDescriptor.path) {
          return callback();
        }
        var fileData = xlsx.parse(fileDescriptor.path);

        self.createNewUsers(fileData, organizationId, function (err, data) {
          //remove the file
          fs.unlink(fileDescriptor.path, function (err) {
            pb.log.info('Removed temporary file: %s', fileDescriptor.path);
            callback(err, data);
          });

        });

      };
    });

    async.parallel(tasks, function (error, results) {

      //weird case where formidable continues to process content even after
      //we cancel the stream with a 413.  This is a check to make sure we
      //don't call back again
      if (self.errored > 1) {
        return;
      }

      //we only care about the passed in error
      if (util.isError(err)) {
        var code = err.message === self.ls.get('FILE_TOO_BIG') ? 413 : 500;
        return cb({
          content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, err.message),
          code: code
        });
      }
      cb({
        content: JSON.stringify(results),
        content_type: 'application/json'
      });
    });
  };

  ImportUsersController.prototype.generatePassword = function () {
    var characters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '!', '@', '#', '$', '%', '^', '&', '*', '?'];

    var password = '';
    while (password.length < 12)
    {
      password = password.concat(characters[parseInt(Math.random() * characters.length)]);
    }

    return password;
  };

  ImportUsersController.prototype.createNewUsers = function (fileData, organizationId, cb) {
    var self = this;
    var AppUserTypeService = require('./../../services/AppUserTypeService.js')(pb);
    var appUserTypeService = new AppUserTypeService();

    var parseDataToUserObj = function (fileData, appUserTyopes) {

      var iRow = 0,
        iUser = {},
        users = [],
        randPas = 'test_pass',
        user_appUserType = '',
        appUserType = 0,
        iUserTypes = 0;

      for (iRow = 2; fileData.data.length > iRow; iRow++) { // iRow = 2 for miss tittle and tableTitle
        randPas = self.generatePassword();
        
        /* find userType id */
        appUserType = fileData.data[iRow][3];
        for (iUserTypes = 0; appUserTyopes.length > iUserTypes; iUserTypes++) {
          if (appUserTyopes[iUserTypes].level == appUserType) {
            user_appUserType = appUserTyopes[iUserTypes]._id.toJSON();
          }
        }
        /* end find userType id */
        
        iUser = new self.UserModel({
          first_name: fileData.data[iRow][0],
          last_name: fileData.data[iRow][1],
          username: fileData.data[iRow][0] + '_' + fileData.data[iRow][1],
          email: fileData.data[iRow][2],
          password: randPas,
          confirm_password: randPas,
          admin: 0,//fileData.data[iRow][3],
          user_appUserType: user_appUserType,
          organization: organizationId
        },
        self.hasRequiredParams);

        users.push(iUser.init());
      }

      return users;
    };

    var UserObj = function (fnCall) {
      this._user = {};
      this._fnCall = fnCall;
    };

    UserObj.prototype = {
      constructor: UserObj,
      setUser: function (user) {
        this._user = user;
        return true;
      },
      getTask: function () {
        var self = this;
        return function (callback) {

          self._fnCall(self._user, function (err, response) {
            callback(err, response);
          });

        };
      }
    };


    appUserTypeService.getAllType(function (err, appUserTyopes) {

      var userList = parseDataToUserObj(fileData[0], appUserTyopes);

      var addNewUser = function (userModel, callback) {
//      var message = self.hasRequiredParams(userModel, self.getRequiredFields());
//      if (message) {
//        cb({
//          code: 400,
//          content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
//        });
//        return;
//      }

        if (!pb.security.isAuthorized(self.session, {
          admin_level: userModel.admin
        })) {
          cb({
            code: 400,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INSUFFICIENT_CREDENTIALS'))
          });
          return;
        }

        var user = pb.DocumentCreator.create('user', {
          "first_name": (userModel.first_name) ? userModel.first_name : "",
          "last_name": (userModel.last_name) ? userModel.last_name : "",
          "username": userModel.username,
          "email": userModel.email,
          "password": userModel.password,
          "admin": userModel.admin,
          "object_type": "user",
          "created": new Date(),
          "last_modified": new Date(),
          "user_appUserType": userModel.user_appUserType,
          "organization": userModel.organization
        });

        pb.users.isUserNameOrEmailTaken(user.username, user.email, user.id, function (err, isTaken) {
          if (util.isError(err) || isTaken) {
            cb({
              code: 400,
              content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('EXISTING_USERNAME'))
            });
            return;
          }

          var dao = new pb.DAO();

          dao.save(user, function (err, result) {
            if (util.isError(err)) {
              cb({
                code: 500,
                content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
              });
              return;
            }
            callback(err, {
              model: userModel,
              result: result
            });
          });
        });
      };

      var tasks = [];

      for (i = 0; userList.length > i; i++) {
        var userObj = new UserObj(addNewUser);
        userObj.setUser(userList[i]);
        tasks.push(userObj.getTask());
      }

      async.parallel(tasks, function (err, response) {
        if (err) {
          return cb({
            code: 500,
            content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, JSON.stringify(err))
          });
        }

        self.sendNotifications(response, function (err, result) {

          cb(err, {
            add: response,
            email: result
          });

        });

      });
    });
  };

  ImportUsersController.prototype.sendNotifications = function (response, cb) {

    var NotificationService = require('./../../services/NotificationService.js')(pb);
    var notificationService = new NotificationService();

    pb.settings.get('email_settings', function (err, options) {

      var encodedUsername = encodeURI("[[username]]");
      var encodedPassword = encodeURI("[[password]]");
      var usernamePattern = new RegExp(encodedUsername, "g");
      var passwordPattern = new RegExp(encodedPassword, "g");


      var i = 0,
          iRes = {},
          arrMail = [];


      for (i = 0; response.length > i; i++) {
        iRes = response[i];

        var message = options.verification_content;
        message = encodeURI(message).toString();
        message = message.replace(usernamePattern, iRes.model.username);
        message = message.replace(passwordPattern, iRes.model.password);
        message = decodeURI(message);

        arrMail.push({
          to: iRes.result.email,
          subject: options.verification_subject,
          layout: message
        });
      }

      notificationService.send(arrMail, function (err, data) {
        cb(err, data);
      });

    });

  };

  ImportUsersController.prototype.UserModel = function (data, parser) {
    var self = this;
    var data = data;
    var parser = parser;

    this.init = function () {
      var message = parser(data, ['username', 'email', 'password', 'confirm_password', 'admin']);
      if (message) {
        cb({
          code: 400,
          content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
        });
        return;
      }

      return {
        "first_name": (data.first_name) ? data.first_name : "",
        "last_name": (data.last_name) ? data.last_name : "",
        "username": data.username,
        "email": data.email,
        "password": data.password,
        "admin": data.admin,
        "object_type": "user",
        "created": new Date(),
        "last_modified": new Date(),
        "user_appUserType": data.user_appUserType,
        "organization": data.organization
      };
    };

  };

  ImportUsersController.getRoutes = function (cb) {
    
    var routes = [
      {
        method: 'post',
        path: "/api/admin/users/import_users/:organization",
        access_level: pb.SecurityService.ACCESS_WRITER,
        auth_required: true,
        content_type: 'text/html'
      }];
    cb(null, routes);
  };

  //exports
  return ImportUsersController;
};
