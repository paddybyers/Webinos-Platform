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
 * TODO Invalidate entries, e.g., after being (re)moved.
 * TODO Handle multiple read calls to <pre>exports.FileReader</pre> (see File API, W3C Working Draft, 20 October 2011).
 * TODO Use error/exception codes according to specification, e.g., at <pre>exports.utils.wrap</pre>.
 * TODO Respect encoding parameters, e.g., at <pre>exports.Blob.prototype.type</pre>.
 */
(function (exports) {
	"use strict";
	
	var __fs = require('fs');
	var __path = require('path');

	var events = require('./webinos.events.js');
	var path = require('./webinos.path.js');
	var utils = require('./webinos.utils.js');

	// TODO Extract utilities to <pre>webinos.file.utils.js</pre>?
	exports.utils = {};
	
	exports.utils.wrap = function (fun, map) {
		return function () {
			try {
				return fun.apply(this, arguments);
			} catch (exception) {
				if (typeof map === 'object' && typeof map[exception.code] !== 'undefined')
					var code = map[exception.code];
				else
					var code = exports.FileException.SECURITY_ERR;

				throw new exports.FileException(code);
			}
		};
	}
		
	exports.utils.schedule = function (fun, successCallback, errorCallback) {
		return function () {
			var argsArray = arguments;
			
			process.nextTick(utils.bind(function () {
				try {
					utils.callback(successCallback, this)(fun.apply(this, argsArray));
				} catch (exception) {
					if (exception instanceof exports.FileException)
						var code = exception.code;
					else
						var code = exports.FileError.SECURITY_ERR;
					
					utils.callback(errorCallback, this)(new exports.FileError(code));
				}
			}, this));
		}
	}

	exports.utils.sync = function (object) {
		if (object instanceof exports.LocalFileSystem)
			return new exports.LocalFileSystemSync();
		else if (object instanceof exports.FileSystem)
			return new exports.FileSystemSync(object.name, object.__realPath);
		else if (object instanceof exports.DirectoryEntry)
			return new exports.DirectoryEntrySync(exports.utils.sync(object.filesystem), object.fullPath);
		else if (object instanceof exports.DirectoryReader) {
			var reader = new exports.DirectoryReaderSync(exports.utils.sync(object.__entry));
			reader.__start = object.__start;
			reader.__length = object.__length;
			
			return reader;
		} else if (object instanceof exports.FileEntry)
			return new exports.FileEntrySync(exports.utils.sync(object.filesystem), object.fullPath);
		else
			return object;
	}
	
	exports.utils.async = function (object) {
		if (object instanceof exports.LocalFileSystemSync)
			return new exports.LocalFileSystem();
		else if (object instanceof exports.FileSystemSync)
			return new exports.FileSystem(object.name, object.__realPath);
		else if (object instanceof exports.DirectoryEntrySync)
			return new exports.DirectoryEntry(exports.utils.async(object.filesystem), object.fullPath);
		else if (object instanceof exports.DirectoryReaderSync) {
			var reader = new exports.DirectoryReader(exports.utils.async(object.__entry));
			reader.__start = object.__start;
			reader.__length = object.__length;
			
			return reader;
		} else if (object instanceof exports.FileEntrySync)
			return new exports.FileEntry(exports.utils.async(object.filesystem), object.fullPath);
		else
			return object;
	}

	exports.Blob = function () {
	}

	exports.Blob.prototype.size = 0;
	exports.Blob.prototype.type = '';
	
	exports.BlobBuilder = function () {
	}
	
	exports.BlobBuilder.prototype.__text = '';
	
	// TODO Add support for Blob and ArrayBuffer(?).
	exports.BlobBuilder.prototype.append = function (data) {
		if (typeof data === 'string')
			this.__text += data;
	}
	
	exports.BlobBuilder.prototype.getBlob = function (contentType) {
		return new exports.Text(this.__text, contentType);
	}
	
	exports.Text = function (text, type) {
		exports.Blob.call(this);
		
		this.size = text ? text.length : 0;
		this.type = type || this.type;
		
		this.__text = text || '';
	}
	
	exports.Text.prototype = new exports.Blob();
	exports.Text.prototype.constructor = exports.Text;
	
	exports.Text.prototype.slice = function (start, length, contentType) {
		if (start > this.size)
			length = 0;
		else if (start + length > this.size)
			length = this.size - start;
		
		return new exports.Text(length > 0 ? this.__text.substr(start, length) : '', contentType || this.type);
	}

	exports.File = function (entry, type, start, length) {
		exports.Blob.call(this);

		var stats = exports.utils.wrap(__fs.statSync)(entry.realize());

		this.name = entry.name;
		this.size = length || start ? Math.max(0, stats.size - start) : stats.size;
		this.type = type || this.type;
		this.lastModifiedDate = stats.mtime.getTime();
		
		this.__entry = entry;
		this.__start = start ? Math.min(stats.size, start) : 0;
	}

	exports.File.prototype = new exports.Blob();
	exports.File.prototype.constructor = exports.File;

	exports.File.prototype.slice = function (start, length, contentType) {
		if (start > this.size)
			length = 0;
		else if (start + length > this.size)
			length = this.size - start;
		
		return new exports.File(this.__entry, contentType || this.type, length > 0 ? this.__start + start : 0, length);
	}
	
	exports.FileReader = function () {
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
	
	exports.FileReader.EMPTY = 0;
	exports.FileReader.LOADING = 1;
	exports.FileReader.DONE = 2;
	
	exports.FileReader.prototype = new events.EventTarget();
	exports.FileReader.prototype.constructor = exports.FileReader;
	
	exports.FileReader.prototype.readyState = exports.FileReader.EMPTY;
	exports.FileReader.prototype.result = null;
	exports.FileReader.prototype.error = undefined;
	
	exports.FileReader.prototype.readAsArrayBuffer = function (blob) {
		throw new exports.FileException(exports.FileException.SECURITY_ERR);
	}
	
	exports.FileReader.prototype.readAsBinaryString = function (blob) {
		throw new exports.FileException(exports.FileException.SECURITY_ERR);
	}
	
	exports.FileReader.prototype.readAsText = function (blob, encoding) {
		this.readyState = exports.FileReader.EMPTY;
		this.result = null;

		utils.bind(exports.utils.schedule(function () {
			if (blob instanceof exports.Text) {
				this.readyState = exports.FileReader.LOADING;
				
				this.dispatchEvent(new events.ProgressEvent('loadstart', false, false, true, 0, blob.size));
				
				this.result = blob.__text;
				
				this.dispatchEvent(new events.ProgressEvent('progress', false, false,
						true, this.result.length, blob.size));
				
				this.readyState = exports.FileReader.DONE;
				
				this.dispatchEvent(new events.ProgressEvent('load', false, false,
						true, this.result.length, blob.size));
				this.dispatchEvent(new events.ProgressEvent('loadend', false, false,
						true, this.result.length, blob.size));
			} else if (blob instanceof exports.File) {
				var stream = __fs.createReadStream(blob.__entry.realize(), {
					encoding: 'utf8',
					bufferSize: 1024,
					start: blob.__start,
					end: blob.__start + Math.max(0, blob.size - 1)
				});
				
				stream.on('open', utils.bind(function () {
					this.readyState = exports.FileReader.LOADING;
					this.result = '';

					this.dispatchEvent(new events.ProgressEvent('loadstart', false, false, true, 0, blob.size));
				}, this));
				
				stream.on('data', utils.bind(function (data) {
					this.result += data;
					
					this.dispatchEvent(new events.ProgressEvent('progress', false, false,
							true, this.result.length, blob.size));
				}, this));
				
				stream.on('error', utils.bind(function (error) {
					this.readyState = exports.FileReader.DONE;
					this.result = null;
					
					// TODO Use error codes according to specification.
					this.error = new exports.FileError(exports.FileError.SECURITY_ERR);
					
					this.dispatchEvent(new events.ProgressEvent('error', false, false, false, 0, 0));
					this.dispatchEvent(new events.ProgressEvent('loadend', false, false, false, 0, 0));
				}, this));
				
				stream.on('end', utils.bind(function () {
					this.readyState = exports.FileReader.DONE;
					
					this.dispatchEvent(new events.ProgressEvent('load', false, false,
							true, this.result.length, blob.size));
					this.dispatchEvent(new events.ProgressEvent('loadend', false, false,
							true, this.result.length, blob.size));
				}, this));
			}
		}), this)();
	}
	
	exports.FileReader.prototype.readAsDataURL = function (blob) {
		throw new exports.FileException(exports.FileException.SECURITY_ERR);
	}
	
	exports.FileReader.prototype.abort = function () {
		throw new exports.FileException(exports.FileException.SECURITY_ERR);
	}
	
	exports.FileWriter = function (entry) {
		events.EventTarget.call(this);
		
		var stats = exports.utils.wrap(__fs.statSync)(entry.realize());
		
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
	
	exports.FileWriter.INIT = 0;
	exports.FileWriter.WRITING = 1;
	exports.FileWriter.DONE = 2;
	
	exports.FileWriter.prototype = new events.EventTarget();
	exports.FileWriter.prototype.constructor = exports.FileWriter;
	
	exports.FileWriter.prototype.readyState = exports.FileWriter.INIT;
	exports.FileWriter.prototype.position = 0;
	exports.FileWriter.prototype.length = 0;
	exports.FileWriter.prototype.error = undefined;

	exports.FileWriter.prototype.write = function (data) {
		if (this.readyState == exports.FileWriter.WRITING)
			throw new exports.FileException(exports.FileException.INVALID_STATE_ERR);
		
		this.readyState = exports.FileWriter.WRITING;
		
		utils.bind(exports.utils.schedule(function () {
			this.dispatchEvent(new events.ProgressEvent('writestart', false, false, false, 0, 0));
			
			// TODO Use a writable stream, i.e., <pre>fs.WriteStream</pre>?
			var output = exports.utils.wrap(__fs.openSync)(this.__entry.realize(), 'a');
			
			if (data instanceof exports.Text) {
				// TODO Write in chunks?
				var written = exports.utils.wrap(__fs.writeSync)(output, data.__text, this.position, 'utf8');
				
				this.position += written;
				this.length = Math.max(this.length, this.position);
				
				this.dispatchEvent(new events.ProgressEvent('progress', false, false, false, 0, 0));
			} else if (data instanceof exports.File) {
				// TODO Use <pre>exports.FileReader</pre>?
				var input = exports.utils.wrap(__fs.openSync)(data.__entry.realize(), 'r');
				
				var read;
				while ((read = exports.utils.wrap(__fs.readSync)(input, 1024, null, 'utf8'))[1] > 0) {
					var written = exports.utils.wrap(__fs.writeSync)(output, read[0], this.position, 'utf8');
					
					this.position += written;
					this.length = Math.max(this.length, this.position);
					
					this.dispatchEvent(new events.ProgressEvent('progress', false, false, false, 0, 0));
				}
				
				exports.utils.wrap(__fs.closeSync)(input);
			}
			
			exports.utils.wrap(__fs.closeSync)(output);
		}, function () {
			this.readyState = exports.FileWriter.DONE;
			
			this.dispatchEvent(new events.ProgressEvent('write', false, false, false, 0, 0));
			this.dispatchEvent(new events.ProgressEvent('writeend', false, false, false, 0, 0));
		}, function (error) {
			this.readyState = exports.FileWriter.DONE;

			// TODO Use error codes according to specification.
			this.error = new exports.FileError(exports.FileError.SECURITY_ERR);
			
			this.dispatchEvent(new events.ProgressEvent('error', false, false, false, 0, 0));
			this.dispatchEvent(new events.ProgressEvent('writeend', false, false, false, 0, 0));
		}), this)();
	}
	
	exports.FileWriter.prototype.seek = function (offset) {
		if (this.readyState == exports.FileWriter.WRITING)
			throw new exports.FileException(exports.FileException.INVALID_STATE_ERR);
		
		if (offset >= 0)
			this.position = Math.min(this.length, offset);
		else
			this.position = Math.max(0, this.length + offset);
	}
	
	exports.FileWriter.prototype.truncate = function (size) {
		if (this.readyState == exports.FileWriter.WRITING)
			throw new exports.FileException(exports.FileException.INVALID_STATE_ERR);
		
		this.readyState = exports.FileWriter.WRITING;
		
		utils.bind(exports.utils.schedule(function () {
			this.dispatchEvent(new events.ProgressEvent('writestart', false, false, false, 0, 0));

			var fd = exports.utils.wrap(__fs.openSync)(this.__entry.realize(), 'r+');

			exports.utils.wrap(__fs.truncateSync)(fd, size);
			exports.utils.wrap(__fs.closeSync)(fd);

			this.position = Math.min(this.position, size);
			this.length = size;
		}, function () {
			this.readyState = exports.FileWriter.DONE;
			
			this.dispatchEvent(new events.ProgressEvent('write', false, false, false, 0, 0));
			this.dispatchEvent(new events.ProgressEvent('writeend', false, false, false, 0, 0));
		}, function (error) {
			this.readyState = exports.FileWriter.DONE;

			// TODO Use error codes according to specification.
			this.error = new exports.FileError(exports.FileError.SECURITY_ERR);

			this.dispatchEvent(new events.ProgressEvent('error', false, false, false, 0, 0));
			this.dispatchEvent(new events.ProgressEvent('writeend', false, false, false, 0, 0));
		}), this)();
	}
	
	exports.FileWriter.prototype.abort = function () {
		throw new exports.FileException(exports.FileException.SECURITY_ERR);
	}
	
	exports.LocalFileSystemSync = function () {
	}

	exports.LocalFileSystemSync.TEMPORARY = 0;
	exports.LocalFileSystemSync.PERSISTENT = 1;

	// TODO Choose filesystem according to specification.
	exports.LocalFileSystemSync.prototype.requestFileSystem = function (type, size) {
		return new exports.FileSystemSync('default', __path.join(process.cwd(), 'default'));
	}

	exports.LocalFileSystemSync.prototype.resolveLocalFileSystemURL = function (url) {
		throw new exports.FileException(exports.FileException.SECURITY_ERR);
	}
	
	exports.FileSystemSync = function (name, realPath) {
		this.name = name;
		this.root = new exports.DirectoryEntrySync(this, '/');

		this.__realPath = realPath;
	}

	exports.FileSystemSync.prototype.realize = function (fullPath) {
		return __path.join(this.__realPath, fullPath);
	}
	
	exports.EntrySync = function (filesystem, fullPath) {
		this.filesystem = filesystem;

		this.name = path.basename(fullPath);
		this.fullPath = fullPath;
	}

	exports.EntrySync.create = function (filesystem, fullPath) {
		var stats = exports.utils.wrap(__fs.statSync)(filesystem.realize(fullPath));
		
		if (stats.isDirectory())
			var entry = exports.DirectoryEntrySync;
		else if (stats.isFile())
			var entry = exports.FileEntrySync;
		else
			throw new exports.FileException(exports.FileException.SECURITY_ERR);

		return new entry(filesystem, fullPath);
	}

	exports.EntrySync.prototype.isFile = false;
	exports.EntrySync.prototype.isDirectory = false;
	
	exports.EntrySync.prototype.realize = function () {
		return this.filesystem.realize(this.fullPath);
	}

	exports.EntrySync.prototype.resolve = function () {
		var argsArray = Array.prototype.slice.call(arguments);
		
		argsArray.unshift(this.fullPath);
		
		return path.resolve.apply(path, argsArray);
	}

	exports.EntrySync.prototype.relative = function (to) {
		return path.relative(this.fullPath, this.resolve(to));
	}

	exports.EntrySync.prototype.copyTo = function (parent, newName) {
		newName = newName || this.name;
		
		if (path.equals(parent.fullPath, this.getParent().fullPath) && newName == this.name)
			throw new exports.FileException(exports.FileException.INVALID_MODIFICATION_ERR);
		
		var newFullPath = path.join(parent.fullPath, newName);
		
		if (this.isDirectory) {
			if (this.isPrefixOf(parent.fullPath))
				throw new exports.FileException(exports.FileException.INVALID_MODIFICATION_ERR);
			
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
		} else if (this.isFile) {
			var newEntry = parent.getFile(newName, {
				create: true,
				exclusive: true
			});
			
			// TODO Use <pre>exports.FileReaderSync</pre>?
			var data = exports.utils.wrap(__fs.readFileSync)(this.realize());
			
			// TODO Use <pre>exports.FileWriterSync</pre>?
			exports.utils.wrap(__fs.writeFileSync)(parent.filesystem.realize(newFullPath), data);
		}
		
		return newEntry;
	}
	
	exports.EntrySync.prototype.getMetadata = function () {
		var stats = exports.utils.wrap(__fs.statSync)(this.realize());
		
		return {
			modificationTime: stats.mtime
		};
	}

	exports.EntrySync.prototype.getParent = function () {
		if (path.equals(this.fullPath, this.filesystem.root.fullPath))
			return this;
		
		return new exports.DirectoryEntrySync(this.filesystem, path.dirname(this.fullPath));
	}

	exports.EntrySync.prototype.moveTo = function (parent, newName) {
		newName = newName || this.name;
		
		if (path.equals(parent.fullPath, this.getParent().fullPath) && newName == this.name)
			throw new exports.FileException(exports.FileException.INVALID_MODIFICATION_ERR);
		
		// TODO Is this realy necessary? (I don't like it.)
		if (this.isDirectory && this.isPrefixOf(parent.fullPath))
			throw new exports.FileException(exports.FileException.INVALID_MODIFICATION_ERR);
		
		var newFullPath = path.join(parent.fullPath, newName);
		
		exports.utils.wrap(__fs.renameSync)(this.realize(), parent.filesystem.realize(newFullPath));

		return exports.EntrySync.create(parent.filesystem, newFullPath);
	}

	exports.EntrySync.prototype.remove = function () {
		if (path.equals(this.fullPath, this.filesystem.root.fullPath))
			throw new exports.FileException(exports.FileException.SECURITY_ERR);
		
		if (this.isDirectory)
			var remove = __fs.rmdirSync;
		else if (this.isFile)
			var remove = __fs.unlinkSync;
		
		exports.utils.wrap(remove)(this.realize());
	}

	// TODO Choose filesystem url scheme, e.g.,
	//     <filesystem:http://example.domain/persistent-or-temporary/path/to/exports.html>.
	exports.EntrySync.prototype.toURL = function (mimeType) {
		throw new exports.FileException(exports.FileException.SECURITY_ERR);
	}

	exports.DirectoryEntrySync = function (filesystem, fullPath) {
		exports.EntrySync.call(this, filesystem, fullPath);
	}

	exports.DirectoryEntrySync.prototype = new exports.EntrySync();
	exports.DirectoryEntrySync.prototype.constructor = exports.DirectoryEntrySync;

	exports.DirectoryEntrySync.prototype.isDirectory = true;

	exports.DirectoryEntrySync.prototype.createReader = function () {
		return new exports.DirectoryReaderSync(this);
	}

	exports.DirectoryEntrySync.prototype.isPrefixOf = function (_path) {
		return path.isPrefixOf(this.fullPath, _path);
	}

	exports.DirectoryEntrySync.prototype.getDirectory = function (path, options) {
		var fullPath = this.resolve(path);
		
		if (__path.existsSync(this.filesystem.realize(fullPath))) {
			if (options && options.create && options.exclusive)
				throw new exports.FileException(exports.FileException.PATH_EXISTS_ERR);
			
			var entry = exports.EntrySync.create(this.filesystem, fullPath);
			
			if (!entry.isDirectory)
				throw new exports.FileException(exports.FileException.TYPE_MISMATCH_ERR);
		} else {
			if (!options || !options.create)
				throw new exports.FileException(exports.FileException.NOT_FOUND_ERR);
			
			// TODO Use fullPath's parent instead of "this".
			var stats = exports.utils.wrap(__fs.statSync)(this.realize());
			
			exports.utils.wrap(__fs.mkdirSync)(this.filesystem.realize(fullPath), stats.mode);

			var entry = new exports.DirectoryEntrySync(this.filesystem, fullPath)
		}
		
		return entry;
	}

	exports.DirectoryEntrySync.prototype.getFile = function (path, options) {
		var fullPath = this.resolve(path);
		
		if (__path.existsSync(this.filesystem.realize(fullPath))) {
			if (options && options.create && options.exclusive)
				throw new exports.FileException(exports.FileException.PATH_EXISTS_ERR);
			
			var entry = exports.EntrySync.create(this.filesystem, fullPath);
			
			if (!entry.isFile)
				throw new exports.FileException(exports.FileException.TYPE_MISMATCH_ERR);
		} else {
			if (!options || !options.create)
				throw new exports.FileException(exports.FileException.NOT_FOUND_ERR);
			
			var fd = exports.utils.wrap(__fs.openSync)(this.filesystem.realize(fullPath), 'w');
			
			exports.utils.wrap(__fs.closeSync)(fd);
			
			var entry = new exports.FileEntrySync(this.filesystem, fullPath)
		}
		
		return entry;
	}

	exports.DirectoryEntrySync.prototype.removeRecursively = function () {
		var reader = this.createReader();
		var children = [];
		
		while ((children = reader.readEntries()).length > 0)
			children.forEach(function (child) {
				if (child.isDirectory)
					child.removeRecursively();
				else if (child.isFile)
					child.remove();
			});
		
		this.remove();
	}

	exports.DirectoryReaderSync = function (entry) {
		this.__entry = entry;
	}

	exports.DirectoryReaderSync.prototype.__start = 0;
	exports.DirectoryReaderSync.prototype.__length = 10;
	exports.DirectoryReaderSync.prototype.__children = undefined;
	
	exports.DirectoryReaderSync.prototype.readEntries = function () {
		if (typeof this.__children === 'undefined')
			this.__children = exports.utils.wrap(__fs.readdirSync)(this.__entry.realize());

		var entries = [];
		
		for (var i = this.__start; i < Math.min(this.__start + this.__length, this.__children.length); i++)
			entries.push(exports.EntrySync.create(this.__entry.filesystem,
					path.join(this.__entry.fullPath, this.__children[i])));
		
		this.__start += entries.length;
		
		return entries;
	}

	exports.FileEntrySync = function (filesystem, fullPath) {
		exports.EntrySync.call(this, filesystem, fullPath);
	}

	exports.FileEntrySync.prototype = new exports.EntrySync();
	exports.FileEntrySync.prototype.constructor = exports.FileEntrySync;

	exports.FileEntrySync.prototype.isFile = true;

	exports.FileEntrySync.prototype.createWriter = function () {
		return new exports.FileWriterSync(this);
	}

	exports.FileEntrySync.prototype.file = function () {
		return new exports.File(this);
	}

	exports.LocalFileSystem = function () {
	}

	exports.LocalFileSystem.TEMPORARY = 0;
	exports.LocalFileSystem.PERSISTENT = 1;

	exports.LocalFileSystem.prototype.requestFileSystem = function (type, size, successCallback, errorCallback) {
		utils.bind(exports.utils.schedule(
				utils.bind(exports.LocalFileSystemSync.prototype.requestFileSystem, exports.utils.sync(this)),
				function (filesystem) {
					utils.callback(successCallback, this)(exports.utils.async(filesystem));
				}, errorCallback), this)(type, size);
	}

	exports.LocalFileSystem.prototype.resolveLocalFileSystemURL = function (url, successCallback, errorCallback) {
		utils.bind(exports.utils.schedule(
				utils.bind(exports.LocalFileSystemSync.prototype.resolveLocalFileSystemURL, exports.utils.sync(this)),
				function (entry) {
					utils.callback(successCallback, this)(exports.utils.async(entry));
				}, errorCallback), this)(url);
	}

	exports.FileSystem = function (name, realPath) {
		this.name = name;
		this.root = new exports.DirectoryEntry(this, '/');

		this.__realPath = realPath;
	}

	exports.FileSystem.prototype.realize = function (fullPath) {
		return exports.FileSystemSync.prototype.realize.call(exports.utils.sync(this), fullPath);
	}

	exports.Entry = function (filesystem, fullPath) {
		this.filesystem = filesystem;

		this.name = path.basename(fullPath);
		this.fullPath = fullPath;
	}

	exports.Entry.create = function (filesystem, fullPath, successCallback, errorCallback) {
		exports.utils.schedule(exports.EntrySync.create, function (entry) {
			successCallback(exports.utils.async(entry));
		}, errorCallback)(exports.utils.sync(filesystem), fullPath);
	}

	exports.Entry.prototype.isFile = false;
	exports.Entry.prototype.isDirectory = false;

	exports.Entry.prototype.realize = function () {
		return exports.EntrySync.prototype.realize.call(exports.utils.sync(this));
	}
	
	exports.Entry.prototype.resolve = function () {
		return exports.EntrySync.prototype.resolve.apply(exports.utils.sync(this), arguments);
	}

	exports.Entry.prototype.relative = function (to) {
		return exports.EntrySync.prototype.relative.call(exports.utils.sync(this), to);
	}

	exports.Entry.prototype.copyTo = function (parent, newName, successCallback, errorCallback) {
		utils.bind(exports.utils.schedule(utils.bind(exports.EntrySync.prototype.copyTo, exports.utils.sync(this)),
				function (entry) {
					utils.callback(successCallback, this)(exports.utils.async(entry));
				}, errorCallback), this)(exports.utils.sync(parent), newName);
	}

	exports.Entry.prototype.getMetadata = function (successCallback, errorCallback) {
		utils.bind(exports.utils.schedule(utils.bind(exports.EntrySync.prototype.getMetadata, exports.utils.sync(this)),
				successCallback, errorCallback), this)();
	}

	exports.Entry.prototype.getParent = function (successCallback, errorCallback) {
		utils.bind(exports.utils.schedule(utils.bind(exports.EntrySync.prototype.getParent, exports.utils.sync(this)),
				function (entry) {
					utils.callback(successCallback, this)(exports.utils.async(entry));
				}, errorCallback), this)();
	}

	exports.Entry.prototype.moveTo = function (parent, newName, successCallback, errorCallback) {
		utils.bind(exports.utils.schedule(utils.bind(exports.EntrySync.prototype.moveTo, exports.utils.sync(this)),
				function (entry) {
					utils.callback(successCallback, this)(exports.utils.async(entry));
				}, errorCallback), this)(exports.utils.sync(parent), newName);
	}

	exports.Entry.prototype.remove = function (successCallback, errorCallback) {
		utils.bind(exports.utils.schedule(utils.bind(exports.EntrySync.prototype.remove, exports.utils.sync(this)),
				successCallback, errorCallback), this)();
	}

	exports.Entry.prototype.toURL = function (mimeType) {
		return exports.EntrySync.prototype.toURL.call(exports.utils.sync(this), mimeType);
	}

	exports.DirectoryEntry = function (filesystem, fullPath) {
		exports.Entry.call(this, filesystem, fullPath);
	}

	exports.DirectoryEntry.prototype = new exports.Entry();
	exports.DirectoryEntry.prototype.constructor = exports.DirectoryEntry;

	exports.DirectoryEntry.prototype.isDirectory = true;

	exports.DirectoryEntry.prototype.createReader = function () {
		return new exports.DirectoryReader(this);
	}

	exports.DirectoryEntry.prototype.isPrefixOf = function (path) {
		return exports.DirectoryEntrySync.prototype.isPrefixOf.call(exports.utils.sync(this), path);
	}

	exports.DirectoryEntry.prototype.getDirectory = function (path, options, successCallback, errorCallback) {
		utils.bind(exports.utils.schedule(
				utils.bind(exports.DirectoryEntrySync.prototype.getDirectory, exports.utils.sync(this)),
				function (entry) {
					utils.callback(successCallback, this)(exports.utils.async(entry));
				}, errorCallback), this)(path, options);
	}

	exports.DirectoryEntry.prototype.getFile = function (path, options, successCallback, errorCallback) {
		utils.bind(exports.utils.schedule(
				utils.bind(exports.DirectoryEntrySync.prototype.getFile, exports.utils.sync(this)),
				function (entry) {
					utils.callback(successCallback, this)(exports.utils.async(entry));
				}, errorCallback), this)(path, options);
	}

	exports.DirectoryEntry.prototype.removeRecursively = function (successCallback, errorCallback) {
		utils.bind(exports.utils.schedule(
				utils.bind(exports.DirectoryEntrySync.prototype.removeRecursively, exports.utils.sync(this)),
				successCallback, errorCallback), this)();
	}

	exports.DirectoryReader = function (entry) {
		this.__entry = entry;
	}

	exports.DirectoryReader.prototype.__start = 0;
	exports.DirectoryReader.prototype.__length = 10;

	exports.DirectoryReader.prototype.readEntries = function (successCallback, errorCallback) {
		var sync = exports.utils.sync(this);

		utils.bind(exports.utils.schedule(utils.bind(exports.DirectoryReaderSync.prototype.readEntries, sync),
				function (entries) {
					this.__start = sync.__start;
					this.__length = sync.__length; 
		
					utils.callback(successCallback, this)(entries.map(exports.utils.async));
				}, errorCallback), this)();
	}

	exports.FileEntry = function (filesystem, fullPath) {
		exports.Entry.call(this, filesystem, fullPath);
	}

	exports.FileEntry.prototype = new exports.Entry();
	exports.FileEntry.prototype.constructor = exports.FileEntry;

	exports.FileEntry.prototype.isFile = true;

	exports.FileEntry.prototype.createWriter = function (successCallback, errorCallback) {
		utils.bind(exports.utils.schedule(function () {
			return new exports.FileWriter(this);
		}, successCallback, errorCallback), this)();
	}

	exports.FileEntry.prototype.file = function (successCallback, errorCallback) {
		utils.bind(exports.utils.schedule(function () {
			return new exports.File(this);
		}, successCallback, errorCallback), this)();
	}

	exports.FileError = function (code) {
		this.code = code;
	}

	exports.FileError.NOT_FOUND_ERR = 1;
	exports.FileError.SECURITY_ERR = 2;
	exports.FileError.ABORT_ERR = 3;
	exports.FileError.NOT_READABLE_ERR = 4;
	exports.FileError.ENCODING_ERR = 5;
	exports.FileError.NO_MODIFICATION_ALLOWED_ERR = 6;
	exports.FileError.INVALID_STATE_ERR = 7;
	exports.FileError.SYNTAX_ERR = 8;
	exports.FileError.INVALID_MODIFICATION_ERR = 9;
	exports.FileError.QUOTA_EXCEEDED_ERR = 10;
	exports.FileError.TYPE_MISMATCH_ERR = 11;
	exports.FileError.PATH_EXISTS_ERR = 12;

	exports.FileException = function (code) {
		this.code = code;
	}
	
	exports.FileException.NOT_FOUND_ERR = 1;
	exports.FileException.SECURITY_ERR = 2;
	exports.FileException.ABORT_ERR = 3;
	exports.FileException.NOT_READABLE_ERR = 4;
	exports.FileException.ENCODING_ERR = 5;
	exports.FileException.NO_MODIFICATION_ALLOWED_ERR = 6;
	exports.FileException.INVALID_STATE_ERR = 7;
	exports.FileException.SYNTAX_ERR = 8;
	exports.FileException.INVALID_MODIFICATION_ERR = 9;
	exports.FileException.QUOTA_EXCEEDED_ERR = 10;
	exports.FileException.TYPE_MISMATCH_ERR = 11;
	exports.FileException.PATH_EXISTS_ERR = 12;
})(module.exports);