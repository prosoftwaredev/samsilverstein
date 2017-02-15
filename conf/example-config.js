/**
 * This is a sample configuration meant to get users and up running on a local 
 * machine.  The configuration will not support multi-process on a single 
 * server or multi-server/elastic environments.  For more detailed information 
 * on the options provided please refer to the /include/config.js file.
 * 
 * The file can be renamed to "config.js" in the same directory as this file 
 * and it will be used as the configuration when PencilBlue is started.  If 
 * this file is used then there is no need to create a "config.json"
 */

/*
 
 After install plugin need make section withs link: section/content, section/questions, section/polls, section/challenges.
 And set it some name. They you will see content.
 
 */

module.exports = {
  "siteName": "Sam Silvertein Inc",
  "siteRoot": "http://localhost:8000",
  "sitePort": 8000,
  "logging": {
	"level": "info"
  },
  "pushNotification": {
	"dirKey": '/home/mats/Projects/sam-silverstein/app/server'
  },
  "db": {
	"type": "mongo",
	"servers": [
	  "mongodb://127.0.0.1:27017/"
	],
	"name": "samsilverteininc_test4",
//	"authentication": {
//	  "un": "xxx",
//	  "pw": "xxx",
//	},
	"writeConcern": 1
  },
  "cache": {
	"fake": true,
	"host": "localhost",
	"port": 6379
  },
  "settings": {
	"use_memory": false,
	"use_cache": false
  },
  "templates": {
	"use_memory": false,
	"use_cache": false
  },
  "plugins": {
	"caching": {
	  "use_memory": false,
	  "use_cache": false
	}
  },
  "registry": {
	"type": "mongo"
  },
  "session": {
	"storage": "mongo"
  },
  "media": {
	"provider": "mongo",
	"max_upload_size": 62914560
  },
  "cluster": {
	"workers": 1,
	"self_managed": false
  },
  "siteIP": "0.0.0.0"
};

