// TODO Extract (de)serialization?
(function (exports) {
	"use strict";

	var file = require('./webinos.file.js');

	var rpc = require('./rpc.js');

	rpc.file = exports;

	rpc.file.LocalFileSystem = {
		__object: new file.LocalFileSystem(),

		requestFileSystem: function (params, successCallback, errorCallback) {
			rpc.file.LocalFileSystem.__object.requestFileSystem(params[0], params[1], function (filesystem) {
				successCallback(rpc.file.FileSystem.serialize(filesystem));
			}, function (error) {
				errorCallback(rpc.file.FileError.serialize(error));
			});
		},

		resolveLocalFileSystemURL: function (params, successCallback, errorCallback) {
			rpc.file.LocalFileSystem.__object.resolveLocalFileSystemURL(params[0], function (entry) {
				successCallback(rpc.file.Entry.serialize(entry));
			}, function (error) {
				errorCallback(rpc.file.FileError.serialize(error));
			});
		}
	};

	rpc.file.FileSystem = {
		serialize: function (filesystem) {
			return {
				name: filesystem.name,
				__realPath: filesystem.__realPath
			};
		},
	
		deserialize: function (object) {
			return new file.FileSystem(object.name, object.__realPath);
		}
	}

	rpc.file.Entry = {
		serialize: function (entry) {
			return {
				filesystem: rpc.file.FileSystem.serialize(entry.filesystem),
				fullPath: entry.fullPath,
				isFile: entry.isFile,
				isDirectory: entry.isDirectory
			};
		},
	
		deserialize: function (object) {
			if (object.isFile)
				var entry = file.FileEntry;
			else if (object.isDirectory)
				var entry = file.DirectoryEntry
	
			return new entry(rpc.file.FileSystem.deserialize(object.filesystem), object.fullPath);
		},
	
		copyTo: function (params, successCallback, errorCallback) {
			var __object = rpc.file.Entry.deserialize(params[0]);
			
			__object.copyTo(rpc.file.Entry.deserialize(params[1]), params[2], function (entry) {
				successCallback(rpc.file.Entry.serialize(entry));
			}, function (error) {
				errorCallback(rpc.file.FileError.serialize(error));
			});
		},
	
		getMetadata: function (params, successCallback, errorCallback) {
			var __object = rpc.file.Entry.deserialize(params[0]);
	
			__object.getMetadata(function (metadata) {
				successCallback(metadata);
			}, function (error) {
				errorCallback(rpc.file.FileError.serialize(error));
			});
		},
	
		getParent: function (params, successCallback, errorCallback) {
			var __object = rpc.file.Entry.deserialize(params[0]);
	
			__object.getParent(function (entry) {
				successCallback(rpc.file.Entry.serialize(entry));
			}, function (error) {
				errorCallback(rpc.file.FileError.serialize(error));
			});
		},
	
		moveTo: function (params, successCallback, errorCallback) {
			var __object = rpc.file.Entry.deserialize(params[0]);
	
			__object.moveTo(rpc.file.Entry.deserialize(params[1]), params[2], function (entry) {
				successCallback(rpc.file.Entry.serialize(entry));
			}, function (error) {
				errorCallback(rpc.file.FileError.serialize(error));
			});
		},
	
		remove: function (params, successCallback, errorCallback) {
			var __object = rpc.file.Entry.deserialize(params[0]);
	
			__object.remove(function () {
				successCallback();
			}, function (error) {
				errorCallback(rpc.file.FileError.serialize(error));
			});
		}
	};

	rpc.file.DirectoryEntry = {
		getDirectory: function (params, successCallback, errorCallback) {
			var __object = rpc.file.Entry.deserialize(params[0]);
	
			__object.getDirectory(params[1], params[2], function (entry) {
				successCallback(rpc.file.Entry.serialize(entry));
			}, function (error) {
				errorCallback(rpc.file.FileError.serialize(error));
			});
		},
	
		getFile: function (params, successCallback, errorCallback) {
			var __object = rpc.file.Entry.deserialize(params[0]);
	
			__object.getFile(params[1], params[2], function (entry) {
				successCallback(rpc.file.Entry.serialize(entry));
			}, function (error) {
				errorCallback(rpc.file.FileError.serialize(error));
			});
		},
	
		removeRecursively: function (params, successCallback, errorCallback) {
			var __object = rpc.file.Entry.deserialize(params[0]);
	
			__object.removeRecursively(function () {
				successCallback();
			}, function (error) {
				errorCallback(rpc.file.FileError.serialize(error));
			});
		}
	};
	
	rpc.file.DirectoryReader = {
		readEntries: function (params, successCallback, errorCallback) {
			var __object = rpc.file.Entry.deserialize(params[0]).createReader();
	
			__object.__begin = params[1];
			__object.__length = params[2];
	
			__object.readEntries(function (entries) {
				successCallback({
					__begin: __object.__begin,
					__length: __object.__length,
					entries: entries.map(rpc.file.Entry.serialize)
				});
			}, function (error) {
				errorCallback(rpc.file.FileError.serialize(error));
			});
		}
	};

	rpc.file.FileError = {
		serialize: function (error) {
			return {
				code: error.code
			};
		},
	
		deserialize: function (object) {
			return new file.FileError(object.code);
		}
	}
	
	rpc.file.Service = function (object) {
		RPCWebinosService.call(this, object);
	}
	
	rpc.file.Service.prototype = new RPCWebinosService();
	rpc.file.Service.prototype.constructor = rpc.file.Service;
	
	rpc.file.Service.prototype.requestFileSystem = rpc.file.LocalFileSystem.requestFileSystem;
	rpc.file.Service.prototype.resolveLocalFileSystemURL = rpc.file.LocalFileSystem.resolveLocalFileSystemURL;
	
	rpc.file.Service.prototype.copyTo = rpc.file.Entry.copyTo;
	rpc.file.Service.prototype.getMetadata = rpc.file.Entry.getMetadata;
	rpc.file.Service.prototype.getParent = rpc.file.Entry.getParent;
	rpc.file.Service.prototype.moveTo = rpc.file.Entry.moveTo;
	rpc.file.Service.prototype.remove = rpc.file.Entry.remove;
	
	rpc.file.Service.prototype.getDirectory = rpc.file.DirectoryEntry.getDirectory;
	rpc.file.Service.prototype.getFile = rpc.file.DirectoryEntry.getFile;
	rpc.file.Service.prototype.removeRecursively = rpc.file.DirectoryEntry.removeRecursively;
	
	rpc.file.Service.prototype.readEntries = rpc.file.DirectoryReader.readEntries;

	rpc.registerObject(new rpc.file.Service({
		api: 'http://webinos.org/api/file',
		displayName: 'File API',
		description: 'W3C File API (including Writer, and Directories and System) implementation.'
	}));
})(module.exports);