(function (exports) {
	var fs = require('./webinos.fs.js');
	var rpc = require('./rpc.js');

	rpc.fs = exports;

	var bind = function (thisArg, fun) {
		return fun.bind(thisArg);
	}

	rpc.fs.RemoteFileSystem = function () {
		this.__object = new fs.RemoteFileSystem();
	}

	rpc.fs.RemoteFileSystem.prototype.requestFileSystem = function (params, successCallback, errorCallback) {
		this.__object.requestFileSystem(params[0], params[1], bind(this, function (filesystem) {
			bind(null, successCallback)(rpc.fs.FileSystem.serialize(filesystem));
		}), bind(this, function (error) {
			bind(null, errorCallback)(rpc.fs.FileError.serialize(error));
		}));
	}

	rpc.fs.RemoteFileSystem.prototype.resolveLocalFileSystemURL = function (params, successCallback, errorCallback) {
	}

	rpc.fs.FileSystem = function () {
	}

	rpc.fs.FileSystem.serialize = function (filesystem) {
		return {
			name: filesystem.name,
			__realPath: filesystem.__realPath
		};
	}

	rpc.fs.FileSystem.deserialize = function (object) {
		return new fs.FileSystem(object.name, object.__realPath);
	}

	rpc.fs.Entry = function () {
	}

	rpc.fs.Entry.serialize = function (entry) {
		return {
			filesystem: rpc.fs.FileSystem.serialize(entry.filesystem),
			fullPath: entry.fullPath,
			isFile: entry.isFile,
			isDirectory: entry.isDirectory
		};
	}

	rpc.fs.Entry.deserialize = function (object) {
		if (object.isFile)
			var entry = fs.FileEntry;
		else if (object.isDirectory)
			var entry = fs.DirectoryEntry

		return new entry(rpc.fs.FileSystem.deserialize(object.filesystem), object.fullPath);
	}

	rpc.fs.Entry.prototype.getMetadata = function (params, successCallback, errorCallback) {
		var __object = rpc.fs.Entry.deserialize(params[0]);

		__object.getMetadata(bind(this, function (metadata) {
			bind(null, successCallback)(metadata);
		}), bind(this, function (error) {
			bind(null, errorCallback)(rpc.fs.FileError.serialize(error));
		}));
	}

	rpc.fs.Entry.prototype.getParent = function (params, successCallback, errorCallback) {
		var __object = rpc.fs.Entry.deserialize(params[0]);

		__object.getParent(bind(this, function (entry) {
			bind(null, successCallback)(rpc.fs.Entry.serialize(entry));
		}), bind(this, function (error) {
			bind(null, errorCallback)(rpc.fs.FileError.serialize(error));
		}));
	}

	rpc.fs.Entry.prototype.moveTo = function (params, successCallback, errorCallback) {
	}

	rpc.fs.Entry.prototype.copyTo = function (params, successCallback, errorCallback) {
	}

	rpc.fs.Entry.prototype.remove = function (params, successCallback, errorCallback) {
	}

	rpc.fs.DirectoryEntry = function () {
	}

	rpc.fs.DirectoryEntry.prototype.getFile = function (params, successCallback, errorCallback) {
		var __object = rpc.fs.Entry.deserialize(params[0]);

		__object.getFile(params[1], params[2], bind(this, function (entry) {
			bind(null, successCallback)(rpc.fs.Entry.serialize(entry));
		}), bind(this, function (error) {
			bind(null, errorCallback)(rpc.fs.FileError.serialize(error));
		}));
	}

	rpc.fs.DirectoryEntry.prototype.getDirectory = function (params, successCallback, errorCallback) {
		var __object = rpc.fs.Entry.deserialize(params[0]);

		__object.getDirectory(params[1], params[2], bind(this, function (entry) {
			bind(null, successCallback)(rpc.fs.Entry.serialize(entry));
		}), bind(this, function (error) {
			bind(null, errorCallback)(rpc.fs.FileError.serialize(error));
		}));
	}

	rpc.fs.DirectoryEntry.prototype.removeRecursively = function (params, successCallback, errorCallback) {
	}

	rpc.fs.DirectoryReader = function () {
	}

	rpc.fs.DirectoryReader.prototype.readEntries = function (params, successCallback, errorCallback) {
		var __object = rpc.fs.Entry.deserialize(params[0]).createReader();

		__object.__begin = params[1];
		__object.__length = params[2];

		__object.readEntries(bind(this, function (entries) {
			bind(null, successCallback)({
				__begin: __object.__begin,
				__length: __object.__length,
				entries: entries.map(rpc.fs.Entry.serialize, this)
			});
		}), bind(this, function (error) {
			bind(null, errorCallback)(rpc.fs.FileError.serialize(error));
		}));
	}

	rpc.fs.FileError = function () {
	}

	rpc.fs.FileError.serialize = function (error) {
		return {
			code: error.code
		};
	}

	rpc.fs.FileError.deserialize = function (object) {
		return new fs.FileError(object.code);
	}

	rpc.registerObject("RemoteFileSystem", new rpc.fs.RemoteFileSystem());
	rpc.registerObject("Entry", new rpc.fs.Entry());
	rpc.registerObject("DirectoryEntry", new rpc.fs.DirectoryEntry());
	rpc.registerObject("DirectoryReader", new rpc.fs.DirectoryReader());
})(module.exports);