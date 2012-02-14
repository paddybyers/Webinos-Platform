/**
 * TODO Undo exporting "internal" stuff?
 * TODO On entry conflict, check if types (i.e., directory or file) of the conflicting entries differ.
 * TODO On file entry conflict, enable the user to select a corresponding shard.
 * TODO On webinos update event, add new shard(s) and update the current view.
 * TODO Check various "inline" TODOs.
 */
// browse -> (select ->) view
// Find some way to access the relevant entry from browsing while selecting/viewing!
(function (exports) {
	"use strict";

	// TODO Check token on push and clear tasks array on clear.
	exports.queue = async.queue(function (data, callback) {
		try {
			if (data.token >= exports.queue.token)
				data.fun();
		} finally {
			callback();
		}
	}, 1);

	exports.queue.token = 0;
	exports.queue.clear = function () {
		exports.queue.token++;
	};

	exports.shards = [];
	exports.shards.add = function (shard) {
		if (!(shard in this)) {
			this.push(shard);

			if (exports.state == "browse")
				shard.readEntries(exports.path, exports.queue.token);
		}
	};

	exports.Shard = function (service, filesystem) {
		this.service = service;
		this.filesystem = filesystem;
	};

	exports.Shard.prototype.readEntries = function (path, token) {
		this.filesystem.root.getDirectory(path, { create: false }, webinos.utils.bind(function (entry) {
			var reader = entry.createReader();

			var successCallback = webinos.utils.bind(function (entries) {
				if (entries.length == 0)
					return;

				exports.queue.push({
					token: token,
					fun: webinos.utils.bind(function () {
						entries.forEach(function (entry) {
							exports.entries.add(exports.Entry.create(this, entry));
						}, this);
					}, this)
				});

				reader.readEntries(successCallback);
			}, this);

			reader.readEntries(successCallback);
		}, this));
	};

	exports.entries = [];
	exports.entries.add = function (entry) {		
		var i;
		for (i = 0; i < this.length; i++)
			if (this[i].fullPath == entry.fullPath) {
				entry.shards.forEach(function (shard) {
					this[i].shards.add(shard);
				}, this);

				return;
			} else if (this[i].fullPath > entry.fullPath)
				break;

		this.splice(i, 0, entry);

		$(exports).triggerHandler("entry.add", [entry, i, this]);
	};

	$(exports).on("entry.add", function (event, entry, i, entries) {
		var $entries = $("#entries");

		if (i == 0)
			$entries.append(entry.html);
		else
			entries[i - 1].html.after(entry.html);

		$entries.listview("refresh");
	});

	exports.entries.clear = function () {
		this.splice(0, this.length);

		$(exports).triggerHandler("entry.clear");
	};

	$(exports).on("entry.clear", function (event) {
		$("#entries").empty();
	});

	exports.Entry = function (shard, entry) {
		this.shards = [shard];
		this.shards.add = function (shard) {
			if (!(shard in this))
				this.push(shard);
		};

		this.name = webinos.path.basename(entry.fullPath);
		this.fullPath = entry.fullPath;

		Object.defineProperty(this, "html", {
			get: function () {
				if (typeof this.$html === "undefined")
					this.$html = this.htmlify();

				return this.$html;
			},
			set: function (value) {
				this.$html = value;
			},
			configurable: true,
			enumerable: true
		});
	};

	exports.Entry.create = function (shard, entry) {
		if (entry.isFile)
			return new exports.FileEntry(shard, entry);
		else if (entry.isDirectory)
			return new exports.DirectoryEntry(shard, entry);
	};

	exports.Entry.prototype.isFile = false;
	exports.Entry.prototype.isDirectory = false;

	exports.Entry.prototype.$html = undefined;

	exports.DirectoryEntry = function (shard, entry) {
		exports.Entry.call(this, shard, entry);
	};

	webinos.utils.inherits(exports.DirectoryEntry, exports.Entry);

	exports.DirectoryEntry.prototype.isDirectory = true;
	exports.DirectoryEntry.prototype.htmlify = function () {
		return $('<li><a href="#browse?' + $.param({
			path: this.fullPath
		}) + '">' + this.name + '</a></li>');
	};

	exports.FileEntry = function (shard, entry) {
		exports.Entry.call(this, shard, entry);
	};

	webinos.utils.inherits(exports.FileEntry, exports.Entry);

	exports.FileEntry.prototype.isFile = true;
	exports.FileEntry.prototype.htmlify = function () {
		return $('<li><a href="#view?' + $.param({
			path: this.fullPath
		}) + '">' + this.name + '</a></li>');
	};

	exports.state = "browse";
	exports.path = "/";

	exports.browse = function (path) {
		exports.queue.clear();
		exports.entries.clear();

		exports.state = "browse";
		exports.path = path;

		exports.shards.forEach(function (shard) {
			shard.readEntries(exports.path, exports.queue.token);
		});

		$(exports).triggerHandler("browse", [exports.path]);
	};

	$(exports).on("browse", function (event, path) {
		var $back = $(".back", "#browse"),
			$path = $(".path", "#browse");

		if (path == "/")
			$back.hide();
		else {
			// $(".ui-btn-text", $back).text(...);
			$back.show();
		}

		$path.text(path);
	});

	exports.view = function (path) {
		exports.state = "view";
		exports.path = path;

		$(exports).triggerHandler("view", [exports.path]);
	};

	$(exports).on("view", function (event, path) {
		$(".name", "#view").text(webinos.path.basename(path));
	});

	exports.events = {};
	exports.events.service = undefined;
	exports.events.handler = function (event) {

	};

	$(document).ready(function () {
		webinos.session.addListener("registeredBrowser", function (event) {
			webinos.ServiceDiscovery.findServices(new ServiceType("http://webinos.org/api/events"), {
				onFound: function (service) {
					exports.events.service = service;

    	    		service.bind(function () {
    	    			service.addWebinosEventListener(exports.events.handler);
    	    		});
    	    	}
			});

			// TODO Fix pseudo-sequentialization of service discovery.
			setTimeout(function () {
				webinos.ServiceDiscovery.findServices(new ServiceType("http://webinos.org/api/file"), {
					onFound: function (service) {
						$(exports).triggerHandler("service.found", service);
					}
				});
			}, 250);
		});

		$(".back", "#browse").click(function (event) {
			$.mobile.changePage("#browse?" + $.param({
				path: webinos.path.dirname(exports.path)
			}));
		});

		$(".refresh", "#browse").click(function (event) {
			$.mobile.changePage("#browse?" + $.param({
				path: exports.path
			}));
		});

		$(".back", "#view").click(function (event) {
			$.mobile.changePage("#browse?" + $.param({
				path: webinos.path.dirname(exports.path)
			}));
		});
	});

	$(exports).on("service.found", function (event, service) {
		service.bindService({
			onBind: function () {
				$(exports).triggerHandler("service.bound", service);
			}
		});
	});

	$(exports).on("service.bound", function (event, service) {
		service.requestFileSystem(webinos.file.LocalFileSystem.PERSISTENT, 0, function (filesystem) {
			exports.shards.add(new exports.Shard(service, filesystem));
		});
	});

	$(document).on("pagebeforechange", function (event, data) {
		if (typeof data.toPage === "string") {
			var operation = "browse";

			var url = $.mobile.path.parseUrl(data.toPage);
			var matches = url.hash.match(/^#([^\?]+)(?:\?.*)?$/);

			if (matches !== null)
				operation = matches[1];

			if (operation == "browse") {
				data.options.allowSamePageTransition = true;

				switch (exports.state) {
					case "browse":
						data.options.transition = "none";
						break;
					case "view":
						data.options.reverse = true;
						break;
				}
			}
		}
	});

	$(document).on("pageshow", function (event, data) {
		var operation = "browse",
			params = { path: "/" };

		var url = $.mobile.path.parseUrl(window.location.href);
		var matches = url.hash.match(/^#([^\?]+)(?:\?(.*))?$/);

		if (matches !== null) {
			operation = matches[1];

			if (typeof matches[2] !== "undefined")
				params = $.deparam(matches[2]);
		}

		switch (operation) {
			case "browse":
				if (typeof params.path === "undefined")
					params.path = "/";

				return exports.browse(params.path);
			case "view":
				return exports.view(params.path);
		}
	});
})(webinosFS = {});
