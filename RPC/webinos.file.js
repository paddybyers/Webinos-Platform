/**
 * W3C File API (including Writer, and Directories and System) implementation.
 * 
 * Latest published versions:
 * - File API -- {@link http://www.w3.org/TR/FileAPI/}
 * - File API: Writer -- {@link http://www.w3.org/TR/file-writer-api/}
 * - File API: Directories and System -- {@link http://www.w3.org/TR/file-system-api/}
 * 
 * @author Felix-Johannes Jendrusch <felix-johannes.jendrusch@fokus.fraunhofer.de>
 * 
 * TODO Use error/exception codes according to specification, e.g., use filesystem operation-dependent maps.
 * TODO Invalidate entries, e.g., after being (re)moved.
 * TODO Respect encoding parameters, e.g., at <pre>file.Blob.prototype.type</pre>.
 * TODO Handle multiple read calls to <pre>file.FileReader</pre>.
 */
(function (exports) {
	"use strict";
	
	var __fs = require('fs');
	var __path = require('path');

	var events = require('./webinos.events.js');
	var utils = require('./webinos.utils.js');

	/**
	 * Node.js -- Path {@link https://github.com/joyent/node/blob/master/lib/path.js} module extract.
	 * 
	 * @namespace Path utilities.
	 */
	utils.path = {
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

			for (var i = parts.length - 1; i >= 0; i--) {
				var last = parts[i];

				if (last == '.')
					parts.splice(i, 1);
				else if (last == '..') {
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
		 * @see utils.path.normalizeArray
		 */
		normalize: function (path, preserveTrailingSlash) {
			var isAbsolute = path.charAt(0) == '/', trailingSlash = path.charAt(path.length - 1) == '/';

			path = utils.path.normalizeArray(path.split('/').filter(function (p) {
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
			return utils.path.normalize(path1, false) == utils.path.normalize(path2, false);
		},

		/**
		 * Joins all arguments together and normalizes the resulting path.
		 * 
		 * @returns {String} The joined and normalized path.
		 */
		join: function () {
			var paths = Array.prototype.slice.call(arguments, 0);

			return utils.path.normalize(paths.filter(function (p) {
				return typeof p === 'string' && p;
			}, false).join('/'));
		}
	};

	utils.file = {
		wrap: function (fun, map) {
			return function () {
				try {
					return fun.apply(this, arguments);
				} catch (exception) {
					if (map && typeof map[exception.code] !== 'undefined')
						var code = map[exception.code];
					else
						var code = file.FileException.SECURITY_ERR;

					throw new file.FileException(code);
				}
			};
		},
		
		schedule: function (fun, successCallback, errorCallback) {
			return function () {
				var argsArray = arguments;
				
				process.nextTick(utils.bind(function () {
					try {
						utils.callback(successCallback, this)(fun.apply(this, argsArray));
					} catch (exception) {
						if (exception instanceof file.FileException)
							var code = exception.code;
						else
							var code = file.FileError.SECURITY_ERR;
						
						utils.callback(errorCallback, this)(new file.FileError(code));
					}
				}, this));
			}
		},

		sync: function (object) {
			if (object instanceof file.LocalFileSystem)
				return new file.LocalFileSystemSync();
			else if (object instanceof file.FileSystem)
				return new file.FileSystemSync(object.name, object.__realPath);
			else if (object instanceof file.DirectoryEntry)
				return new file.DirectoryEntrySync(utils.file.sync(object.filesystem), object.fullPath);
			else if (object instanceof file.DirectoryReader) {
				var reader = new file.DirectoryReaderSync(utils.file.sync(object.__entry));
				reader.__start = object.__start;
				reader.__length = object.__length;
				
				return reader;
			} else if (object instanceof file.FileEntry)
				return new file.FileEntrySync(utils.file.sync(object.filesystem), object.fullPath);
			else
				return object;
		},
		
		async: function (object) {
			if (object instanceof file.LocalFileSystemSync)
				return new file.LocalFileSystem();
			else if (object instanceof file.FileSystemSync)
				return new file.FileSystem(object.name, object.__realPath);
			else if (object instanceof file.DirectoryEntrySync)
				return new file.DirectoryEntry(utils.file.async(object.filesystem), object.fullPath);
			else if (object instanceof file.DirectoryReaderSync) {
				var reader = new file.DirectoryReader(utils.file.async(object.__entry));
				reader.__start = object.__start;
				reader.__length = object.__length;
				
				return reader;
			} else if (object instanceof file.FileEntrySync)
				return new file.FileEntry(utils.file.async(object.filesystem), object.fullPath);
			else
				return object;
		}
	};

	var file = exports;
	
	file.Blob = function () {
	}

	file.Blob.prototype.size = 0;
	file.Blob.prototype.type = '';
	
	file.BlobBuilder = function () {
	}
	
	file.BlobBuilder.prototype.__text = '';
	
	file.BlobBuilder.prototype.append = function (data) {
		if (typeof data === 'string')
			this.__text += data;
	}
	
	file.BlobBuilder.prototype.getBlob = function (contentType) {
		var blob = new file.Text();
		
		blob.size = this.__text.length;
		blob.type = contentType || blob.type;
		
		blob.__text = this.__text;
		
		return blob;
	}
	
	// TODO Think about this constructor.
	file.Text = function () {
	}
	
	file.Text.prototype = new file.Blob();
	file.Text.prototype.constructor = file.Text;

	file.Text.prototype.__text = '';
	
	file.Text.prototype.slice = function (start, length, contentType) {
		if (start > this.size)
			length = 0;
		else if (start + length > this.size)
			length = this.size - start;
		
		var newText = new file.Text();
		
		newText.size = length;
		newText.type = contentType || this.type;
		
		// TODO Check the usage of start.
		newText.__text = this.text.substr(start, length);

		return newText;
	}
	
	// TODO Think about this constructor.
	file.File = function (entry) {
		file.Blob.call(this);

		var stats = utils.file.wrap(__fs.statSync)(entry.realize());

		this.name = entry.name;
		this.size = stats.size;
		// this.type = ...;
		this.lastModifiedDate = 0;
		
		this.__entry = entry;
	}

	file.File.prototype = new file.Blob();
	file.File.prototype.constructor = file.File;

	file.File.prototype.__offset = 0;

	file.File.prototype.slice = function (start, length, contentType) {
		if (start > this.size)
			length = 0;
		else if (start + length > this.size)
			length = this.size - start;
		
		var newFile = new file.File(this.__entry);
		
		newFile.size = length;
		newFile.type = contentType || this.type;
		
		// TODO Check this calculation.
		newFile.__offset = this.__offset + start;

		return newFile;
	}
	
	file.FileReader = function () {
		events.EventTarget.call(this);
		
		this.addEventListener('loadstart', function (evt) {
			utils.callback(this.onloadstart, this)(evt);
		});
		
		this.addEventListener('progress', function (evt) {
			utils.callback(this.onprogress, this)(evt);
		});
		
		this.addEventListener('error', function (evt) {
			utils.callback(this.onerror, this)(evt);
		});
		
		this.addEventListener('abort', function (evt) {
			utils.callback(this.onabort, this)(evt);
		});
		
		this.addEventListener('load', function (evt) {
			utils.callback(this.onload, this)(evt);
		});
		
		this.addEventListener('loadend', function (evt) {
			utils.callback(this.onloadend, this)(evt);
		});
	}
	
	file.FileReader.EMPTY = 0;
	file.FileReader.LOADING = 1;
	file.FileReader.DONE = 2;
	
	file.FileReader.prototype = new events.EventTarget();
	file.FileReader.prototype.constructor = file.FileReader;
	
	file.FileReader.prototype.readyState = file.FileReader.EMPTY;
	file.FileReader.prototype.result = null;
	file.FileReader.prototype.error = undefined;
	
	file.FileReader.prototype.readAsArrayBuffer = function (blob) {
	}
	
	file.FileReader.prototype.readAsBinaryString = function (blob) {
	}
	
	file.FileReader.prototype.readAsText = function (blob, encoding) {
		this.readyState = file.FileReader.EMPTY;
		this.result = null;

		utils.bind(utils.file.schedule(function () {
			if (blob instanceof file.Text) {
				this.readyState = file.FileReader.LOADING;
				
				this.dispatchEvent(new events.ProgressEvent('loadstart', false, false, true, 0, blob.size));
				
				this.result = blob.__text;
				
				this.dispatchEvent(new events.ProgressEvent('progress', false, false,
						true, this.result.length, blob.size));
				
				this.readyState = file.FileReader.DONE;
				
				this.dispatchEvent(new events.ProgressEvent('load', false, false,
						true, this.result.length, blob.size));
				this.dispatchEvent(new events.ProgressEvent('loadend', false, false,
						true, this.result.length, blob.size));
			} else if (blob instanceof file.File) {
				var stream = __fs.createReadStream(blob.__entry.realize(), {
					encoding: 'utf8',
					bufferSize: 1024,
					start: blob.__offset,
					end: blob.__offset + blob.size - 1
				});
				
				stream.on('open', utils.bind(function () {
					this.readyState = file.FileReader.LOADING;

					this.dispatchEvent(new events.ProgressEvent('loadstart', false, false, true, 0, blob.size));
				}, this));
				
				stream.on('data', utils.bind(function (data) {
					if (this.result === null)
						this.result = data;
					else
						this.result += data;
					
					this.dispatchEvent(new events.ProgressEvent('progress', false, false,
							true, this.result.length, blob.size));
				}, this));
				
				stream.on('error', utils.bind(function (error) {
					this.readyState = file.FileReader.DONE;
					this.result = null;
					
					// TODO Use error codes according to specification.
					this.error = new file.FileError(file.FileError.SECURITY_ERR);
					
					this.dispatchEvent(new events.ProgressEvent('error', false, false, false, 0, 0));
					this.dispatchEvent(new events.ProgressEvent('loadend', false, false, false, 0, 0));
				}, this));
				
				stream.on('end', utils.bind(function () {
					this.readyState = file.FileReader.DONE;
					
					this.dispatchEvent(new events.ProgressEvent('load', false, false,
							true, this.result.length, blob.size));
					this.dispatchEvent(new events.ProgressEvent('loadend', false, false,
							true, this.result.length, blob.size));
				}, this));
			}
		}), this)();
	}
	
	file.FileReader.prototype.readAsDataURL = function (blob) {
	}
	
	file.FileReader.prototype.abort = function () {
	}
	
	file.FileWriter = function (entry) {
		events.EventTarget.call(this);
		
		var stats = utils.file.wrap(__fs.statSync)(entry.realize());
		
		this.length = stats.size;
		
		this.__entry = entry;
		
		this.addEventListener('writestart', function (evt) {
			utils.callback(this.onwritestart, this)(evt);
		});
		
		this.addEventListener('progress', function (evt) {
			utils.callback(this.onprogress, this)(evt);
		});
		
		this.addEventListener('error', function (evt) {
			utils.callback(this.onerror, this)(evt);
		});
		
		this.addEventListener('abort', function (evt) {
			utils.callback(this.onabort, this)(evt);
		});
		
		this.addEventListener('write', function (evt) {
			utils.callback(this.onwrite, this)(evt);
		});
		
		this.addEventListener('writeend', function (evt) {
			utils.callback(this.onwriteend, this)(evt);
		});
	}
	
	file.FileWriter.INIT = 0;
	file.FileWriter.WRITING = 1;
	file.FileWriter.DONE = 2;
	
	file.FileWriter.prototype = new events.EventTarget();
	file.FileWriter.prototype.constructor = file.FileWriter;
	
	file.FileWriter.prototype.readyState = file.FileWriter.INIT;
	file.FileWriter.prototype.position = 0;
	file.FileWriter.prototype.length = 0;
	file.FileWriter.prototype.error = undefined;

	file.FileWriter.prototype.write = function (data) {
		if (this.readyState == file.FileWriter.WRITING)
			throw new file.FileException(file.FileException.INVALID_STATE_ERR);
		
		this.readyState = file.FileWriter.WRITING;
		
		utils.bind(utils.file.schedule(function () {
			this.dispatchEvent(new events.ProgressEvent('writestart', false, false, false, 0, 0));
			
			// TODO Use stream?
			var output = utils.file.wrap(__fs.openSync)(this.__entry.realize(), 'a');
			
			if (data instanceof file.Text) {
				// TODO Write in chunks?
				var written = utils.file.wrap(__fs.writeSync)(output, data.__text, this.position, 'utf8');
				
				this.position += written;
				this.length = Math.max(this.length, this.position);
				
				this.dispatchEvent(new events.ProgressEvent('progress', false, false, false, 0, 0));
			} if (data instanceof file.File) {
				// TODO Use file.FileReader?
				var input = utils.file.wrap(__fs.openSync)(data.__entry.realize(), 'r');
				
				var read;
				while ((read = utils.file.wrap(__fs.readSync)(input, 1024, null, 'utf8'))[1] > 0) {
					var written = utils.file.wrap(__fs.writeSync)(output, read[0], this.position, 'utf8');
					
					this.position += written;
					this.length = Math.max(this.length, this.position);
					
					this.dispatchEvent(new events.ProgressEvent('progress', false, false, false, 0, 0));
				}
				
				utils.file.wrap(__fs.closeSync)(input);
			}
			
			utils.file.wrap(__fs.closeSync)(output);
		}, function () {
			this.readyState = file.FileWriter.DONE;
			
			this.dispatchEvent(new events.ProgressEvent('write', false, false, false, 0, 0));
			this.dispatchEvent(new events.ProgressEvent('writeend', false, false, false, 0, 0));
		}, function (error) {
			this.readyState = file.FileWriter.DONE;

			// TODO Map filesystem operation error codes to File API error codes.
			this.error = new file.FileError(file.FileError.SECURITY_ERR);
			
			this.dispatchEvent(new events.ProgressEvent('error', false, false, false, 0, 0));
			this.dispatchEvent(new events.ProgressEvent('writeend', false, false, false, 0, 0));
		}), this)();
	}
	
	file.FileWriter.prototype.seek = function (offset) {
		if (this.readyState == file.FileWriter.WRITING)
			throw new file.FileException(file.FileException.INVALID_STATE_ERR);
		
		if (offset >= 0)
			this.position = Math.min(this.length, offset);
		else
			this.position = Math.max(0, this.length + offset);
	}
	
	file.FileWriter.prototype.truncate = function (size) {
		if (this.readyState == file.FileWriter.WRITING)
			throw new file.FileException(file.FileException.INVALID_STATE_ERR);
		
		this.readyState = file.FileWriter.WRITING;
		
		utils.bind(utils.file.schedule(function () {
			this.dispatchEvent(new events.ProgressEvent('writestart', false, false, false, 0, 0));

			var fd = utils.file.wrap(__fs.openSync)(this.__entry.realize(), 'r+');

			utils.file.wrap(__fs.truncateSync)(fd, size);
			utils.file.wrap(__fs.closeSync)(fd);

			this.position = Math.min(this.position, size);
			this.length = size;
		}, function () {
			this.readyState = file.FileWriter.DONE;
			
			this.dispatchEvent(new events.ProgressEvent('write', false, false, false, 0, 0));
			this.dispatchEvent(new events.ProgressEvent('writeend', false, false, false, 0, 0));
		}, function (error) {
			this.readyState = file.FileWriter.DONE;

			// TODO Map filesystem operation error codes to File API error codes.
			this.error = new file.FileError(file.FileError.SECURITY_ERR);

			this.dispatchEvent(new events.ProgressEvent('error', false, false, false, 0, 0));
			this.dispatchEvent(new events.ProgressEvent('writeend', false, false, false, 0, 0));
		}), this)();
	}
	
	file.FileWriter.prototype.abort = function () {
	}
	
	file.LocalFileSystemSync = function () {
	}

	file.LocalFileSystemSync.TEMPORARY = 0;
	file.LocalFileSystemSync.PERSISTENT = 1;

	// TODO Choose file system according to specification.
	file.LocalFileSystemSync.prototype.requestFileSystem = function (type, size) {
		return new file.FileSystemSync('default', process.cwd());
	}

	file.LocalFileSystemSync.prototype.resolveLocalFileSystemURL = function (url) {
		throw new file.FileException(file.FileException.SECURITY_ERR);
	}
	
	file.FileSystemSync = function (name, realPath) {
		this.name = name;
		this.root = new file.DirectoryEntrySync(this, '/');

		this.__realPath = realPath;
	}

	file.FileSystemSync.prototype.realize = function (fullPath) {
		return __path.join(this.__realPath, fullPath);
	}
	
	file.EntrySync = function (filesystem, fullPath) {
		this.filesystem = filesystem;

		// TODO Extract POSIX version of basename(String) from Node.js -- Path module.
		this.name = __path.basename(fullPath);
		this.fullPath = fullPath;
	}

	file.EntrySync.create = function (filesystem, fullPath) {
		var stats = utils.file.wrap(__fs.statSync)(filesystem.realize(fullPath));
		
		if (stats.isFile())
			var entry = file.FileEntrySync;
		else if (stats.isDirectory())
			var entry = file.DirectoryEntrySync;
		else
			throw new file.FileException(file.FileException.SECURITY_ERR);

		return new entry(filesystem, fullPath);
	}

	file.EntrySync.prototype.isFile = false;
	file.EntrySync.prototype.isDirectory = false;
	
	file.EntrySync.prototype.realize = function () {
		return this.filesystem.realize(this.fullPath);
	}

	// Node.js -- Path {@link https://github.com/joyent/node/blob/master/lib/path.js} module extract.
	file.EntrySync.prototype.resolve = function () {
		var resolvedPath = '';

		for (var i = arguments.length - 1; i >= -1; i--) {
			var path = (i >= 0) ? arguments[i] : this.fullPath;

			if (typeof path !== 'string' || !path)
				continue;

			resolvedPath = path + '/' + resolvedPath;

			if (path.charAt(0) == '/')
				break;
		}

		// Falling back to this.fullPath should always resolve an absolute path. Hence, remembering whether the
		// resolved path is absolute (resolvedAbsolute) becomes unnecessary.

		resolvedPath = utils.path.normalizeArray(resolvedPath.split('/').filter(function (p) {
			return !!p;
		}), false).join('/');

		return '/' + resolvedPath;
	}

	// Node.js -- Path {@link https://github.com/joyent/node/blob/master/lib/path.js} module extract.
	file.EntrySync.prototype.relative = function (to) {
		var fromParts = this.fullPath.split('/');
		var toParts = this.resolve(to).split('/');

		// Both, this.fullPath and this.resolve(to) should always be absolute and normalized. Hence, trimming, i.e.,
		// removing empty parts, becomes unnecessary.

		var length = Math.min(fromParts.length, toParts.length);
		var samePartsLength = length;

		for (var i = 0; i < length; i++)
			if (fromParts[i] != toParts[i]) {
				samePartsLength = i;

				break;
			}

		var outputParts = [];

		for (var i = samePartsLength; i < fromParts.length; i++)
			outputParts.push('..');

		outputParts = outputParts.concat(toParts.slice(samePartsLength));

		return outputParts.join('/');
	}

	file.EntrySync.prototype.copyTo = function (parent, newName) {
		newName = newName || this.name;
		
		if (utils.path.equals(parent.fullPath, this.getParent().fullPath) && newName == this.name)
			throw new file.FileException(file.FileException.INVALID_MODIFICATION_ERR);
		
		var newFullPath = utils.path.join(parent.fullPath, newName);
		
		if (this.isFile) {
			var newEntry = parent.getFile(newName, {
				create: true,
				exclusive: true
			});
			
			// TODO Use file.FileReaderSync and file.FileWriterSync?
			var data = utils.file.wrap(__fs.readFileSync)(this.realize());
			
			utils.file.wrap(__fs.writeFileSync)(parent.filesystem.realize(newFullPath), data);
		} else if (this.isDirectory) {
			if (parent.isSubdirectoryOf(this))
				throw new file.FileException(file.FileException.INVALID_MODIFICATION_ERR);
			
			var newEntry = parent.getDirectory(newName, {
				create: true,
				exclusive: true
			});
			
			var reader = this.createReader();
			var children = [];
			
			while ((children = reader.readEntries()).length > 0)
				children.forEach(function (child) {
					child.copyTo(newEntry, child.name);
				});
		}
		
		return newEntry;
	}
	
	file.EntrySync.prototype.getMetadata = function () {
		var stats = utils.file.wrap(__fs.statSync)(this.realize());
		
		return {
			modificationTime: stats.mtime
		};
	}

	file.EntrySync.prototype.getParent = function () {
		if (utils.path.equals(this.fullPath, this.filesystem.root.fullPath))
			return this;
		
		// TODO Extract POSIX version of dirname(String) from Node.js -- Path module.
		return new file.DirectoryEntrySync(this.filesystem, __path.dirname(this.fullPath));
	}

	file.EntrySync.prototype.moveTo = function (parent, newName) {
		newName = newName || this.name;
		
		if (utils.path.equals(parent.fullPath, this.getParent().fullPath) && newName == this.name)
			throw new file.FileException(file.FileException.INVALID_MODIFICATION_ERR);
		
		var newFullPath = utils.path.join(parent.fullPath, newName);
		
		utils.file.wrap(__fs.renameSync)(this.realize(), parent.filesystem.realize(newFullPath));

		return file.EntrySync.create(parent.filesystem, newFullPath);
	}

	file.EntrySync.prototype.remove = function () {
		if (utils.path.equals(this.fullPath, this.filesystem.root.fullPath))
			throw new file.FileException(file.FileException.SECURITY_ERR);
		
		if (this.isFile)
			var remove = __fs.unlinkSync;
		else if (this.isDirectory)
			var remove = __fs.rmdirSync;
		
		utils.file.wrap(remove)(this.realize());
	}

	// TODO Choose filesystem url scheme, e.g.,
	//     <filesystem:http://example.domain/persistent-or-temporary/path/to/file.html>.
	file.EntrySync.prototype.toURL = function (mimeType) {
	}

	file.DirectoryEntrySync = function (filesystem, fullPath) {
		file.EntrySync.call(this, filesystem, fullPath);
	}

	file.DirectoryEntrySync.prototype = new file.EntrySync();
	file.DirectoryEntrySync.prototype.constructor = file.DirectoryEntrySync;

	file.DirectoryEntrySync.prototype.isDirectory = true;

	file.DirectoryEntrySync.prototype.createReader = function () {
		return new file.DirectoryReaderSync(this);
	}

	// TODO Use path instead of file.DirectoryEntrySync?
	file.DirectoryEntrySync.prototype.isSubdirectoryOf = function (parent) {
		var childParts = this.fullPath.split('/');
		var parentParts = parent.fullPath.split('/');

		if (childParts.length <= parentParts.length)
			return false;

		for (var i = 0; i < parentParts.length; i++)
			if (childParts[i] != parentParts[i])
				return false;

		return true;
	}

	file.DirectoryEntrySync.prototype.getDirectory = function (path, options) {
		var fullPath = this.resolve(path);
		
		if (__path.existsSync(this.filesystem.realize(fullPath))) {
			if (options && options.create && options.exclusive)
				throw new file.FileException(file.FileException.PATH_EXISTS_ERR);
			
			var entry = file.EntrySync.create(this.filesystem, fullPath);
			
			if (!entry.isDirectory)
				throw new file.FileException(file.FileException.TYPE_MISMATCH_ERR);
		} else {
			if (!options || !options.create)
				throw new file.FileException(file.FileException.NOT_FOUND_ERR);
			
			// TODO Use fullPath's parent instead of "this".
			var stats = utils.file.wrap(__fs.statSync)(this.realize());
			
			utils.file.wrap(__fs.mkdirSync)(this.filesystem.realize(fullPath), stats.mode);

			var entry = new file.DirectoryEntrySync(this.filesystem, fullPath)
		}
		
		return entry;
	}

	file.DirectoryEntrySync.prototype.getFile = function (path, options) {
		var fullPath = this.resolve(path);
		
		if (__path.existsSync(this.filesystem.realize(fullPath))) {
			if (options && options.create && options.exclusive)
				throw new file.FileException(file.FileException.PATH_EXISTS_ERR);
			
			var entry = file.EntrySync.create(this.filesystem, fullPath);
			
			if (!entry.isFile)
				throw new file.FileException(file.FileException.TYPE_MISMATCH_ERR);
		} else {
			if (!options || !options.create)
				throw new file.FileException(file.FileException.NOT_FOUND_ERR);
			
			var fd = utils.file.wrap(__fs.openSync)(this.filesystem.realize(fullPath), 'w');
			
			utils.file.wrap(__fs.closeSync)(fd);
			
			var entry = new file.FileEntrySync(this.filesystem, fullPath)
		}
		
		return entry;
	}

	file.DirectoryEntrySync.prototype.removeRecursively = function () {
		var reader = this.createReader();
		var children = [];
		
		while ((children = reader.readEntries()).length > 0)
			children.forEach(function (child) {
				if (child.isFile)
					child.remove();
				else if (child.isDirectory)
					child.removeRecursively();
			});
		
		this.remove();
	}

	file.DirectoryReaderSync = function (entry) {
		this.__entry = entry;
	}

	file.DirectoryReaderSync.prototype.__start = 0;
	file.DirectoryReaderSync.prototype.__length = 10;
	file.DirectoryReaderSync.prototype.__children = undefined;
	
	file.DirectoryReaderSync.prototype.readEntries = function () {
		if (typeof this.__children === 'undefined')
			this.__children = utils.file.wrap(__fs.readdirSync)(this.__entry.realize());

		var entries = [];
		
		for (var i = this.__start; i < Math.min(this.__start + this.__length, this.__children.length); i++)
			entries.push(file.EntrySync.create(this.__entry.filesystem,
					utils.path.join(this.__entry.fullPath, this.__children[i])));
		
		this.__start += entries.length;
		
		return entries;
	}

	file.FileEntrySync = function (filesystem, fullPath) {
		file.EntrySync.call(this, filesystem, fullPath);
	}

	file.FileEntrySync.prototype = new file.EntrySync();
	file.FileEntrySync.prototype.constructor = file.FileEntrySync;

	file.FileEntrySync.prototype.isFile = true;

	file.FileEntrySync.prototype.createWriter = function () {
		return new file.FileWriterSync(this);
	}

	file.FileEntrySync.prototype.file = function () {
		return new file.File(this);
	}

	file.LocalFileSystem = function () {
	}

	file.LocalFileSystem.TEMPORARY = 0;
	file.LocalFileSystem.PERSISTENT = 1;

	file.LocalFileSystem.prototype.requestFileSystem = function (type, size, successCallback, errorCallback) {
		utils.bind(utils.file.schedule(
				utils.bind(file.LocalFileSystemSync.prototype.requestFileSystem, utils.file.sync(this)),
				function (filesystem) {
					utils.callback(successCallback, this)(utils.file.async(filesystem));
				}, errorCallback), this)(type, size);
	}

	file.LocalFileSystem.prototype.resolveLocalFileSystemURL = function (url, successCallback, errorCallback) {
		utils.bind(utils.file.schedule(
				utils.bind(file.LocalFileSystemSync.prototype.resolveLocalFileSystemURL, utils.file.sync(this)),
				function (entry) {
					utils.callback(successCallback, this)(utils.file.async(entry));
				}, errorCallback), this)(url);
	}

	file.FileSystem = function (name, realPath) {
		this.name = name;
		this.root = new file.DirectoryEntry(this, '/');

		this.__realPath = realPath;
	}

	file.FileSystem.prototype.realize = function (fullPath) {
		return file.FileSystemSync.prototype.realize.call(utils.file.sync(this), fullPath);
	}

	file.Entry = function (filesystem, fullPath) {
		this.filesystem = filesystem;

		// TODO Extract POSIX version of basename(String) from Node.js -- Path module.
		this.name = __path.basename(fullPath);
		this.fullPath = fullPath;
	}

	file.Entry.create = function (filesystem, fullPath, successCallback, errorCallback) {
		utils.file.schedule(file.EntrySync.create, function (entry) {
			successCallback(utils.file.async(entry));
		}, errorCallback)(utils.file.sync(filesystem), fullPath);
	}

	file.Entry.prototype.isFile = false;
	file.Entry.prototype.isDirectory = false;

	file.Entry.prototype.realize = function () {
		return file.EntrySync.prototype.realize.call(utils.file.sync(this));
	}
	
	file.Entry.prototype.resolve = function () {
		return file.EntrySync.prototype.resolve.apply(utils.file.sync(this), arguments);
	}

	file.Entry.prototype.relative = function (to) {
		return file.EntrySync.prototype.relative.call(utils.file.sync(this), to);
	}

	file.Entry.prototype.copyTo = function (parent, newName, successCallback, errorCallback) {
		utils.bind(utils.file.schedule(utils.bind(file.EntrySync.prototype.copyTo, utils.file.sync(this)),
				function (entry) {
					utils.callback(successCallback, this)(utils.file.async(entry));
				}, errorCallback), this)(utils.file.sync(parent), newName);
	}

	file.Entry.prototype.getMetadata = function (successCallback, errorCallback) {
		utils.bind(utils.file.schedule(utils.bind(file.EntrySync.prototype.getMetadata, utils.file.sync(this)),
				successCallback, errorCallback), this)();
	}

	file.Entry.prototype.getParent = function (successCallback, errorCallback) {
		utils.bind(utils.file.schedule(utils.bind(file.EntrySync.prototype.getParent, utils.file.sync(this)),
				function (entry) {
					utils.callback(successCallback, this)(utils.file.async(entry));
				}, errorCallback), this)();
	}

	file.Entry.prototype.moveTo = function (parent, newName, successCallback, errorCallback) {
		utils.bind(utils.file.schedule(utils.bind(file.EntrySync.prototype.moveTo, utils.file.sync(this)),
				function (entry) {
					utils.callback(successCallback, this)(utils.file.async(entry));
				}, errorCallback), this)(utils.file.sync(parent), newName);
	}

	file.Entry.prototype.remove = function (successCallback, errorCallback) {
		utils.bind(utils.file.schedule(utils.bind(file.EntrySync.prototype.remove, utils.file.sync(this)),
				successCallback, errorCallback), this)();
	}

	file.Entry.prototype.toURL = function (mimeType) {
		return file.EntrySync.prototype.toURL.call(utils.file.sync(this), mimeType);
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

	file.DirectoryEntry.prototype.isSubdirectoryOf = function (entry) {
		return file.DirectoryEntrySync.prototype.isSubdirectoryOf.call(utils.file.sync(this), utils.file.sync(entry));
	}

	file.DirectoryEntry.prototype.getDirectory = function (path, options, successCallback, errorCallback) {
		utils.bind(utils.file.schedule(
				utils.bind(file.DirectoryEntrySync.prototype.getDirectory, utils.file.sync(this)),
				function (entry) {
					utils.callback(successCallback, this)(utils.file.async(entry));
				}, errorCallback), this)(path, options);
	}

	file.DirectoryEntry.prototype.getFile = function (path, options, successCallback, errorCallback) {
		utils.bind(utils.file.schedule(
				utils.bind(file.DirectoryEntrySync.prototype.getFile, utils.file.sync(this)),
				function (entry) {
					utils.callback(successCallback, this)(utils.file.async(entry));
				}, errorCallback), this)(path, options);
	}

	file.DirectoryEntry.prototype.removeRecursively = function (successCallback, errorCallback) {
		utils.bind(utils.file.schedule(
				utils.bind(file.DirectoryEntrySync.prototype.removeRecursively, utils.file.sync(this)),
				successCallback, errorCallback), this)();
	}

	file.DirectoryReader = function (entry) {
		this.__entry = entry;
	}

	file.DirectoryReader.prototype.__start = 0;
	file.DirectoryReader.prototype.__length = 10;

	file.DirectoryReader.prototype.readEntries = function (successCallback, errorCallback) {
		var sync = utils.file.sync(this);

		utils.bind(utils.file.schedule(utils.bind(file.DirectoryReaderSync.prototype.readEntries, sync),
				function (entries) {
					this.__start = sync.__start;
					this.__length = sync.__length; 
		
					utils.callback(successCallback, this)(entries.map(utils.file.async));
				}, errorCallback), this)();
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

	file.FileException = function (code) {
		this.code = code;
	}
	
	file.FileException.NOT_FOUND_ERR = 1;
	file.FileException.SECURITY_ERR = 2;
	file.FileException.ABORT_ERR = 3;
	file.FileException.NOT_READABLE_ERR = 4;
	file.FileException.ENCODING_ERR = 5;
	file.FileException.NO_MODIFICATION_ALLOWED_ERR = 6;
	file.FileException.INVALID_STATE_ERR = 7;
	file.FileException.SYNTAX_ERR = 8;
	file.FileException.INVALID_MODIFICATION_ERR = 9;
	file.FileException.QUOTA_EXCEEDED_ERR = 10;
	file.FileException.TYPE_MISMATCH_ERR = 11;
	file.FileException.PATH_EXISTS_ERR = 12;
})(module.exports);