// TODO Extract (de)serialization?
// TODO Remove unnecessary function bindings.
(function (exports) {
	"use strict";

	var file = require('./webinos.file.js');
	var utils = require('./webinos.utils.js');

	var rpc = require('./rpc.js');

	rpc.file = exports;

	rpc.file.RemoteFileSystem = function () {
		this.__object = new file.RemoteFileSystem();
	}

	rpc.file.RemoteFileSystem.prototype.requestFileSystem = function (params, successCallback, errorCallback) {
		this.__object.requestFileSystem(params[0], params[1], utils.bind(function (filesystem) {
			utils.callback(successCallback, null)(rpc.file.FileSystem.serialize(filesystem));
		}, this), utils.bind(function (error) {
			utils.callback(errorCallback, null)(rpc.file.FileError.serialize(error));
		}, this));
	}

	rpc.file.RemoteFileSystem.prototype.resolveLocalFileSystemURL = function (params, successCallback, errorCallback) {
		this.__object.resolveLocalFileSystemURL(params[0], utils.bind(function (entry) {
			utils.callback(successCallback, null)(rpc.file.Entry.serialize(entry));
		}, this), utils.bind(function (error) {
			utils.callback(errorCallback, null)(rpc.file.FileError.serialize(error));
		}, this));
	}

	rpc.file.FileSystem = function () {
	}

	rpc.file.FileSystem.serialize = function (filesystem) {
		return {
			name: filesystem.name,
			__realPath: filesystem.__realPath
		};
	}

	rpc.file.FileSystem.deserialize = function (object) {
		return new file.FileSystem(object.name, object.__realPath);
	}

	rpc.file.Entry = function () {
	}

	rpc.file.Entry.serialize = function (entry) {
		return {
			filesystem: rpc.file.FileSystem.serialize(entry.filesystem),
			fullPath: entry.fullPath,
			isFile: entry.isFile,
			isDirectory: entry.isDirectory
		};
	}

	rpc.file.Entry.deserialize = function (object) {
		if (object.isFile)
			var entry = file.FileEntry;
		else if (object.isDirectory)
			var entry = file.DirectoryEntry

		return new entry(rpc.file.FileSystem.deserialize(object.filesystem), object.fullPath);
	}

	rpc.file.Entry.prototype.getMetadata = function (params, successCallback, errorCallback) {
		var __object = rpc.file.Entry.deserialize(params[0]);

		__object.getMetadata(utils.bind(function (metadata) {
			utils.callback(successCallback, null)(metadata);
		}, this), utils.bind(function (error) {
			utils.callback(errorCallback, null)(rpc.file.FileError.serialize(error));
		}, this));
	}

	rpc.file.Entry.prototype.getParent = function (params, successCallback, errorCallback) {
		var __object = rpc.file.Entry.deserialize(params[0]);

		__object.getParent(utils.bind(function (entry) {
			utils.callback(successCallback, null)(rpc.file.Entry.serialize(entry));
		}, this), utils.bind(function (error) {
			utils.callback(errorCallback, null)(rpc.file.FileError.serialize(error));
		}, this));
	}

	rpc.file.Entry.prototype.moveTo = function (params, successCallback, errorCallback) {
		var __object = rpc.file.Entry.deserialize(params[0]);

		__object.moveTo(rpc.file.Entry.deserialize(params[1]), params[2], utils.bind(function (entry) {
			utils.callback(successCallback, null)(rpc.file.Entry.serialize(entry));
		}, this), utils.bind(function (error) {
			utils.callback(errorCallback, null)(rpc.file.FileError.serialize(error));
		}, this));
	}

	rpc.file.Entry.prototype.copyTo = function (params, successCallback, errorCallback) {
		var __object = rpc.file.Entry.deserialize(params[0]);

		__object.copyTo(rpc.file.Entry.deserialize(params[1]), params[2], utils.bind(function (entry) {
			utils.callback(successCallback, null)(rpc.file.Entry.serialize(entry));
		}, this), utils.bind(function (error) {
			utils.callback(errorCallback, null)(rpc.file.FileError.serialize(error));
		}, this));
	}

	rpc.file.Entry.prototype.remove = function (params, successCallback, errorCallback) {
		var __object = rpc.file.Entry.deserialize(params[0]);

		__object.remove(utils.bind(function () {
			utils.callback(successCallback, null)();
		}, this), utils.bind(function (error) {
			utils.callback(errorCallback, null)(rpc.file.FileError.serialize(error));
		}, this));
	}

	rpc.file.DirectoryEntry = function () {
	}

	rpc.file.DirectoryEntry.prototype.getFile = function (params, successCallback, errorCallback) {
		var __object = rpc.file.Entry.deserialize(params[0]);

		__object.getFile(params[1], params[2], utils.bind(function (entry) {
			utils.callback(successCallback, null)(rpc.file.Entry.serialize(entry));
		}, this), utils.bind(function (error) {
			utils.callback(errorCallback, null)(rpc.file.FileError.serialize(error));
		}, this));
	}

	rpc.file.DirectoryEntry.prototype.getDirectory = function (params, successCallback, errorCallback) {
		var __object = rpc.file.Entry.deserialize(params[0]);

		__object.getDirectory(params[1], params[2], utils.bind(function (entry) {
			utils.callback(successCallback, null)(rpc.file.Entry.serialize(entry));
		}, this), utils.bind(function (error) {
			utils.callback(errorCallback, null)(rpc.file.FileError.serialize(error));
		}, this));
	}

	rpc.file.DirectoryEntry.prototype.removeRecursively = function (params, successCallback, errorCallback) {
		var __object = rpc.file.Entry.deserialize(params[0]);

		__object.removeRecursively(utils.bind(function () {
			utils.callback(successCallback, null)();
		}, this), utils.bind(function (error) {
			utils.callback(errorCallback, null)(rpc.file.FileError.serialize(error));
		}, this));
	}

	rpc.file.DirectoryReader = function () {
	}

	rpc.file.DirectoryReader.prototype.readEntries = function (params, successCallback, errorCallback) {
		var __object = rpc.file.Entry.deserialize(params[0]).createReader();

		__object.__begin = params[1];
		__object.__length = params[2];

		__object.readEntries(utils.bind(function (entries) {
			utils.callback(successCallback, null)({
				__begin: __object.__begin,
				__length: __object.__length,
				entries: entries.map(rpc.file.Entry.serialize, this)
			});
		}, this), utils.bind(function (error) {
			utils.callback(errorCallback, null)(rpc.file.FileError.serialize(error));
		}, this));
	}

	rpc.file.FileError = function () {
	}

	rpc.file.FileError.serialize = function (error) {
		return {
			code: error.code
		};
	}

	rpc.file.FileError.deserialize = function (object) {
		return new file.FileError(object.code);
	}

	rpc.registerObject("RemoteFileSystem", new rpc.file.RemoteFileSystem());
	rpc.registerObject("Entry", new rpc.file.Entry());
	rpc.registerObject("DirectoryEntry", new rpc.file.DirectoryEntry());
	rpc.registerObject("DirectoryReader", new rpc.file.DirectoryReader());
})(module.exports);