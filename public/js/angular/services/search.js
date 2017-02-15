angular.module('search', [])
.service('searchService', function($filter) {
	  Array.prototype.unique = function() {
			var a = [];
			var l = this.length;
			for(var i = 0; i < l; i++) {
				for(var j = i+1; j < l; j++) {
					if (this[i] === this[j])
						j = ++i;
				}
				a.push(this[i]);
			}
			return a;
		};
  
  
	this.search = function(searchText, items, searchFields, cb) {
		if(!searchFields.length || !items) {
			cb(items);
			return;
		}

		for(var i = 0; i < items.length; i++) {
			delete items[i].hidden;
		}

		if(!searchText || !searchText.length) {
			cb(items);
			return;
		}

		if(searchText.length <= 2) {
			cb(items);
			return;
		}

		searchText = searchText.toLowerCase();

		for(i = 0; i < items.length; i++) {
			items[i].hidden = true;
			for(var j = 0; j < searchFields.length; j++) {
				if(!items[i][searchFields[j]]) {
					continue;
				}

				if(items[i][searchFields[j]].toLowerCase().indexOf(searchText) >= 0) {
					items[i].hidden = false;
					break;
				}
			}
		}

		cb(items);
	};
	
	this.searchByTags = function(searchText, items, searchFields, cb) {
		if(!searchFields.length || !items) {
			cb(items);
			return;
		}

		for(var i = 0; i < items.length; i++) {
			delete items[i].hidden;
		}

		if(!searchText || !searchText.length) {
			cb(items);
			return;
		}

		if(searchText.length <= 2) {
			cb(items);
			return;
		}

		searchText = searchText.toLowerCase();
		
		var arrSerachText = searchText.split(',');
		
		arrSerachText = arrSerachText.map(function(el){
		  if(el[0] == ' ')
			el = el.substr(1);
		  return el;
		});

		for(i = 0; i < items.length; i++) {
			items[i].hidden = true;
			var hidden = true;
			
			for(var j = 0; j < searchFields.length; j++) {
				if(!items[i][searchFields[j]]) {
					continue;
				}
				var arrSearc = items[i][searchFields[j]].toLowerCase().split(',');
				arrSearc = arrSearc.map(function(el){
				  if(el[0] == ' ')
					el = el.substr(1);
				  return el;
				});
				
				var contactLength = arrSearc.length + arrSerachText.length;

				if((arrSerachText.concat(arrSearc)).unique().length < contactLength){
				  hidden = false;
				  break;
				}
				
			}
			
			items[i].hidden = hidden;
		}

		cb(items);
	};
})
