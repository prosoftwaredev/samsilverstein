var async = require('async');
var apn = require('apn');
var StringDecoder = require('string_decoder').StringDecoder;

module.exports = function (pb) {

  //PB dependencies
  var util = pb.util;
  var BaseController = pb.BaseController;

  var dbTableName = {
	tokens: 'tokens'
  };

  function TokenService() {
	this.dao = new pb.DAO();

  }

  TokenService.prototype.getTokenNameCollection = function () {
	return dbTableName.tokens;
  };


  var validationToken = function (token) {
	return !(!'token' in token && token.token !== '');
  };

  TokenService.prototype.newToken = function (post, cb) {
	var self = this;
	if (validationToken(post)) {

	  var validToken = {
		username: post.username,
		token: post.token,
		device_type: post.device_type,
		created: new Date()
	  };
	  if (post._id !== undefined)
		validToken._id = pb.DAO.getObjectID(post._id);

	  var tokenDocument = pb.DocumentCreator.create(dbTableName.tokens, validToken, ['meta_keywords']);
	  var dao = new pb.DAO();
	  dao.save(tokenDocument, function (err, result) {
		cb(err, result);
	  });
	} else {
	  cb({
		code: 500,
		content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE,
				self.ls.get('ERROR_SAVING'))
	  });
	}

  };

  TokenService.prototype.getAllTokens = function (cb) {
	var self = this;
	var opts = {
	  select: pb.DAO.PROJECT_ALL,
	  where: {},
	  order: {
		created: pb.DAO.ASC
	  }
	};
	self.dao.q(dbTableName.tokens, opts, function (err, tokens) {
	  cb(null, tokens);
	});
  };

  TokenService.prototype.checkExistToken = function (token, cb) {
	var self = this;

	var opts = {
	  select: pb.DAO.PROJECT_ALL,
	  where: {
		username: token.username
	  }
	};
	self.dao.q(dbTableName.tokens, opts, function (err, token) {
	  if (token.length > 0)
		cb(null, token[0]._id.toString());
	  cb(null, false);
	});
  };

  TokenService.prototype.deleteToken = function (token, cb) {
	var self = this;

	var where = {
	  token: token
	};

	self.dao.delete(where, dbTableName.tokens, cb);

  };

  /*
   * Router
   */

  TokenService.getRoutes = function (cb) {
	var routes = [];
	cb(null, routes);
  };

  return TokenService;
};