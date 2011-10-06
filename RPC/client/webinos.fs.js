(function (exports) {
	var fs = exports;
	var rpc = webinos.rpc;

	// MDN {@link https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind}
	if (!Function.prototype.bind) {
		Function.prototype.bind = function (oThis) {
			if (typeof this !== "function") // closest thing possible to the ECMAScript 5 internal IsCallable function
				throw new TypeError("Function.prototype.bind - what is trying to be fBound is not callable");

			var aArgs = Array.prototype.slice.call(arguments, 1), fToBind = this, fNOP = function () {
			}, fBound = function () {
				return fToBind.apply(this instanceof fNOP ? this : oThis || window, aArgs.concat(Array.prototype.slice
						.call(arguments)));
			};

			fNOP.prototype = this.prototype;
			fBound.prototype = new fNOP();

			return fBound;
		};
	}

	var bind = function (thisArg, fun) {
		return fun.bind(thisArg);
	}

	var callback = function (thisArg, fun) {
		if (typeof fun === 'function')
			return bind(thisArg, fun);

		return new Function();
	}

	var request = function (service, method, params, requestCallback) {
		var message = webinos.rpc.createRPC(service, method, params);

		webinos.rpc.executeRPC(message, requestCallback.onResult, requestCallback.onError);
	}

	// php.js {@link http://phpjs.org/functions/dirname:388}
	var basename = function (path, suffix) {
		if (!path)
			return path;

		var b = path.replace(/^.*[\/\\]/g, '');

		if (typeof (suffix) == 'string' && b.substr(b.length - suffix.length) == suffix) {
			b = b.substr(0, b.length - suffix.length);
		}

		return b;
	}

	fs.RemoteFileSystem = function () {
	}

	fs.RemoteFileSystem.TEMPORARY = 0;
	fs.RemoteFileSystem.PERSISTENT = 1;

	fs.RemoteFileSystem.prototype = new WebinosService;
	fs.RemoteFileSystem.prototype.constructor = fs.RemoteFileSystem;

	fs.RemoteFileSystem.prototype.requestFileSystem = function (type, size, successCallback, errorCallback) {
		request('RemoteFileSystem', 'requestFileSystem', [type, size], {
			onResult: bind(this, function (result) {
				callback(null, successCallback)(fs.FileSystem.deserialize(result));
			}),
			onError: bind(this, function (error) {
				callback(null, errorCallback)(fs.FileError.deserialize(error));
			})
		});
	}

	fs.RemoteFileSystem.prototype.resolveLocalFileSystemURL = function (url, successCallback, errorCallback) {
	}

	fs.FileSystem = function (name, realPath) {
		this.name = name;
		this.root = new fs.DirectoryEntry(this, '/');

		this.__realPath = realPath;
	}

	fs.FileSystem.serialize = function (filesystem) {
		return {
			name: filesystem.name,
			__realPath: filesystem.__realPath
		};
	}

	fs.FileSystem.deserialize = function (object) {
		return new fs.FileSystem(object.name, object.__realPath);
	}

	fs.Entry = function (filesystem, fullPath) {
		this.filesystem = filesystem;

		this.name = basename(fullPath);
		this.fullPath = fullPath;
	}

	fs.Entry.serialize = function (entry) {
		return {
			filesystem: fs.FileSystem.serialize(entry.filesystem),
			fullPath: entry.fullPath,
			isFile: entry.isFile,
			isDirectory: entry.isDirectory
		};
	}

	fs.Entry.deserialize = function (object) {
		if (object.isFile)
			var entry = fs.FileEntry;
		else if (object.isDirectory)
			var entry = fs.DirectoryEntry;

		return new entry(fs.FileSystem.deserialize(object.filesystem), object.fullPath);
	}

	fs.Entry.prototype.isFile = false;
	fs.Entry.prototype.isDirectory = false;

	fs.Entry.prototype.getMetadata = function (successCallback, errorCallback) {
		request('Entry', 'getMetadata', [fs.Entry.serialize(this)], {
			onResult: bind(this, function (result) {
				callback(null, successCallback)(result);
			}),
			onError: bind(this, function (error) {
				callback(null, errorCallback)(fs.FileError.deserialize(error));
			})
		});
	}

	fs.Entry.prototype.getParent = function (successCallback, errorCallback) {
		request('Entry', 'getParent', [fs.Entry.serialize(this)], {
			onResult: bind(this, function (result) {
				callback(null, successCallback)(fs.Entry.deserialize(result));
			}),
			onError: bind(this, function (error) {
				callback(null, errorCallback)(fs.FileError.deserialize(error));
			})
		});
	}

	fs.Entry.prototype.moveTo = function (parent, newName, successCallback, errorCallback) {
	}

	fs.Entry.prototype.copyTo = function (parent, newName, successCallback, errorCallback) {
	}

	fs.Entry.prototype.remove = function (successCallback, errorCallback) {
	}

	fs.Entry.prototype.toURL = function () {
	}

	fs.DirectoryEntry = function (filesystem, fullPath) {
		fs.Entry.call(this, filesystem, fullPath);
	}

	fs.DirectoryEntry.prototype = new fs.Entry();
	fs.DirectoryEntry.prototype.constructor = fs.DirectoryEntry;

	fs.DirectoryEntry.prototype.isDirectory = true;

	fs.DirectoryEntry.prototype.createReader = function () {
		return new fs.DirectoryReader(this);
	}

	fs.DirectoryEntry.prototype.getFile = function (path, options, successCallback, errorCallback) {
		request('DirectoryEntry', 'getFile', [fs.Entry.serialize(this), path, options], {
			onResult: bind(this, function (result) {
				callback(null, successCallback)(fs.Entry.deserialize(result));
			}),
			onError: bind(this, function (error) {
				callback(null, errorCallback)(fs.FileError.deserialize(error));
			})
		});
	}

	fs.DirectoryEntry.prototype.getDirectory = function (path, options, successCallback, errorCallback) {
		request('DirectoryEntry', 'getDirectory', [fs.Entry.serialize(this), path, options], {
			onResult: bind(this, function (result) {
				callback(null, successCallback)(fs.Entry.deserialize(result));
			}),
			onError: bind(this, function (error) {
				callback(null, errorCallback)(fs.FileError.deserialize(error));
			})
		});
	}

	fs.DirectoryEntry.prototype.removeRecursively = function (successCallback, errorCallback) {
	}

	fs.DirectoryReader = function (entry) {
		this.__entry = entry;
	}

	fs.DirectoryReader.prototype.__begin = 0;
	fs.DirectoryReader.prototype.__length = 10;

	fs.DirectoryReader.prototype.readEntries = function (successCallback, errorCallback) {
		request('DirectoryReader', 'readEntries', [fs.Entry.serialize(this.__entry), this.__begin, this.__length], {
			onResult: bind(this, function (result) {
				this.__begin = result.__begin;
				this.__length = result.__length;

				callback(null, successCallback)(result.entries.map(fs.Entry.deserialize, this));
			}),
			onError: bind(this, function (error) {
				callback(null, errorCallback)(fs.FileError.deserialize(error));
			})
		});
	}

	fs.FileEntry = function (filesystem, fullPath) {
		fs.Entry.call(this, filesystem, fullPath);
	}

	fs.FileEntry.prototype = new fs.Entry();
	fs.FileEntry.prototype.constructor = fs.FileEntry;

	fs.FileEntry.prototype.isFile = true;

	// TODO Integrate FileWriter.
	fs.FileEntry.prototype.createWriter = function (successCallback, errorCallback) {
	}

	// TODO Integrate File.
	fs.FileEntry.prototype.file = function (successCallback, errorCallback) {
	}

	fs.FileError = function (code) {
		this.code = code;
	}

	fs.FileError.deserialize = function (object) {
		return new fs.FileError(object.code);
	}

	fs.FileError.NOT_FOUND_ERR = 1;
	fs.FileError.SECURITY_ERR = 2;
	fs.FileError.ABORT_ERR = 3;
	fs.FileError.NOT_READABLE_ERR = 4;
	fs.FileError.ENCODING_ERR = 5;
	fs.FileError.NO_MODIFICATION_ALLOWED_ERR = 6;
	fs.FileError.INVALID_STATE_ERR = 7;
	fs.FileError.SYNTAX_ERR = 8;
	fs.FileError.INVALID_MODIFICATION_ERR = 9;
	fs.FileError.QUOTA_EXCEEDED_ERR = 10;
	fs.FileError.TYPE_MISMATCH_ERR = 11;
	fs.FileError.PATH_EXISTS_ERR = 12;
})((webinos || (webinos = {})).fs = {});