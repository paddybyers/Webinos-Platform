/**
 * W3C File API (including Writer, and Directories and System) implementation.
 * 
 * Latest published versions:
 * - {@link http://www.w3.org/TR/FileAPI/}
 * - {@link http://www.w3.org/TR/file-writer-api/}
 * - {@link http://www.w3.org/TR/file-system-api/}
 * 
 * @author Felix-Johannes Jendrusch <felix-johannes.jendrusch@fokus.fraunhofer.de>
 * 
 * TODO Use async ({@link http://github.com/caolan/async}) by Caolan McMahon?
 * TODO Use error codes according to specification.
 */
(function (exports) {
	"use strict";

	var __fs = require('fs');
	var __path = require('path');

	var utils = require('./webinos.utils.js');

	/**
	 * Node.js - Path {@link https://github.com/joyent/node/blob/master/lib/path.js} module extract.
	 * 
	 * @namespace File system utilities.
	 */
	utils.fs = {
		/**
		 * Normalizes a path array, i.e., an array without slashes, empty elements, or device names (C:\), by resolving
		 * . and .. elements. Relative and absolute paths are not distinguished.
		 * 
		 * @param {String[]} parts The path array.
		 * @param {Boolean} [allowAboveRoot=false] Whether the path is allowed to go above the root.
		 * @returns {String[]} A normalized path array.
		 */
		normalizeArray: function (parts, allowAboveRoot) {
			var up = 0;

			for ( var i = parts.length - 1; i >= 0; i--) {
				var last = parts[i];

				if (last == '.')
					parts.splice(i, 1);
				else if (last === '..') {
					parts.splice(i, 1);

					up++;
				} else if (up) {
					parts.splice(i, 1);

					up--;
				}
			}

			if (allowAboveRoot)
				for (; up--;)
					parts.unshift('..');

			return parts;
		},

		/**
		 * Normalizes a path by resolving . and .. parts, and removes any trailing slashes (default behaviour).
		 * 
		 * @param {String} path The path.
		 * @param {Boolean} [preserveTrailingSlash=false] Whether a single trailing slash should be preserved.
		 * @returns {String} A normalized path.
		 * 
		 * @see utils.fs.normalizeArray
		 */
		normalize: function (path, preserveTrailingSlash) {
			var isAbsolute = path.charAt(0) === '/', trailingSlash = path.charAt(path.length - 1) === '/';

			path = utils.fs.normalizeArray(path.split('/').filter(function (p) {
				return !!p;
			}), !isAbsolute).join('/');

			if (!path && !isAbsolute)
				path = '.';

			if (path && trailingSlash && preserveTrailingSlash)
				path += '/';

			return (isAbsolute ? '/' : '') + path;
		},

		/**
		 * Checks if the given paths refer to the same entry. Both paths are normalized prior to comparison.
		 * 
		 * @param {String} path1 First path.
		 * @param {String} path2 Second path.
		 * @returns {Boolean} True if path1 and path2 refer to the same entry, false otherwise.
		 */
		equals: function (path1, path2) {
			return (utils.fs.normalize(path1, false) == utils.fs.normalize(path2, false));
		},

		/**
		 * Joins all arguments together and normalizes the resulting path.
		 * 
		 * @returns {String} The joined and normalized path.
		 */
		join: function () {
			var paths = Array.prototype.slice.call(arguments, 0);

			return utils.fs.normalize(paths.filter(function (p) {
				return typeof p === 'string' && p;
			}, false).join('/'));
		}
	};

	var fs = exports;

	fs.Blob = function () {
	}
	
	fs.Blob.prototype.size = 0;
	fs.Blob.prototype.type = '';
	
	fs.File = function (entry) {
		fs.Blobl.call(this);
		
		this.__entry = entry;
		
		try {
			var stats = __fs.stat(entry.filesystem.realize(entry.fullPath));
		} catch (exception) {
			throw fs.FileException.wrap(exception);
		}
		
		this.name = entry.name;
		this.size = stats.size;
		this.lastModifiedDate = stats.mtime;
	}

	fs.File.prototype = fs.Blob;
	fs.File.prototype.constructor = fs.File;
	
	fs.File.prototype.__start = 0;
	fs.File.prototype.__length = -1;
	
	fs.File.prototype.slice = function (start, length, contentType) {
		var newFile = new File(this.__entry);
		
		// ...
		
		return newFile;
	}
	
	fs.RemoteFileSystem = function () {
	}

	fs.RemoteFileSystem.TEMPORARY = 0;
	fs.RemoteFileSystem.PERSISTENT = 1;

	// TODO Choose file system according to specification.
	fs.RemoteFileSystem.prototype.requestFileSystem = function (type, size, successCallback, errorCallback) {
		utils.callback(successCallback, null)(new fs.FileSystem('default', process.cwd()));
	}

	fs.RemoteFileSystem.prototype.resolveLocalFileSystemURL = function (url, successCallback, errorCallback) {
	}

	fs.FileSystem = function (name, realPath) {
		this.name = name;
		this.root = new fs.DirectoryEntry(this, '/');

		this.__realPath = realPath;
	}

	fs.FileSystem.prototype.realize = function (fullPath) {
		if (utils.fs.equals(this.root.fullPath, fullPath))
			return this.__realPath;

		return __path.join(this.__realPath, fullPath);
	}

	fs.Entry = function (filesystem, fullPath) {
		this.filesystem = filesystem;

		this.name = __path.basename(fullPath);
		this.fullPath = fullPath;
	}

	fs.Entry.create = function (filesystem, fullPath, successCallback, errorCallback) {
		__fs.stat(filesystem.realize(fullPath), utils.erroneous(function (stats) {
			if (stats.isDirectory())
				var entry = fs.DirectoryEntry;
			else if (stats.isFile())
				var entry = fs.FileEntry;
			else
				return void (utils.callback(errorCallback, null)(new fs.FileError(fs.FileError.SECURITY_ERR)));

			utils.callback(successCallback, null)(new entry(filesystem, fullPath));
		}, function (error) {
			utils.callback(errorCallback, null)(fs.FileError.wrap(error));
		}, null));
	}

	fs.Entry.prototype.isFile = false;
	fs.Entry.prototype.isDirectory = false;

	// Node.js - Path {@link https://github.com/joyent/node/blob/master/lib/path.js} module extract.
	fs.Entry.prototype.resolve = function () {
		var resolvedPath = '';

		for ( var i = arguments.length - 1; i >= -1; i--) {
			var path = (i >= 0) ? arguments[i] : this.fullPath;

			if (typeof path !== 'string' || !path)
				continue;

			resolvedPath = path + '/' + resolvedPath;

			if (path.charAt(0) === '/')
				break;
		}

		// Falling back to this.fullPath should always resolve an absolute path. Hence, remembering whether the
		// resolved path is absolute (resolvedAbsolute) becomes unnecessary.

		resolvedPath = utils.fs.normalizeArray(resolvedPath.split('/').filter(function (p) {
			return !!p;
		}), false).join('/');

		return '/' + resolvedPath;
	}

	// Node.js - Path {@link https://github.com/joyent/node/blob/master/lib/path.js} module extract.
	fs.Entry.prototype.relative = function (to) {
		var fromParts = this.fullPath.split('/');
		var toParts = this.resolve(to).split('/');

		// Both, this.fullPath and this.resolve(to) should always be absolute and normalized. Hence, trimming, i.e.,
		// removing empty parts, becomes unnecessary.

		var length = Math.min(fromParts.length, toParts.length);
		var samePartsLength = length;

		for ( var i = 0; i < length; i++)
			if (fromParts[i] !== toParts[i]) {
				samePartsLength = i;

				break;
			}

		var outputParts = [];

		for ( var i = samePartsLength; i < fromParts.length; i++)
			outputParts.push('..');

		outputParts = outputParts.concat(toParts.slice(samePartsLength));

		return outputParts.join('/');
	}

	fs.Entry.prototype.getMetadata = function (successCallback, errorCallback) {
		__fs.stat(this.filesystem.realize(this.fullPath), utils.erroneous(function (stats) {
			utils.callback(successCallback, null)({
				modificationTime: stats.mtime
			});
		}, function (error) {
			utils.callback(errorCallback, null)(fs.FileError.wrap(error));
		}, this));
	}

	fs.Entry.prototype.getParent = function (successCallback, errorCallback) {
		if (utils.fs.equals(this.fullPath, this.filesystem.root.fullPath))
			return void (utils.callback(successCallback, null)(this));

		utils.callback(successCallback, null)(new fs.DirectoryEntry(this.filesystem, __path.dirname(this.fullPath)));
	}

	fs.Entry.prototype.moveTo = function (parent, newName, successCallback, errorCallback) {
		newName = newName || this.name;

		this.getParent(utils.bind(function (currentParent) {
			var newFullPath = utils.fs.join(parent.fullPath, newName);

			if (utils.fs.equals(parent.fullPath, currentParent.fullPath) && (newName == this.name))
				return void (utils.callback(errorCallback, null)(new fs.FileError(fs.FileError.SECURITY_ERR)));

			__fs.rename(this.filesystem.realize(this.fullPath), parent.filesystem.realize(newFullPath), utils
					.erroneous(function () {
						fs.Entry.create(parent.filesystem, newFullPath, successCallback, errorCallback);
					}, function (error) {
						utils.callback(errorCallback, null)(fs.FileError.wrap(error));
					}, this));
		}, this), errorCallback);
	}

	// TODO Use DirectoryEntry and FileEntry to create/copy entries?
	fs.Entry.prototype.copyTo = function (parent, newName, successCallback, errorCallback) {
		newName = newName || this.name;

		this.getParent(utils.bind(function (currentParent) {
			var newFullPath = utils.fs.join(parent.fullPath, newName);

			if (utils.fs.equals(parent.fullPath, currentParent.fullPath) && (newName == this.name))
				return void (utils.callback(errorCallback, null)(new fs.FileError(fs.FileError.SECURITY_ERR)));

			if (this.isDirectory) {
				if (parent.isSubdirectoryOf(this))
					return void (utils.callback(errorCallback, null)(new fs.FileError(fs.FileError.SECURITY_ERR)));

				this.traverse({
					preOrder: utils.bind(function (entry, successCallback, errorCallback) {
						var entryFullPath = utils.fs.join(newFullPath, this.relative(entry.fullPath));

						try {
							if (entry.isDirectory) {
								var stats = __fs.statSync(entry.filesystem.realize(entry.fullPath));

								__fs.mkdirSync(parent.filesystem.realize(entryFullPath), stats.mode);
							} else if (entry.isFile)
								__fs.writeFileSync(parent.filesystem.realize(entryFullPath), __fs
										.readFileSync(entry.filesystem.realize(entry.fullPath)));
						} catch (exception) {
							return void (errorCallback(fs.FileError.wrap(exception)));
						}

						successCallback();
					}, this)
				}, utils.bind(function () {
					utils.callback(successCallback, null)(new fs.DirectoryEntry(parent.filesystem, newFullPath));
				}, this), errorCallback);
			} else if (this.isFile) {
				__fs.readFile(this.filesystem.realize(this.fullPath), utils.erroneous(function (data) {
					__fs.writeFile(parent.filesystem.realize(newFullPath), data, utils.erroneous(function () {
						utils.callback(successCallback, null)(new fs.FileEntry(parent.filesystem, newFullPath));
					}, function (error) {
						utils.callback(errorCallback, null)(fs.FileError.wrap(error));
					}, this));
				}, function (error) {
					utils.callback(errorCallback, null)(fs.FileError.wrap(error));
				}, this));
			}
		}, this), errorCallback);
	}

	fs.Entry.prototype.remove = function (successCallback, errorCallback) {
		if (utils.fs.equals(this.fullPath, this.filesystem.root.fullPath))
			return void (utils.callback(errorCallback, null)(new fs.FileError(fs.FileError.SECURITY_ERR)));

		if (this.isDirectory)
			var remove = __fs.rmdir;
		else if (this.isFile)
			var remove = __fs.unlink;

		remove(this.filesystem.realize(this.fullPath), utils.erroneous(function () {
			utils.callback(successCallback, null)();
		}, function (error) {
			utils.callback(errorCallback, null)(fs.FileError.wrap(error));
		}, this));
	}

	// TODO Choose filesystem url scheme, e.g., <filesystem:http://example.domain/persistent-or-temporary/path/to/file.html>.
	fs.Entry.prototype.toURL = function () {
	}

	fs.DirectoryEntry = function (filesystem, fullPath) {
		fs.Entry.call(this, filesystem, fullPath);
	}

	fs.DirectoryEntry.prototype = fs.Entry;
	fs.DirectoryEntry.prototype.constructor = fs.DirectoryEntry;

	fs.DirectoryEntry.prototype.isDirectory = true;

	fs.DirectoryEntry.prototype.createReader = function () {
		return new fs.DirectoryReader(this);
	}

	fs.DirectoryEntry.prototype.getFile = function (path, options, successCallback, errorCallback) {
		var fullPath = this.resolve(path);

		__path.exists(this.filesystem.realize(fullPath), utils.conditional(function () {
			if (options && options.create && options.exclusive)
				return void (utils.callback(errorCallback, null)(new fs.FileError(fs.FileError.PATH_EXISTS_ERR)));

			fs.Entry.create(this.filesystem, fullPath, utils.bind(
					function (entry) {
						if (!entry.isFile)
							return void (utils.callback(errorCallback, null)(new fs.FileError(
									fs.FileError.TYPE_MISMATCH_ERR)));

						utils.callback(successCallback, null)(entry);
					}, this), errorCallback);
		}, function () {
			if (!options || !options.create)
				return void (utils.callback(errorCallback, null)(new fs.FileError(fs.FileError.NOT_FOUND_ERR)));

			try {
				__fs.closeSync(__fs.openSync(this.filesystem.realize(fullPath), 'w'));
			} catch (exception) {
				return void (utils.callback(errorCallback, null)(fs.FileError.wrap(exception)));
			}

			utils.callback(successCallback, null)(new fs.FileEntry(this.filesystem, fullPath));
		}, this));
	}

	fs.DirectoryEntry.prototype.isSubdirectoryOf = function (entry) {
		var fullPath = this.fullPath;

		while (fullPath != this.filesystem.root.fullPath) {
			if (utils.fs.equals(fullPath, entry.fullPath))
				return true;

			fullPath = __path.dirname(fullPath);
		}

		return false;
	}

	fs.DirectoryEntry.prototype.getDirectory = function (path, options, successCallback, errorCallback) {
		var fullPath = this.resolve(path);

		__path.exists(this.filesystem.realize(fullPath), utils.conditional(function () {
			if (options && options.create && options.exclusive)
				return void (utils.callback(errorCallback, null)(new fs.FileError(fs.FileError.PATH_EXISTS_ERR)));

			fs.Entry.create(this.filesystem, fullPath, utils.bind(
					function (entry) {
						if (!entry.isDirectory)
							return void (utils.callback(errorCallback, null)(new fs.FileError(
									fs.FileError.TYPE_MISMATCH_ERR)));

						utils.callback(successCallback, null)(entry);
					}, this), errorCallback);
		}, function () {
			if (!options || !options.create)
				return void (utils.callback(errorCallback, null)(new fs.FileError(fs.FileError.NOT_FOUND_ERR)));

			try {
				var stats = __fs.statSync(this.filesystem.realize(this.fullPath));

				__fs.mkdirSync(this.filesystem.realize(fullPath), stats.mode);
			} catch (exception) {
				return void (utils.callback(errorCallback, null)(fs.FileError.wrap(exception)));
			}

			utils.callback(successCallback, null)(new fs.DirectoryEntry(this.filesystem, fullPath));
		}, this));
	}

	// TODO Use DirectoryReader to read directories?
	fs.DirectoryEntry.prototype.traverse = function (operationCallback, successCallback, errorCallback) {
		var defaultOperation = function (entry, successCallback, errorCallback) {
			successCallback();
		};

		operationCallback.preOrder = operationCallback.preOrder || defaultOperation;
		operationCallback.postOrder = operationCallback.postOrder || defaultOperation;

		__fs.readdir(this.filesystem.realize(this.fullPath), utils.erroneous(function (files) {
			utils.callback(operationCallback.preOrder, null)(this, utils.bind(function () {
				var traverse = utils.bind(function () {
					if (files.length == 0)
						return void (utils.callback(operationCallback.postOrder, null)(this, utils.bind(function () {
							utils.callback(successCallback, null)();
						}, this), errorCallback));

					var file = files.shift();

					fs.Entry.create(this.filesystem, utils.fs.join(this.fullPath, file), utils.bind(function (entry) {
						if (entry.isDirectory)
							entry.traverse(operationCallback, traverse, errorCallback);
						else if (entry.isFile)
							utils.callback(operationCallback.preOrder, null)(entry, utils.bind(function () {
								utils.callback(operationCallback.postOrder, null)(entry, utils.bind(function () {
									traverse();
								}, this), errorCallback);
							}, this), errorCallback);
					}, this), errorCallback);
				}, this);

				traverse();
			}, this), errorCallback);
		}, function (error) {
			utils.callback(errorCallback, null)(fs.FileError.wrap(error));
		}, this));
	}

	fs.DirectoryEntry.prototype.removeRecursively = function (successCallback, errorCallback) {
		if (utils.fs.equals(this.fullPath, this.filesystem.root.fullPath))
			return void (utils.callback(errorCallback, null)(new fs.FileError(fs.FileError.SECURITY_ERR)));

		this.traverse({
			postOrder: utils.bind(function (entry, successCallback, errorCallback) {
				entry.remove(successCallback, errorCallback);
			}, this)
		}, successCallback, errorCallback);
	}

	fs.DirectoryReader = function (entry) {
		this.__entry = entry;
	}

	fs.DirectoryReader.prototype.__begin = 0;
	fs.DirectoryReader.prototype.__length = 10;

	// TODO Rework (read directory only once).
	fs.DirectoryReader.prototype.readEntries = function (successCallback, errorCallback) {
		__fs.readdir(this.__entry.filesystem.realize(this.__entry.fullPath), utils.erroneous(function (files) {
			var extract = files.slice(this.__begin, this.__begin + this.__length);
			var entries = [];

			var entrify = utils.bind(function () {
				var file = extract.shift();

				if (typeof file === 'undefined') {
					this.__begin += entries.length;

					return void (utils.callback(successCallback, null)(entries));
				}

				fs.Entry.create(this.__entry.filesystem, utils.fs.join(this.__entry.fullPath, file), utils.bind(
						function (entry) {
							entries.push(entry);

							entrify();
						}, this), errorCallback);
			}, this);

			entrify();
		}, function (error) {
			utils.callback(errorCallback, null)(fs.FileError.wrap(error));
		}, this));
	}

	fs.FileEntry = function (filesystem, fullPath) {
		fs.Entry.call(this, filesystem, fullPath);
	}

	fs.FileEntry.prototype = fs.Entry;
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