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
 * TODO Validate arguments.
 * TODO Invalidate entries (and related blobs), e.g., after being (re)moved.
 * TODO Use error/exception types/codes according to specification, e.g., at exports.utils.wrap(fun, map).
 * TODO Respect encoding (parameters), e.g., at exports.FileReader.reasAsText(blob, encoding).
 */
(function (exports) {
	"use strict";

	var __fs = require("fs");
	var __path = require("path");

	var localDependencies = require("../dependencies.json");

	var root = "../" + localDependencies.root.location;
	var dependencies = require(root + "/dependencies.json");

	var dom = require("./webinos.dom.js");
	var path = require("./webinos.path.js");
	var utils = require(root + dependencies.rpc.location + "lib/webinos.utils.js");

	// TODO Extract utilities to webinos.file.utils.js?
	exports.utils = {}

	exports.utils.wrap = function (fun, map) {
		return function () {
			try {
				return fun.apply(this, arguments);
			} catch (exception) {
				if (typeof map === "object" && typeof map[exception.code] !== "undefined")
					var code = map[exception.code];
				else
					var code = exports.FileException.SECURITY_ERR;

				throw new exports.FileException(code);
			}
		}
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
	exports.Blob.prototype.type = "";

	exports.BlobBuilder = function () {
	}

	// TODO Contents should be stored in an array and read on demand, i.e., when getBlob(contentType) is called.
	exports.BlobBuilder.prototype.__contents = "";

	// TODO Add support for Blob and ArrayBuffer(?).
	exports.BlobBuilder.prototype.append = function (data, endings /* ignored */) {
		if (typeof data === "string")
			// TODO Write as UTF-8, converting newlines as specified in endings.
			this.__contents += data;
		else
			throw new TypeError("first argument must be a string" /* ..., a Blob, or an ArrayBuffer */);

	}

	exports.BlobBuilder.prototype.getBlob = function (contentType) {
		return new exports.Text(this.__contents, contentType);
	}

	exports.Text = function (text, contentType) {
		exports.Blob.call(this);

		if (typeof text !== "string")
			throw new TypeError("first argument must be a string");

		if (typeof contentType !== "string")
			var relativeContentType = "";
		// else if (/* undefined(contentType) */)
		// 	var relativeContentType = "";
		else
			var relativeContentType = contentType;

		this.size = text.length;
		this.type = relativeContentType;

		this.__text = text;
	}

	exports.Text.prototype = new exports.Blob();
	exports.Text.prototype.constructor = exports.Text;

	exports.Text.prototype.slice = function (start, end, contentType) {
		if (typeof start !== "number")
			var relativeStart = 0;
		else if (start < 0)
			var relativeStart = Math.max(this.size + start, 0);
		else
			var relativeStart = Math.min(start, this.size);

		if (typeof end !== "number")
			var relativeEnd = this.size;
		else if (end < 0)
			var relativeEnd = Math.max(this.size + end, 0);
		else
			var relativeEnd = Math.min(end, this.size);

		var span = Math.max(relativeEnd - relativeStart, 0);

		return new exports.Text(this.__text.substr(relativeStart, span), contentType);
	}

	exports.File = function (entry, start, end, contentType) {
		exports.Blob.call(this);

		if (!(entry instanceof exports.FileEntrySync) && !(entry instanceof exports.FileEntry))
			throw new TypeError("first argument must be a FileEntrySync, or FileEntry")

		var stats = exports.utils.wrap(__fs.statSync)(entry.realize());

		if (typeof start !== "number")
			var relativeStart = 0;
		else if (start < 0)
			var relativeStart = Math.max(stats.size + start, 0);
		else
			var relativeStart = Math.min(start, stats.size);

		if (typeof end !== "number")
			var relativeEnd = stats.size;
		else if (end < 0)
			var relativeEnd = Math.max(stats.size + end, 0);
		else
			var relativeEnd = Math.min(end, stats.size);

		if (typeof contentType !== "string")
			var relativeContentType = "";
		// else if (/* undefined(contentType) */)
		// 	var relativeContentType = "";
		else
			var relativeContentType = contentType;

		var span = Math.max(relativeEnd - relativeStart, 0);

		this.name = entry.name;
		this.size = span;
		this.type = relativeContentType;
		this.lastModifiedDate = stats.mtime;

		this.__entry = entry;
		this.__size = stats.size;
		this.__start = relativeStart;
		this.__end = relativeEnd;
	}

	exports.File.prototype = new exports.Blob();
	exports.File.prototype.constructor = exports.File;

	exports.File.prototype.slice = function (start, end, contentType) {
		if (typeof start !== "number")
			var relativeStart = 0;
		else if (start < 0)
			var relativeStart = Math.max(this.size + start, 0);
		else
			var relativeStart = Math.min(start, this.size);

		if (typeof end !== "number")
			var relativeEnd = this.size;
		else if (end < 0)
			var relativeEnd = Math.max(this.size + end, 0);
		else
			var relativeEnd = Math.min(end, this.size);

		return new exports.File(this.__entry, this.__start + relativeStart, this.__start + relativeEnd, contentType);
	}

	exports.FileReader = function () {
		dom.EventTarget.call(this);

		this.addEventListener("loadstart", function (event) {
			utils.callback(this.onloadstart, this)(event);
		});

		this.addEventListener("progress", function (event) {
			utils.callback(this.onprogress, this)(event);
		});

		this.addEventListener("error", function (event) {
			utils.callback(this.onerror, this)(event);
		});

		this.addEventListener("abort", function (event) {
			utils.callback(this.onabort, this)(event);
		});

		this.addEventListener("load", function (event) {
			utils.callback(this.onload, this)(event);
		});

		this.addEventListener("loadend", function (event) {
			utils.callback(this.onloadend, this)(event);
		});
	}

	exports.FileReader.EMPTY = 0;
	exports.FileReader.LOADING = 1;
	exports.FileReader.DONE = 2;

	exports.FileReader.prototype = new dom.EventTarget();
	exports.FileReader.prototype.constructor = exports.FileReader;

	exports.FileReader.prototype.readyState = exports.FileReader.EMPTY;
	exports.FileReader.prototype.result = null;
	exports.FileReader.prototype.error = undefined;

	exports.FileReader.prototype.readAsArrayBuffer = function (blob) {
		throw new dom.DOMException("NotSupportedError", "reading as ArrayBuffer is not supported");
	}

	exports.FileReader.prototype.readAsBinaryString = function (blob) {
		throw new dom.DOMException("NotSupportedError", "reading as binary string is not supported");
	}

	exports.FileReader.prototype.readAsText = function (blob, encoding) {
		if (this.readyState == exports.FileReader.LOADING)
			throw new dom.DOMException("InvalidStateError", "read in progress");

		// TODO Validate blob, e.g., check existence, readability, safeness and size of file blobs.

		this.readyState = exports.FileReader.LOADING;
		this.result = ""; // TODO Check algorithm compliance.

		var createEventInitDict = utils.bind(function (withProgress) {
			var eventInitDict = {
				bubbles: false,
				cancelable: false
			}

			if (withProgress) {
				eventInitDict.lengthComputable = true;
				eventInitDict.loaded = this.result.length;
				eventInitDict.total = blob.size;
			}

			return eventInitDict;
		}, this);

		this.dispatchEvent(new dom.ProgressEvent("loadstart", createEventInitDict(true)));

		utils.bind(exports.utils.schedule(function () {
			if (blob instanceof exports.Text) {
				this.result = blob.__text;

				var eventInitDict = createEventInitDict(true);

				this.dispatchEvent(new dom.ProgressEvent("progress", eventInitDict));

				this.readyState = exports.FileReader.DONE;

				this.dispatchEvent(new dom.ProgressEvent("load", eventInitDict));
				this.dispatchEvent(new dom.ProgressEvent("loadend", eventInitDict));
			} else if (blob instanceof exports.File) {
				var stream = __fs.createReadStream(blob.__entry.realize(), {
					encoding: "utf8" /* encoding */,
					bufferSize: 1024,
					start: blob.__start,
					end: blob.__start + Math.max(0, blob.size - 1)
				});

				// stream.on("open", utils.bind(function () {
				// ...
				// }, this));

				stream.on("data", utils.bind(function (data) {
					this.result += data;

					this.dispatchEvent(new dom.ProgressEvent("progress", createEventInitDict(true)));
				}, this));

				stream.on("error", utils.bind(function (error) {
					this.readyState = exports.FileReader.DONE;
					this.result = null;

					// TODO Use error codes according to specification.
					this.error = new dom.DOMError("SecurityError");

					var eventInitDict = createEventInitDict(false);

					this.dispatchEvent(new dom.ProgressEvent("error", eventInitDict));
					this.dispatchEvent(new dom.ProgressEvent("loadend", eventInitDict));
				}, this));

				stream.on("end", utils.bind(function () {
					var eventInitDict = createEventInitDict(true);

					// Fire at least one event called progress, even if the read file is empty.
					if (this.result.length == 0)
						this.dispatchEvent(new dom.ProgressEvent("progress", eventInitDict));

					this.readyState = exports.FileReader.DONE;

					this.dispatchEvent(new dom.ProgressEvent("load", eventInitDict));
					this.dispatchEvent(new dom.ProgressEvent("loadend", eventInitDict));
				}, this));
			}
		}), this)();
	}

	exports.FileReader.prototype.readAsDataURL = function (blob) {
		throw new dom.DOMException("NotSupportedError", "reading as data url is not supported");
	}

	exports.FileReader.prototype.abort = function () {
		throw new dom.DOMException("NotSupportedError", "aborting is not supported");
	}

	exports.FileWriter = function (entry) {
		dom.EventTarget.call(this);

		var stats = exports.utils.wrap(__fs.statSync)(entry.realize());

		this.length = stats.size;

		this.__entry = entry;

		this.addEventListener("writestart", function (event) {
			utils.callback(this.onwritestart, this)(event);
		});

		this.addEventListener("progress", function (event) {
			utils.callback(this.onprogress, this)(event);
		});

		this.addEventListener("error", function (event) {
			utils.callback(this.onerror, this)(event);
		});

		this.addEventListener("abort", function (event) {
			utils.callback(this.onabort, this)(event);
		});

		this.addEventListener("write", function (event) {
			utils.callback(this.onwrite, this)(event);
		});

		this.addEventListener("writeend", function (event) {
			utils.callback(this.onwriteend, this)(event);
		});
	}

	exports.FileWriter.INIT = 0;
	exports.FileWriter.WRITING = 1;
	exports.FileWriter.DONE = 2;

	exports.FileWriter.prototype = new dom.EventTarget();
	exports.FileWriter.prototype.constructor = exports.FileWriter;

	exports.FileWriter.prototype.readyState = exports.FileWriter.INIT;
	exports.FileWriter.prototype.error = undefined;

	exports.FileWriter.prototype.position = 0;
	exports.FileWriter.prototype.length = 0;

	exports.FileWriter.prototype.write = function (data) {
		if (this.readyState == exports.FileWriter.WRITING)
			throw new exports.FileException(exports.FileException.INVALID_STATE_ERR);

		this.readyState = exports.FileWriter.WRITING;

		var eventInitDict = {
			bubbles: false,
			cancelable: false,
			lengthComputable: false,
			loaded: 0,
			total: 0
		}

		this.dispatchEvent(new dom.ProgressEvent("writestart", eventInitDict));

		utils.bind(
				exports.utils.schedule(
						function () {
							// TODO Use a writable stream, i.e., fs.WriteStream?
							var output = exports.utils.wrap(__fs.openSync)(this.__entry.realize(), "a");

							if (data instanceof exports.Text) {
								// TODO Write in chunks?
								var written = exports.utils.wrap(__fs.writeSync)(output, data.__text, this.position,
										"utf8" /* blob.type */);

								this.position += written;
								this.length = Math.max(this.length, this.position);

								this.dispatchEvent(new dom.ProgressEvent("progress", eventInitDict));
							} else if (data instanceof exports.File) {
								// TODO Use exports.FileReader?
								var input = exports.utils.wrap(__fs.openSync)(data.__entry.realize(), "r");

								var read;
								while ((read = exports.utils.wrap(__fs.readSync)
										(input, 1024, null, "utf8" /* blob.type */))[1] > 0) {
									var written = exports.utils.wrap(__fs.writeSync)(output, read[0], this.position,
											"utf8" /* blob.type */);

									this.position += written;
									this.length = Math.max(this.length, this.position);

									this.dispatchEvent(new dom.ProgressEvent("progress", eventInitDict));
								}

								exports.utils.wrap(__fs.closeSync)(input);
							}

							exports.utils.wrap(__fs.closeSync)(output);
						}, function () {
							this.readyState = exports.FileWriter.DONE;

							this.dispatchEvent(new dom.ProgressEvent("write", eventInitDict));
							this.dispatchEvent(new dom.ProgressEvent("writeend", eventInitDict));
						}, function (error) {
							// TODO Use error codes according to specification.
							this.error = new exports.FileError(exports.FileError.SECURITY_ERR);

							this.readyState = exports.FileWriter.DONE;

							this.dispatchEvent(new dom.ProgressEvent("error", eventInitDict));
							this.dispatchEvent(new dom.ProgressEvent("writeend", eventInitDict));
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

		var eventInitDict = {
			bubbles: false,
			cancelable: false,
			lengthComputable: false,
			loaded: 0,
			total: 0
		}

		this.dispatchEvent(new dom.ProgressEvent("writestart", eventInitDict));

		utils.bind(exports.utils.schedule(function () {
			var fd = exports.utils.wrap(__fs.openSync)(this.__entry.realize(), "r+");

			exports.utils.wrap(__fs.truncateSync)(fd, size);
			exports.utils.wrap(__fs.closeSync)(fd);

			this.position = Math.min(this.position, size);
			this.length = size;
		}, function () {
			this.readyState = exports.FileWriter.DONE;

			this.dispatchEvent(new dom.ProgressEvent("write", eventInitDict));
			this.dispatchEvent(new dom.ProgressEvent("writeend", eventInitDict));
		}, function (error) {
			// TODO Use error codes according to specification.
			this.error = new exports.FileError(exports.FileError.SECURITY_ERR);

			this.readyState = exports.FileWriter.DONE;

			this.dispatchEvent(new dom.ProgressEvent("error", eventInitDict));
			this.dispatchEvent(new dom.ProgressEvent("writeend", eventInitDict));
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
		return new exports.FileSystemSync("default", __path.join(process.cwd(), "default"));
	}

	exports.LocalFileSystemSync.prototype.resolveLocalFileSystemURL = function (url) {
		throw new exports.FileException(exports.FileException.SECURITY_ERR);
	}

	exports.FileSystemSync = function (name, realPath) {
		this.name = name;
		this.root = new exports.DirectoryEntrySync(this, "/");

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

			// TODO Use exports.FileReaderSync?
			var data = exports.utils.wrap(__fs.readFileSync)(this.realize());

			// TODO Use exports.FileWriterSync?
			exports.utils.wrap(__fs.writeFileSync)(parent.filesystem.realize(newFullPath), data);
		}

		return newEntry;
	}

	exports.EntrySync.prototype.getMetadata = function () {
		var stats = exports.utils.wrap(__fs.statSync)(this.realize());

		return {
			modificationTime: stats.mtime
		}
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

		// TODO Is this really necessary? (I don't like it.)
		if (this.isDirectory && this.isPrefixOf(parent.fullPath))
			throw new exports.FileException(exports.FileException.INVALID_MODIFICATION_ERR);

		var newFullPath = path.join(parent.fullPath, newName);

		exports.utils.wrap(__fs.renameSync)(this.realize(), parent.filesystem.realize(newFullPath));

		// TODO We already know whether this is a directory or a file...
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

	exports.DirectoryEntrySync.prototype.isPrefixOf = function (fullPath) {
		return path.isPrefixOf(this.fullPath, fullPath);
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

			var fd = exports.utils.wrap(__fs.openSync)(this.filesystem.realize(fullPath), "w");

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
		if (typeof this.__children === "undefined")
			this.__children = exports.utils.wrap(__fs.readdirSync)(this.__entry.realize());

		var entries = [];

		for ( var i = this.__start; i < Math.min(this.__start + this.__length, this.__children.length); i++)
			entries.push(exports.EntrySync.create(this.__entry.filesystem, path.join(this.__entry.fullPath,
					this.__children[i])));

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
		utils.bind(
				exports.utils.schedule(utils.bind(exports.LocalFileSystemSync.prototype.requestFileSystem,
						exports.utils.sync(this)), function (filesystem) {
					utils.callback(successCallback, this)(exports.utils.async(filesystem));
				}, errorCallback), this)(type, size);
	}

	exports.LocalFileSystem.prototype.resolveLocalFileSystemURL = function (url, successCallback, errorCallback) {
		utils.bind(
				exports.utils.schedule(utils.bind(exports.LocalFileSystemSync.prototype.resolveLocalFileSystemURL,
						exports.utils.sync(this)), function (entry) {
					utils.callback(successCallback, this)(exports.utils.async(entry));
				}, errorCallback), this)(url);
	}

	exports.FileSystem = function (name, realPath) {
		this.name = name;
		this.root = new exports.DirectoryEntry(this, "/");

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
		utils.bind(
				exports.utils.schedule(utils.bind(exports.EntrySync.prototype.copyTo, exports.utils.sync(this)),
						function (entry) {
							utils.callback(successCallback, this)(exports.utils.async(entry));
						}, errorCallback), this)(exports.utils.sync(parent), newName);
	}

	exports.Entry.prototype.getMetadata = function (successCallback, errorCallback) {
		utils.bind(
				exports.utils.schedule(utils.bind(exports.EntrySync.prototype.getMetadata, exports.utils.sync(this)),
						successCallback, errorCallback), this)();
	}

	exports.Entry.prototype.getParent = function (successCallback, errorCallback) {
		utils.bind(
				exports.utils.schedule(utils.bind(exports.EntrySync.prototype.getParent, exports.utils.sync(this)),
						function (entry) {
							utils.callback(successCallback, this)(exports.utils.async(entry));
						}, errorCallback), this)();
	}

	exports.Entry.prototype.moveTo = function (parent, newName, successCallback, errorCallback) {
		utils.bind(
				exports.utils.schedule(utils.bind(exports.EntrySync.prototype.moveTo, exports.utils.sync(this)),
						function (entry) {
							utils.callback(successCallback, this)(exports.utils.async(entry));
						}, errorCallback), this)(exports.utils.sync(parent), newName);
	}

	exports.Entry.prototype.remove = function (successCallback, errorCallback) {
		utils.bind(
				exports.utils.schedule(utils.bind(exports.EntrySync.prototype.remove, exports.utils.sync(this)),
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

	exports.DirectoryEntry.prototype.isPrefixOf = function (fullPath) {
		return exports.DirectoryEntrySync.prototype.isPrefixOf.call(exports.utils.sync(this), fullPath);
	}

	exports.DirectoryEntry.prototype.getDirectory = function (path, options, successCallback, errorCallback) {
		utils.bind(
				exports.utils.schedule(utils.bind(exports.DirectoryEntrySync.prototype.getDirectory, exports.utils
						.sync(this)), function (entry) {
					utils.callback(successCallback, this)(exports.utils.async(entry));
				}, errorCallback), this)(path, options);
	}

	exports.DirectoryEntry.prototype.getFile = function (path, options, successCallback, errorCallback) {
		utils.bind(
				exports.utils.schedule(utils.bind(exports.DirectoryEntrySync.prototype.getFile, exports.utils
						.sync(this)), function (entry) {
					utils.callback(successCallback, this)(exports.utils.async(entry));
				}, errorCallback), this)(path, options);
	}

	exports.DirectoryEntry.prototype.removeRecursively = function (successCallback, errorCallback) {
		utils.bind(
				exports.utils.schedule(utils.bind(exports.DirectoryEntrySync.prototype.removeRecursively, exports.utils
						.sync(this)), successCallback, errorCallback), this)();
	}

	exports.DirectoryReader = function (entry) {
		this.__entry = entry;
	}

	exports.DirectoryReader.prototype.__start = 0;
	exports.DirectoryReader.prototype.__length = 10;

	exports.DirectoryReader.prototype.readEntries = function (successCallback, errorCallback) {
		var sync = exports.utils.sync(this);

		utils.bind(
				exports.utils.schedule(utils.bind(exports.DirectoryReaderSync.prototype.readEntries, sync), function (
						entries) {
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