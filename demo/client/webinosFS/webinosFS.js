if (typeof webinos === "undefined")
	webinos = {};

(function (exports) {
	"use strict";

	// On filesystem request success, queue a task to update #list with entries for the current directory from the new
	// filesystem.
	// On directory change, queue tasks to update #list with entries for the new directory from all known filesystems.
	// Make sure that updates only happen as long as the current directory isn't changed, i.e., clear the task queue on
	// directory change.
	var queue = async.queue(function (task, callback) {
		task(callback);
	}, 1);

	// Remember filesystems along with their service.
	var filesystems = [];

	// On file entry conflict, remember involved PZPs and enable user selection.

	exports.session = {};
	exports.session.onregisteredBrowser = function (event) {
		webinos.ServiceDiscovery.findServices(new ServiceType("http://webinos.org/api/file"), {
			onFound: function (service) {
				service.bindService({
					onBind: function () {
						service.requestFileSystem(webinos.file.LocalFileSystem.PERSISTENT, 1024, function (filesystem) {
							filesystems.push(filesystem);
						});
					}
				});
			}
		});
	};
	
	exports.session.onupdate = function (event) {
	};
})(webinosFS = {});

$(document).ready(function () {
	webinos.session.addListener("registeredBrowser", webinosFS.session.onregisteredBrowser);
	webinos.session.addListener("update", webinosFS.session.onupdate);
});

$(document).bind("pagebeforechange", function (event, data) {
	if (typeof data.toPage === "string") {
		var url = $.mobile.path.parseUrl(data.toPage);

		if (url.hash.search(/^#browse/) !== -1) {
			data.options.allowSamePageTransition = true;
			data.options.transition = "none";
		}
	}
});
