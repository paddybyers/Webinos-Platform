/**
 * TODO On entry conflict, check if types (i.e., directory or file) of the conflicting entries differ.
 * TODO On file entry conflict, enable the user to select a corresponding shard.
 * TODO On webinos update event, add new shard(s) and update the current view.
 * TODO Check various "inline" TODOs.
 */
(function (exports) {
	"use strict";

	// TODO Check token on push and clear tasks array on reset.
	exports.queue = async.queue(function (data, callback) {
		try {
			if (data.token >= exports.queue.token)
				data.fun();
		} finally {
			callback();
		}
	}, 1);

	exports.queue.token = 0;
	exports.queue.reset = function () {
		exports.queue.token++;
	};

	exports.shards = [];
	exports.shards.add = function (shard) {
		if (!(shard in this)) {
			this.push(shard);

			shard.readEntries(exports.workingDirectory, exports.queue.token);
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
							exports.entries.add(new exports.Entry(this, entry));
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

		// TODO Use loose coupling to update the user interface.
		this.render(i);
	};

	exports.entries.clear = function () {
		this.splice(0, this.length);

		// TODO Use loose coupling to update the user interface.
		$("#list").empty();
	};

	exports.entries.render = function (i) {
		var $list = $("#list");

		if (i == 0)
			$list.append(this[i].html);
		else
			this[i - 1].html.after(this[i].html);

		$list.listview("refresh");
	};

	exports.Entry = function (shard, entry) {
		this.shards = [shard];
		this.shards.add = function (shard) {
			if (!(shard in this))
				this.push(shard);
		};

		this.isFile = entry.isFile;
		this.isDirectory = entry.isDirectory;
		this.name = webinos.path.basename(entry.fullPath);
		this.fullPath = entry.fullPath;

		// TODO Extract to "render" (or something similar).
		if (this.isFile)
			this.html = $('<li>' + this.name + '</li>');
		else if (this.isDirectory)
			this.html = $('<li><a href="#browse?workingDirectory=' + encodeURIComponent(this.fullPath) + '">' + this.name + '</a></li>');
	};

	exports.workingDirectory = "/";
	exports.changeDirectory = function (to) {
		exports.queue.reset();
		exports.entries.clear();

		exports.workingDirectory = to;

		exports.shards.forEach(function (shard) {
			shard.readEntries(exports.workingDirectory, exports.queue.token);
		});

		$(exports).trigger("changedirectory", [exports.workingDirectory, exports.queue.token]);
	};

	$(exports).on("changedirectory", function (event, path, token) {
		exports.queue.push({
			token: token,
			fun: function () {
				$("#back .ui-btn-text").text(webinos.path.dirname(path));
				$("#path").text(path);
			}
		});
	});

	$(document).ready(function () {
		webinos.session.addListener("registeredBrowser", function (event) {
			webinos.ServiceDiscovery.findServices(new ServiceType("http://webinos.org/api/file"), {
				onFound: function (service) {
					$(exports).trigger("service.found", service);
				}
			});
		});

		$("#back").click(function (event) {
			$.mobile.changePage("#browse?" + $.param({ workingDirectory: webinos.path.dirname(exports.workingDirectory) }));
		});
	});

	$(exports).on("service.found", function (event, service) {
		service.bindService({
			onBind: function () {
				$(exports).trigger("service.bound", service);
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
				data.options.transition = "none";
			}
		}
	});

	$(document).on("pageshow", function (event, data) {
		var operation = "browse",
			params = { workingDirectory: "/" };

		var url = $.mobile.path.parseUrl(window.location.href);
		var matches = url.hash.match(/^#([^\?]+)(?:\?(.*))?$/);

		if (matches !== null) {
			operation = matches[1];

			if (typeof matches[2] !== "undefined")
				params = $.deparam(matches[2]);
		}

		if (operation == "browse") {
			if (typeof params.workingDirectory === "undefined")
				params.workingDirectory = "/";

			exports.changeDirectory(params.workingDirectory);
		}
	});
})(webinosFS = {});
