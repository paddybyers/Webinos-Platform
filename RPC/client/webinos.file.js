// TODO Extract (de)serialization?
// TODO Remove unnecessary function bindings.
(function (exports) {
	"use strict";

	var rpc = webinos.rpc;

	var request = function (service, method, params, requestCallback) {
		var message = rpc.createRPC(service, method, params);

		rpc.executeRPC(message, requestCallback.onResult, requestCallback.onError);
	}

	var utils = webinos.utils;

	utils.file = {
		// php.js {@link http://phpjs.org/functions/dirname:388}
		basename: function (path, suffix) {
			if (!path)
				return path;
	
			var b = path.replace(/^.*[\/\\]/g, '');
	
			if (typeof suffix == 'string' && b.substr(b.length - suffix.length) == suffix)
				b = b.substr(0, b.length - suffix.length);
	
			return b;
		}
	};

	var file = exports;

	file.RemoteFileSystem = function () {
	}

	file.RemoteFileSystem.TEMPORARY = 0;
	file.RemoteFileSystem.PERSISTENT = 1;

	file.RemoteFileSystem.prototype = WebinosService;
	file.RemoteFileSystem.prototype.constructor = file.RemoteFileSystem;

	file.RemoteFileSystem.prototype.requestFileSystem = function (type, size, successCallback, errorCallback) {
		request('RemoteFileSystem', 'requestFileSystem', [type, size], {
			onResult: utils.bind(function (result) {
				utils.callback(successCallback, null)(file.FileSystem.deserialize(result));
			}, this),
			onError: utils.bind(function (error) {
				utils.callback(errorCallback, null)(file.FileError.deserialize(error));
			}, this)
		});
	}

	file.RemoteFileSystem.prototype.resolveLocalFileSystemURL = function (url, successCallback, errorCallback) {
		request('RemoteFileSystem', 'resolveLocalFileSystemURL', [url], {
			onResult: utils.bind(function (result) {
				utils.callback(successCallback, null)(file.Entry.deserialize(result));
			}, this),
			onError: utils.bind(function (error) {
				utils.callback(errorCallback, null)(file.FileError.deserialize(error));
			}, this)
		});
	}

	file.FileSystem = function (name, realPath) {
		this.name = name;
		this.root = new file.DirectoryEntry(this, '/');

		this.__realPath = realPath;
	}

	file.FileSystem.serialize = function (filesystem) {
		return {
			name: filesystem.name,
			__realPath: filesystem.__realPath
		};
	}

	file.FileSystem.deserialize = function (object) {
		return new file.FileSystem(object.name, object.__realPath);
	}

	file.Entry = function (filesystem, fullPath) {
		this.filesystem = filesystem;

		this.name = utils.file.basename(fullPath);
		this.fullPath = fullPath;
	}

	file.Entry.serialize = function (entry) {
		return {
			filesystem: file.FileSystem.serialize(entry.filesystem),
			fullPath: entry.fullPath,
			isFile: entry.isFile,
			isDirectory: entry.isDirectory
		};
	}

	file.Entry.deserialize = function (object) {
		if (object.isFile)
			var entry = file.FileEntry;
		else if (object.isDirectory)
			var entry = file.DirectoryEntry;

		return new entry(file.FileSystem.deserialize(object.filesystem), object.fullPath);
	}

	file.Entry.prototype.isFile = false;
	file.Entry.prototype.isDirectory = false;

	file.Entry.prototype.getMetadata = function (successCallback, errorCallback) {
		request('Entry', 'getMetadata', [file.Entry.serialize(this)], {
			onResult: utils.bind(function (result) {
				utils.callback(successCallback, null)(result);
			}, this),
			onError: utils.bind(function (error) {
				utils.callback(errorCallback, null)(file.FileError.deserialize(error));
			}, this)
		});
	}

	file.Entry.prototype.getParent = function (successCallback, errorCallback) {
		request('Entry', 'getParent', [file.Entry.serialize(this)], {
			onResult: utils.bind(function (result) {
				utils.callback(successCallback, null)(file.Entry.deserialize(result));
			}, this),
			onError: utils.bind(function (error) {
				utils.callback(errorCallback, null)(file.FileError.deserialize(error));
			}, this)
		});
	}

	file.Entry.prototype.moveTo = function (parent, newName, successCallback, errorCallback) {
		request('Entry', 'moveTo', [file.Entry.serialize(this), file.Entry.serialize(parent), newName], {
			onResult: utils.bind(function (result) {
				utils.callback(successCallback, null)(file.Entry.deserialize(result));
			}, this),
			onError: utils.bind(function (error) {
				utils.callback(errorCallback, null)(file.FileError.deserialize(error));
			}, this)
		});
	}

	file.Entry.prototype.copyTo = function (parent, newName, successCallback, errorCallback) {
		request('Entry', 'copyTo', [file.Entry.serialize(this), file.Entry.serialize(parent), newName], {
			onResult: utils.bind(function (result) {
				utils.callback(successCallback, null)(file.Entry.deserialize(result));
			}, this),
			onError: utils.bind(function (error) {
				utils.callback(errorCallback, null)(file.FileError.deserialize(error));
			}, this)
		});
	}

	file.Entry.prototype.remove = function (successCallback, errorCallback) {
		request('Entry', 'remove', [file.Entry.serialize(this)], {
			onResult: utils.bind(function (result) {
				utils.callback(successCallback, null)();
			}, this),
			onError: utils.bind(function (error) {
				utils.callback(errorCallback, null)(file.FileError.deserialize(error));
			}, this)
		});
	}

	// TODO Transmit filesystem url.
	file.Entry.prototype.toURL = function () {
		return '';
	}

	file.DirectoryEntry = function (filesystem, fullPath) {
		file.Entry.call(this, filesystem, fullPath);
	}

	file.DirectoryEntry.prototype = file.Entry;
	file.DirectoryEntry.prototype.constructor = file.DirectoryEntry;

	file.DirectoryEntry.prototype.isDirectory = true;

	file.DirectoryEntry.prototype.createReader = function () {
		return new file.DirectoryReader(this);
	}

	file.DirectoryEntry.prototype.getFile = function (path, options, successCallback, errorCallback) {
		request('DirectoryEntry', 'getFile', [file.Entry.serialize(this), path, options], {
			onResult: utils.bind(function (result) {
				utils.callback(successCallback, null)(file.Entry.deserialize(result));
			}, this),
			onError: utils.bind(function (error) {
				utils.callback(errorCallback, null)(file.FileError.deserialize(error));
			}, this)
		});
	}

	file.DirectoryEntry.prototype.getDirectory = function (path, options, successCallback, errorCallback) {
		request('DirectoryEntry', 'getDirectory', [file.Entry.serialize(this), path, options], {
			onResult: utils.bind(function (result) {
				utils.callback(successCallback, null)(file.Entry.deserialize(result));
			}, this),
			onError: utils.bind(function (error) {
				utils.callback(errorCallback, null)(file.FileError.deserialize(error));
			}, this)
		});
	}

	file.DirectoryEntry.prototype.removeRecursively = function (successCallback, errorCallback) {
		request('DirectoryEntry', 'removeRecursively', [file.Entry.serialize(this)], {
			onResult: utils.bind(function (result) {
				utils.callback(successCallback, null)();
			}, this),
			onError: utils.bind(function (error) {
				utils.callback(errorCallback, null)(file.FileError.deserialize(error));
			}, this)
		});
	}

	file.DirectoryReader = function (entry) {
		this.__entry = entry;
	}

	file.DirectoryReader.prototype.__begin = 0;
	file.DirectoryReader.prototype.__length = 10;

	file.DirectoryReader.prototype.readEntries = function (successCallback, errorCallback) {
		request('DirectoryReader', 'readEntries', [file.Entry.serialize(this.__entry), this.__begin, this.__length], {
			onResult: utils.bind(function (result) {
				this.__begin = result.__begin;
				this.__length = result.__length;

				utils.callback(successCallback, null)(result.entries.map(file.Entry.deserialize, this));
			}, this),
			onError: utils.bind(function (error) {
				utils.callback(errorCallback, null)(file.FileError.deserialize(error));
			}, this)
		});
	}

	file.FileEntry = function (filesystem, fullPath) {
		file.Entry.call(this, filesystem, fullPath);
	}

	file.FileEntry.prototype = file.Entry;
	file.FileEntry.prototype.constructor = file.FileEntry;

	file.FileEntry.prototype.isFile = true;

	// TODO Integrate FileWriter.
	file.FileEntry.prototype.createWriter = function (successCallback, errorCallback) {
	}

	// TODO Integrate File.
	file.FileEntry.prototype.file = function (successCallback, errorCallback) {
	}

	file.FileError = function (code) {
		this.code = code;
	}

	file.FileError.deserialize = function (object) {
		return new file.FileError(object.code);
	}

	file.FileError.NOT_FOUND_ERR = 1;
	file.FileError.SECURITY_ERR = 2;
	file.FileError.ABORT_ERR = 3;
	file.FileError.NOT_READABLE_ERR = 4;
	file.FileError.ENCODING_ERR = 5;
	file.FileError.NO_MODIFICATION_ALLOWED_ERR = 6;
	file.FileError.INVALID_STATE_ERR = 7;
	file.FileError.SYNTAX_ERR = 8;
	file.FileError.INVALID_MODIFICATION_ERR = 9;
	file.FileError.QUOTA_EXCEEDED_ERR = 10;
	file.FileError.TYPE_MISMATCH_ERR = 11;
	file.FileError.PATH_EXISTS_ERR = 12;
})((webinos || (webinos = {})).file = {});