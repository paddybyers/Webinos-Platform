(function (exports) {
	var fs = exports;
	
	var __fs = require('fs');
	var __path = require('path');

	var bind = function (thisArg, fun) {
		return fun.bind(thisArg);
	}

	var callback = function (thisArg, fun) {
		if (typeof fun === 'function')
			return bind(thisArg, fun);

		return new Function();
	}

	var conditional = function (thisArg, trueCallback, falseCallback) {
		return function (condition) {
			if (condition)
				callback(thisArg, trueCallback)();
			else
				callback(thisArg, falseCallback)();
		};
	}

	var erroneous = function (thisArg, successCallback, errorCallback) {
		return function (error, result) {
			if (error)
				callback(thisArg, errorCallback)(error);
			else
				callback(thisArg, successCallback)(result);
		};
	}

	fs.RemoteFileSystem = function () {
	}

	fs.RemoteFileSystem.TEMPORARY = 0;
	fs.RemoteFileSystem.PERSISTENT = 1;

	// TODO Choose appropriate filesystem.
	fs.RemoteFileSystem.prototype.requestFileSystem = function (type, size, successCallback, errorCallback) {
		callback(null, successCallback)(new fs.FileSystem('default', process.cwd()));
	}

	// TODO Resolve filesystem url.
	fs.RemoteFileSystem.prototype.resolveLocalFileSystemURL = function (url, successCallback, errorCallback) {
	}

	fs.FileSystem = function (name, realPath) {
		this.name = name;
		this.root = new fs.DirectoryEntry(this, '/');

		this.__realPath = realPath;
	}

	fs.FileSystem.prototype.realize = function (fullPath) {
		if (__path.relative(fullPath, this.root.fullPath) == '')
			return this.__realPath;

		return __path.join(this.__realPath, fullPath);
	}

	fs.Entry = function (filesystem, fullPath) {
		this.filesystem = filesystem;

		this.name = __path.basename(fullPath);
		this.fullPath = fullPath;
	}

	// TODO Handle case(s) where fullPath is neither a file nor a directory.
	fs.Entry.createSync = function (filesystem, fullPath) {
		try {
			var stats = __fs.statSync(filesystem.realize(fullPath));
		} catch (exception) {
			throw fs.FileException.wrap(exception);
		}

		if (stats.isDirectory())
			var entry = fs.DirectoryEntry;
		else if (stats.isFile())
			var entry = fs.FileEntry;

		return new entry(filesystem, fullPath);
	}

	fs.Entry.prototype.isFile = false;
	fs.Entry.prototype.isDirectory = false;

	fs.Entry.prototype.getMetadata = function (successCallback, errorCallback) {
		__fs.stat(this.filesystem.realize(this.fullPath), erroneous(this, function (stats) {
			callback(null, successCallback)({
				modificationTime: stats.mtime
			});
		}, function (error) {
			callback(null, errorCallback)(fs.FileError.wrap(error));
		}));
	}

	fs.Entry.prototype.getParent = function (successCallback, errorCallback) {
		if (this.fullPath == this.filesystem.root.fullPath)
			return void (callback(null, successCallback)(this));

		callback(null, successCallback)(new fs.DirectoryEntry(this.filesystem, __path.dirname(this.fullPath)));
	}

	fs.Entry.prototype.moveTo = function (parent, newName, successCallback, errorCallback) {
		// __path.exists(parent + newName) =>this. [remove|removeRecursively](parent + newName)
		// this.isDirectory => !isSubdirectoryOf(parent, this)
		// parent == this.getParent() => newName != this.name
		// this.isFile => !(parent + newName).isDirectory
		// this.isDirectory => !(parent + newName).isFile
		// (parent + newName).isDirectory => (parent + newName).children == 0
	}

	fs.Entry.prototype.copyTo = function (parent, newName, successCallback, errorCallback) {
		// parent == this.getParent() => newName != this.name
		// this.isDirectory => !isSubdirectoryOf(parent, this)
		// this.isDirectory => this.children.copyTo(...)
	}

	fs.Entry.prototype.remove = function (successCallback, errorCallback) {
		if (this.fullPath == this.filesystem.root.fullPath)
			return void (callback(null, errorCallback)(new fs.FileError(fs.FileError.SECURITY_ERR)));

		if (this.isFile)
			var remove = __fs.unlink;
		else if (this.isDirectory)
			var remove = __fs.rmdir;

		remove(this.filesystem.realize(this.fullPath), erroneous(this, function () {
			callback(null, successCallback)();
		}, function (error) {
			callback(null, errorCallback)(fs.FileError.wrap(error));
		}));
	}

	// TODO Choose filesystem url scheme, e.g., <http://example.domain/persistent-or-temporary/path/to/file.html>.
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
		var fullPath = __path.join(this.fullPath, __path.relative(this.fullPath, path));

		__path.exists(this.filesystem.realize(fullPath), conditional(this, function () {
			if (options && options.create && options.exclusive)
				return void (callback(null, errorCallback)(new fs.FileError(fs.FileError.PATH_EXISTS_ERR)));

			try {
				var entry = fs.Entry.createSync(this.filesystem, fullPath);
			} catch (exception) {
				return void (callback(null, errorCallback)(fs.FileError.wrap(exception)));
			}

			if (!entry.isFile)
				return void (callback(null, errorCallback)(new fs.FileError(fs.FileError.TYPE_MISMATCH_ERR)));

			callback(null, successCallback)(entry);
		}, function () {
			if (!options || !options.create)
				return void (callback(null, errorCallback)(new fs.FileError(fs.FileError.NOT_FOUND_ERR)));

			try {
				__fs.closeSync(__fs.openSync(this.filesystem.realize(fullPath), 'w'));
			} catch (exception) {
				return void (callback(null, errorCallback)(fs.FileError.wrap(exception)));
			}

			callback(null, successCallback)(new fs.FileEntry(this.filesystem, fullPath));
		}));
	}

	fs.DirectoryEntry.prototype.getDirectory = function (path, options, successCallback, errorCallback) {
		var fullPath = __path.join(this.fullPath, __path.relative(this.fullPath, path));

		__path.exists(this.filesystem.realize(fullPath), conditional(this, function () {
			if (options && options.create && options.exclusive)
				return void (callback(null, errorCallback)(new fs.FileError(fs.FileError.PATH_EXISTS_ERR)));

			try {
				var entry = fs.Entry.createSync(this.filesystem, fullPath);
			} catch (exception) {
				return void (callback(null, errorCallback)(fs.FileError.wrap(exception)));
			}

			if (!entry.isDirectory)
				return void (callback(null, errorCallback)(new fs.FileError(fs.FileError.TYPE_MISMATCH_ERR)));

			callback(null, successCallback)(entry);
		}, function () {
			if (!options || !options.create)
				return void (callback(null, errorCallback)(new fs.FileError(fs.FileError.NOT_FOUND_ERR)));

			try {
				var stats = __fs.statSync(this.filesystem.realize(this.fullPath));

				__fs.mkdirSync(this.filesystem.realize(fullPath), stats.mode);
			} catch (exception) {
				return void (callback(null, errorCallback)(fs.FileError.wrap(exception)));
			}

			callback(null, successCallback)(new fs.DirectoryEntry(this.filesystem, fullPath));
		}));
	}

	fs.DirectoryEntry.prototype.removeRecursively = function (successCallback, errorCallback) {
		// this.isDirectory => !(this.fullPath == this.filesystem.root.fullPath)
		// !this.children*.[remove|removeRecursively] => continue
	}

	fs.DirectoryReader = function (entry) {
		this.__entry = entry;
	}

	fs.DirectoryReader.prototype.__begin = 0;
	fs.DirectoryReader.prototype.__length = 10;

	// TODO Rework (read directory only once).
	fs.DirectoryReader.prototype.readEntries = function (successCallback, errorCallback) {
		__fs.readdir(this.__entry.filesystem.realize(this.__entry.fullPath), erroneous(this, function (files) {
			try {
				var entries = files.slice(this.__begin, this.__begin + this.__length).map(function (file) {
					return fs.Entry.createSync(this.__entry.filesystem, __path.join(this.__entry.fullPath, file));
				}, this);
			} catch (exception) {
				return void (callback(null, errorCallback)(fs.FileError.wrap(exception)));
			}

			if (entries.length > 0)
				this.__begin += this.__length;

			callback(null, successCallback)(entries);
		}, function (error) {
			callback(null, errorCallback)(fs.FileError.wrap(error));
		}));
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

	fs.FileError.wrap = function (object) {
		var map = {
			'ENOENT': fs.FileError.NOT_FOUND_ERR
		};

		if (object instanceof fs.FileError)
			var code = object.code;
		else if (object instanceof fs.FileException)
			var code = object.code;
		else if (typeof map[object.code] !== 'undefined')
			var code = map[object.code];
		else
			var code = fs.FileError.SECURITY_ERR;

		return new fs.FileError(code);
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

	fs.FileException = function (code) {
		this.code = code;
	}

	fs.FileException.wrap = function (object) {
		var map = {
			'ENOENT': fs.FileException.NOT_FOUND_ERR
		};

		if (object instanceof fs.FileError)
			var code = object.code;
		else if (object instanceof fs.FileException)
			var code = object.code;
		else if (typeof map[object.code] !== 'undefined')
			var code = map[object.code];
		else
			var code = fs.FileException.SECURITY_ERR;

		return new fs.FileException(code);
	}

	fs.FileException.NOT_FOUND_ERR = 1;
	fs.FileException.SECURITY_ERR = 2;
	fs.FileException.ABORT_ERR = 3;
	fs.FileException.NOT_READABLE_ERR = 4;
	fs.FileException.ENCODING_ERR = 5;
	fs.FileException.NO_MODIFICATION_ALLOWED_ERR = 6;
	fs.FileException.INVALID_STATE_ERR = 7;
	fs.FileException.SYNTAX_ERR = 8;
	fs.FileException.INVALID_MODIFICATION_ERR = 9;
	fs.FileException.QUOTA_EXCEEDED_ERR = 10;
	fs.FileException.TYPE_MISMATCH_ERR = 11;
	fs.FileException.PATH_EXISTS_ERR = 12;
})(module.exports);