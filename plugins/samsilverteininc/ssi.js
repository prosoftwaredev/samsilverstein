var async = require('async');

module.exports = function SSIPluginModule(pb) {

	/**
	 * SSIPlugin - A portfolio site theme for PencilBlue
	 *
	 * @author Blake Callens <blake@pencilblue.org>
	 * @copyright 2014 PencilBlue, LLC
	 */
	function SSIPlugin() {
	}

	/**
	 * Called when the application is being installed for the first time.
	 *
	 * @param cb A callback that must be called upon completion.  cb(err, result).
	 * The result is ignored
	 */
	SSIPlugin.onInstall = function (cbReturn) {
		var self = this;
		var cos = new pb.CustomObjectService();
		var dao = new pb.DAO();
		var util = pb.util;

		/*
		 *  Organizations
		 */
		var initOrganizationObj = function (cb) {
			cos.loadTypeByName('organization_obj', function (err, orgType) {
				if (!orgType) {

					var organizationValues = {
						name: 'organization_obj',
						fields: {
							name: {
								field_type: 'text'
							},
							date: {
								field_type: 'date'
							}
						}
					};

					cos.saveType(organizationValues, function (err, orgType) {
						cb(null, true);
					});

				} else {
					cb(null, true);
				}
			});
		};

		var addObjOrganizationObjNone = function (cbAdd) {
			cos.loadTypeByName('organization_obj', function (err, organizationObj) {
				if (organizationObj) {

					var noOrganization = {
						name: '(no_organization)',
						field_type: '2000-01-01'
					};

					async.series([
						function (cb) {
							pb.CustomObjectService.formatRawForType(
											noOrganization, organizationObj);
							var customObjectDocument = pb.DocumentCreator.create('custom_object',
											noOrganization);

							cos.save(customObjectDocument, organizationObj, function (err,
											channelType) {
								cb(null, true);
							});
						}
					],
									function (err, results) {
										cbAdd(null, true);
									});
				} else {
					cbAdd(null, true);
				}
			});
		};

		/*
		 * Channel
		 */
		var initChannelType = function (cb) {
			cos.loadTypeByName('channel_type', function (err, channelType) {
				if (!channelType) {

					var channelValues = {
						name: 'channel_type',
						fields: {
							name: {
								field_type: 'text'
							},
							level: {
								field_type: 'text'
							},
							organization: {
								field_type: "child_objects",
								object_type: "custom:organization_obj"
							}
						}
					};
					console.log("xxxxxxxxxxxxxxxxx");
					cos.saveType(channelValues, function (err, channelType) {
						cb(null, true);
					});

				} else {
					cb(null, true);
				}
			});
		};

		var addObjChannelType = function (cbAdd) {
			cos.loadTypeByName('channel_type', function (err, channelType) {
				if (channelType) {

					var basicchannel = {
						name: 'Basic/Free',
						level: '0'
					};

//               var premiumchannel = {
//                  name: 'Premium',
//                  level: '1'
//               };

					var organizationalDevelopmenthennelchannel = {
						name: 'Organizational Developmen',
						level: '2'
					};

					async.series([
						function (cb) {
							pb.CustomObjectService.formatRawForType(basicchannel, channelType);
							var customObjectDocument = pb.DocumentCreator.create('custom_object',
											basicchannel);

							cos.save(customObjectDocument, channelType, function (err, channelType) {
								cb(null, true);
							});
						},
//                  function (cb) {
//                     pb.CustomObjectService.formatRawForType(premiumchannel, channelType);
//                     var customObjectDocument = pb.DocumentCreator.create('custom_object',
//                         premiumchannel);
//
//                     cos.save(customObjectDocument, channelType, function (err, channelType) {
//                        cb(null, true);
//                     });
//                  },
						function (cb) {
							pb.CustomObjectService.formatRawForType(
											organizationalDevelopmenthennelchannel, channelType);
							var customObjectDocument = pb.DocumentCreator.create('custom_object',
											organizationalDevelopmenthennelchannel);

							cos.save(customObjectDocument, channelType, function (err,
											channelType) {
								cb(null, true);
							});
						}
					],
									function (err, results) {
										cbAdd(null, true);
									});
				} else {
					cbAdd(null, true);
				}
			});
		};


		var initChennalObj = function (cb) {

			cos.loadTypeByName('channel_obj', function (err, orgType) {
				if (!orgType) {

					var organizationValues = {
						name: 'channel_obj',
						fields: {
							name: {
								field_type: 'text'
							},
							date: {
								field_type: 'date'
							},
							channel_type: {
								field_type: "peer_object",
								object_type: "custom:channel_type"
							},
							organization: {
								field_type: "child_objects", //"child_objects",
								object_type: "custom:organization_obj"
							},
							thumbnail: {
								field_type: "peer_object",
								object_type: "media"
							},
							bg_color: {
								field_type: 'text'
							},
							use_bg_image: {
								field_type: 'boolean'
							},
							bg_tags: {
								field_type: 'tags'
							}
						}
					};
					console.log('--------------');
					cos.saveType(organizationValues, function (err, orgType) {
						cb(null, true);
					});

				} else {
					cb(null, true);
				}
			});
		};

		/*
		 *  Users
		 */
		var initAppUserType = function (cb) {
			cos.loadTypeByName('app_user_types', function (err, channelType) {
				if (!channelType) {

					var channelValues = {
						name: 'app_user_types',
						fields: {
							name: {
								field_type: 'text'
							},
							level: {
								field_type: 'text'
							}
						}
					};

					cos.saveType(channelValues, function (err, channelType) {
						cb(null, true);
					});

				} else {
					cb(null, true);
				}
			});
		};

		var addAppUserType = function (cbAdd) {
			cos.loadTypeByName('app_user_types', function (err, channelType) {
				if (channelType) {

					var basicchannel = {
//                  type: channelType._id.toJSON(),
						name: 'Basic',
						level: '0'
					};

					var premiumchannel = {
//                  type: channelType._id.toJSON(),
						name: 'Premium',
						level: '1'
					};

					var organizationalDevelopmenthennelchannel = {
//                  type: channelType._id.toJSON(),
						name: 'Organizational Development',
						level: '2'
					};

					async.series([
						function (cb) {
							pb.CustomObjectService.formatRawForType(basicchannel, channelType);
							var customObjectDocument = pb.DocumentCreator.create('custom_object',
											basicchannel);

							cos.save(customObjectDocument, channelType, function (err, channelType) {
								cb(null, true);
							});
						},
						function (cb) {
							pb.CustomObjectService.formatRawForType(premiumchannel, channelType);
							var customObjectDocument = pb.DocumentCreator.create('custom_object',
											premiumchannel);

							cos.save(customObjectDocument, channelType, function (err, channelType) {
								cb(null, true);
							});
						},
						function (cb) {
							pb.CustomObjectService.formatRawForType(
											organizationalDevelopmenthennelchannel, channelType);
							var customObjectDocument = pb.DocumentCreator.create('custom_object',
											organizationalDevelopmenthennelchannel);

							cos.save(customObjectDocument, channelType, function (err,
											channelType) {
								cb(null, true);
							});
						}
					],
									function (err, results) {
										cbAdd(null, true);
									});
				} else {
					cbAdd(null, true);
				}
			});
		};

		/*
		 *  Questions
		 */
		var initQuestionObj = function (cb) {
			cos.loadTypeByName('question_obj', function (err, questionType) {
				if (!questionType) {

					var questionValues = {
						name: 'question_obj',
						fields: {
//              headline: {
//                field_type: 'text'
//              },
							question_layout: {
								field_type: 'wysiwyg'
							},
							author_title: {
								field_type: 'text'
							},
							publish_date: {
								field_type: "date"
							},
							channel: {
								field_type: "peer_object",
								object_type: "custom:channel_obj"
							}
						}
					};

					cos.saveType(questionValues, function (err, questionType) {
						cb(null, true);
					});

				} else {
					cb(null, true);
				}
			});
		};

		/*
		 *  Sections
		 */
		var addSections = function (cb) {
			var dbTableName = 'section';
			var arraySection = ['questions', 'polls', 'challenges', 'content'];

			var findSection = function (url, cbFn) {
				var opts = {
					select: pb.DAO.PROJECT_ALL,
					where: {
						url: url
					}
				};
				dao.q(dbTableName, opts, function (err, sections) {
					cbFn(err, sections);
				});
			};

			var addSection = function (url, cbFn) {
				var objSection = {
					"type": "section",
					"name": url,
					"url": url,
					"editor": "",
					"keywords": [],
					"parent": null,
					"object_type": "section",
					"item": null,
					"link": null,
					"new_tab": null,
					"created": new Date(),
					"last_modified": new Date()
				};
				dao.save(objSection, cbFn);
			};

			var tasks = util.getTasks(arraySection, function (sectionName, i) {
				return function (callback) {
					findSection(sectionName[i], function (err, sections) {
						if (sections.length == 0) {
							addSection(sectionName[i], callback);
						} else {
							callback(err, sections);
						}
					})
				}
			});

			async.parallel(tasks, function (err, data) {
				cb(err, data);
			});
		};

		async.series({
			organizationObj: initOrganizationObj,
			addNoOrganizationObj: addObjOrganizationObjNone,
			channelType: initChannelType,
			objChannelType: addObjChannelType,
			chennalObj: initChennalObj,
			appUserType: initAppUserType,
			objAppUserType: addAppUserType,
			questionObj: initQuestionObj,
			addSections: addSections,
		},
						function (err, results) {
							cbReturn(null, true);
						});
	};
	/**
	 * Called when the application is uninstalling this plugin.  The plugin should
	 * make every effort to clean up any plugin-specific DB items or any in function
	 * overrides it makes.
	 *
	 * @param cb A callback that must be called upon completion.  cb(err, result).
	 * The result is ignored
	 */
	SSIPlugin.onUninstall = function (cb) {
		cb(null, true);
	};
	/**
	 * Called when the application is starting up. The function is also called at
	 * the end of a successful install. It is guaranteed that all core PB services
	 * will be available including access to the core DB.
	 *
	 * @param cb A callback that must be called upon completion.  cb(err, result).
	 * The result is ignored
	 */
	SSIPlugin.onStartup = function (cb) {
		var PushNotificationService = require('./controllers/services/PushNotificationService.js')(pb);
		var pushNotificationService = new PushNotificationService();
		
		pb.AdminSubnavService.registerFor('plugin_settings', function (navKey, localization,
						data) {
			if (data.plugin.uid === 'samsilverteininc') {
				return [
					{
						name: 'home_page_settings',
						title: 'Home page settings',
						icon: 'home',
						href: '/admin/plugins/portfolio/settings/home_page'
					}
				];
			}
			return [];
		});

		pb.AdminNavigation = require('./include/ss_admin_navigation.js')(pb);
		pushNotificationService.runТewsletter();
		
		cb(null, true);
	};
	/**
	 * Called when the application is gracefully shutting down.  No guarantees are
	 * provided for how much time will be provided the plugin to shut down.
	 *
	 * @param cb A callback that must be called upon completion.  cb(err, result).
	 * The result is ignored
	 */
	SSIPlugin.onShutdown = function (cb) {
		cb(null, true);
	};
	//exports
	return SSIPlugin;
};
