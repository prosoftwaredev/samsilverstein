/*
 Copyright (C) 2015  PencilBlue, LLC
 
 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.
 
 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
 
 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

module.exports = function (pb) {

  //pb dependencies
  var util = pb.util;

  /**
   * Interface for managing media
   */
  function SS_ManageMedia() {}
  util.inherits(SS_ManageMedia, pb.BaseController);

  //statics
  var SUB_NAV_KEY = 'ss_manage_media';

  SS_ManageMedia.prototype.render = function (cb) {
	var self = this;

	var options = {
	  select: {
		name: 1,
		caption: 1,
		last_modified: 1,
		media_type: 1,
		location: 1,
		tags: 1
	  },
	  order: {
		created: pb.DAO.DESC
	  },
	  format_media: true
	};
	
	var mservice = new pb.MediaService();
	
	mservice.get(options, function (err, mediaData) {
	  if (util.isError(mediaData) || mediaData.length === 0) {
		self.redirect('/admin/content/media/new', cb);
		return;
	  }

	  var angularObjects = pb.ClientJs.getAngularObjects({
				navigation: pb.AdminNavigation.get(self.session, ['content', 'media'], self.ls),
				pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'manage_media'),
				media: pb.MediaService.formatMedia(mediaData)
			  });

	  var title = self.ls.get('MANAGE_MEDIA');
	  self.setPageName(title);
	  self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
	  self.ts.load('admin/content/media/manage_media', function (err, result) {
		cb({content: result});
	  });
	});
  };

  SS_ManageMedia.getSubNavItems = function (key, ls, data) {
	return [{
		name: 'manage_media',
		title: ls.get('MANAGE_MEDIA'),
		icon: 'refresh',
		href: '/admin/content/media'
	  }, {
		name: 'new_media',
		title: '',
		icon: 'plus',
		href: '/admin/content/media/new'
	  }];
  };

  SS_ManageMedia.getRoutes = function (cb) {
	var routes = [
	  {
		method: 'get',
		path: "/admin/content/media",
		access_level: pb.SecurityService.ACCESS_WRITER,
		auth_required: true,
		content_type: 'text/html'
	  }
	];
	cb(null, routes);
  };

  //register admin sub-nav
  pb.AdminSubnavService.registerFor(SUB_NAV_KEY, SS_ManageMedia.getSubNavItems);

  //exports
  return SS_ManageMedia;
};
