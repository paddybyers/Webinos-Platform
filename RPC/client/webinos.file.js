// TODO Extract (de)serialization?
(function (exports) {
	"use strict";

	var rpc = webinos.rpc;
	var utils = webinos.utils;

	utils.path = {
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

	file.LocalFileSystem = function (object) {
		WebinosService.call(this, object);
	}

	file.LocalFileSystem.TEMPORARY = 0;
	file.LocalFileSystem.PERSISTENT = 1;

	file.LocalFileSystem.prototype = new WebinosService();
	file.LocalFileSystem.prototype.constructor = file.LocalFileSystem;

	file.LocalFileSystem.prototype.requestFileSystem = function (type, size, successCallback, errorCallback) {
		utils.bind(utils.rpc.request(this, 'requestFileSystem', function (result) {
			utils.callback(successCallback, this)(file.FileSystem.deserialize(this, result));
		}, function (error) {
			utils.callback(errorCallback, this)(file.FileError.deserialize(error));
		}), this)(type, size);
	}

	file.LocalFileSystem.prototype.resolveLocalFileSystemURL = function (url, successCallback, errorCallback) {
		utils.bind(utils.rpc.request(this, 'resolveLocalFileSystemURL', function (result) {
			utils.callback(successCallback, this)(file.Entry.deserialize(this, result));
		}, function (error) {
			utils.callback(errorCallback, this)(file.FileError.deserialize(error));
		}), this)(url);
	}

	file.FileSystem = function (service, name, realPath) {
		this.name = name;
		this.root = new file.DirectoryEntry(this, '/');

		this.__service = service;
		this.__realPath = realPath;
	}

	file.FileSystem.serialize = function (filesystem) {
		return {
			name: filesystem.name,
			__realPath: filesystem.__realPath
		};
	}

	file.FileSystem.deserialize = function (service, object) {
		return new file.FileSystem(service, object.name, object.__realPath);
	}

	file.Entry = function (filesystem, fullPath) {
		this.filesystem = filesystem;

		this.name = utils.path.basename(fullPath);
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

	file.Entry.deserialize = function (service, object) {
		if (object.isFile)
			var entry = file.FileEntry;
		else if (object.isDirectory)
			var entry = file.DirectoryEntry;

		return new entry(file.FileSystem.deserialize(service, object.filesystem), object.fullPath);
	}

	file.Entry.prototype.isFile = false;
	file.Entry.prototype.isDirectory = false;

	file.Entry.prototype.copyTo = function (parent, newName, successCallback, errorCallback) {
		utils.bind(utils.rpc.request(this.filesystem.__service, 'copyTo', function (result) {
			utils.callback(successCallback, this)(file.Entry.deserialize(this.filesystem.__service, result));
		}, function (error) {
			utils.callback(errorCallback, this)(file.FileError.deserialize(error));
		}), this)(file.Entry.serialize(this), file.Entry.serialize(parent), newName);
	}

	file.Entry.prototype.getMetadata = function (successCallback, errorCallback) {
		utils.bind(utils.rpc.request(this.filesystem.__service, 'getMetadata', function (result) {
			utils.callback(successCallback, this)(result);
		}, function (error) {
			utils.callback(errorCallback, this)(file.FileError.deserialize(error));
		}), this)(file.Entry.serialize(this));
	}

	file.Entry.prototype.getParent = function (successCallback, errorCallback) {
		utils.bind(utils.rpc.request(this.filesystem.__service, 'getParent', function (result) {
			utils.callback(successCallback, this)(file.Entry.deserialize(this.filesystem.__service, result));
		}, function (error) {
			utils.callback(errorCallback, this)(file.FileError.deserialize(error));
		}), this)(file.Entry.serialize(this));
	}

	file.Entry.prototype.moveTo = function (parent, newName, successCallback, errorCallback) {
		utils.bind(utils.rpc.request(this.filesystem.__service, 'moveTo', function (result) {
			utils.callback(successCallback, this)(file.Entry.deserialize(this.filesystem.__service, result));
		}, function (error) {
			utils.callback(errorCallback, this)(file.FileError.deserialize(error));
		}), this)(file.Entry.serialize(this), file.Entry.serialize(parent), newName);
	}

	file.Entry.prototype.remove = function (successCallback, errorCallback) {
		utils.bind(utils.rpc.request(this.filesystem.__service, 'remove', function (result) {
			utils.callback(successCallback, this)();
		}, function (error) {
			utils.callback(errorCallback, this)(file.FileError.deserialize(error));
		}), this)(file.Entry.serialize(this));
	}

	// TODO Transmit filesystem url.
	file.Entry.prototype.toURL = function (mimeType) {
		return '';
	}

	file.DirectoryEntry = function (filesystem, fullPath) {
		file.Entry.call(this, filesystem, fullPath);
	}

	file.DirectoryEntry.prototype = new file.Entry();
	file.DirectoryEntry.prototype.constructor = file.DirectoryEntry;

	file.DirectoryEntry.prototype.isDirectory = true;

	file.DirectoryEntry.prototype.createReader = function () {
		return new file.DirectoryReader(this);
	}

	file.DirectoryEntry.prototype.getDirectory = function (path, options, successCallback, errorCallback) {
		utils.bind(utils.rpc.request(this.filesystem.__service, 'getDirectory', function (result) {
			utils.callback(successCallback, this)(file.Entry.deserialize(this.filesystem.__service, result));
		}, function (error) {
			utils.callback(errorCallback, this)(file.FileError.deserialize(error));
		}), this)(file.Entry.serialize(this), path, options);
	}

	file.DirectoryEntry.prototype.getFile = function (path, options, successCallback, errorCallback) {
		utils.bind(utils.rpc.request(this.filesystem.__service, 'getFile', function (result) {
			utils.callback(successCallback, this)(file.Entry.deserialize(this.filesystem.__service, result));
		}, function (error) {
			utils.callback(errorCallback, this)(file.FileError.deserialize(error));
		}), this)(file.Entry.serialize(this), path, options);
	}

	file.DirectoryEntry.prototype.removeRecursively = function (successCallback, errorCallback) {
		utils.bind(utils.rpc.request(this.filesystem.__service, 'removeRecursively', function (result) {
			utils.callback(successCallback, this)();
		}, function (error) {
			utils.callback(errorCallback, this)(file.FileError.deserialize(error));
		}), this)(file.Entry.serialize(this));
	}

	file.DirectoryReader = function (entry) {
		this.__entry = entry;
	}

	file.DirectoryReader.prototype.__begin = 0;
	file.DirectoryReader.prototype.__length = 10;

	file.DirectoryReader.prototype.readEntries = function (successCallback, errorCallback) {
		utils.bind(utils.rpc.request(this.__entry.filesystem.__service, 'readEntries', function (result) {
			this.__begin = result.__begin;
			this.__length = result.__length;

			utils.callback(successCallback, this)(result.entries.map(function (object) {
				return file.Entry.deserialize(this.__entry.filesystem.__service, object);
			}, this));
		}, function (error) {
			utils.callback(errorCallback, this)(file.FileError.deserialize(error));
		}), this)(file.Entry.serialize(this.__entry), this.__begin, this.__length);
	}

	file.FileEntry = function (filesystem, fullPath) {
		file.Entry.call(this, filesystem, fullPath);
	}

	file.FileEntry.prototype = new file.Entry();
	file.FileEntry.prototype.constructor = file.FileEntry;

	file.FileEntry.prototype.isFile = true;

	file.FileEntry.prototype.createWriter = function (successCallback, errorCallback) {
		utils.callback(successCallback, this)(new file.FileWriter(this));
	}

	file.FileEntry.prototype.file = function (successCallback, errorCallback) {
		utils.callback(successCallback, this)(new file.File(this));
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
})((typeof webinos !== 'undefined' ? webinos : webinos = {}).file = {});