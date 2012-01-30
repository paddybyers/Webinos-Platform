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
 * TODO Use error/exception types/codes according to specification (check everywhere!).
 * TODO Destroy/end readable/writable streams.
 */
(function (exports) {
	"use strict";

	var nFs = require("fs"),
		nPath = require("path"),
		nStream = require("stream"),
		nUtil = require("util");

	var webinos = require("webinos")(__dirname);
		webinos.dom = require("./webinos.dom.js"),
		webinos.path = require("./webinos.path.js"),
		webinos.utils = webinos.global.require(webinos.global.rpc.location, "lib/webinos.utils.js");

	var mUtils = {};

	mUtils.wrap = function (fun, map) {
		return function () {
			try {
				return fun.apply(this, arguments);
			} catch (exception) {
				var code = exports.FileException.SECURITY_ERR;

				if (typeof map === "object" && typeof map[exception.code] === "number")
					code = map[exception.code];

				throw new exports.FileException(code);
			}
		};
	};

	mUtils.schedule = function (fun, successCallback, errorCallback) {
		return function () {
			var argsArray = arguments;

			process.nextTick(webinos.utils.bind(function () {
				var result;

				try {
					result = fun.apply(this, argsArray);
				} catch (exception) {
					var code = exports.FileError.SECURITY_ERR;

					if (exception instanceof exports.FileException)
						code = exception.code;

					webinos.utils.callback(errorCallback, this)(new exports.FileError(code));

					return;
				}

				webinos.utils.callback(successCallback, this)(result);
			}, this));
		};
	};

	mUtils.sync = function (object) {
		if (object instanceof exports.LocalFileSystem)
			return new exports.LocalFileSystemSync();
		else if (object instanceof exports.FileSystem)
			return new exports.FileSystemSync(object.name, object.__realPath);
		else if (object instanceof exports.DirectoryEntry)
			return new exports.DirectoryEntrySync(mUtils.sync(object.filesystem), object.fullPath);
		else if (object instanceof exports.DirectoryReader) {
			var reader = new exports.DirectoryReaderSync(mUtils.sync(object.__entry));
			reader.__start = object.__start;
			reader.__length = object.__length;

			return reader;
		} else if (object instanceof exports.FileEntry)
			return new exports.FileEntrySync(mUtils.sync(object.filesystem), object.fullPath);
		else
			return object;
	};

	mUtils.async = function (object) {
		if (object instanceof exports.LocalFileSystemSync)
			return new exports.LocalFileSystem();
		else if (object instanceof exports.FileSystemSync)
			return new exports.FileSystem(object.name, object.__realPath);
		else if (object instanceof exports.DirectoryEntrySync)
			return new exports.DirectoryEntry(mUtils.async(object.filesystem), object.fullPath);
		else if (object instanceof exports.DirectoryReaderSync) {
			var reader = new exports.DirectoryReader(mUtils.async(object.__entry));
			reader.__start = object.__start;
			reader.__length = object.__length;

			return reader;
		} else if (object instanceof exports.FileEntrySync)
			return new exports.FileEntry(mUtils.async(object.filesystem), object.fullPath);
		else
			return object;
	};

	exports.Blob = function () {
	};

	exports.Blob.prototype.size = 0;
	exports.Blob.prototype.type = "";

	exports.BlobBuilder = function () {
	};

	exports.BlobBuilder.prototype.__contents = [];
	exports.BlobBuilder.prototype.__contentsLength = 0;

	exports.BlobBuilder.prototype.append = function (data, endings /* ignored */) {
		var buffer;

		if (typeof data === "string")
			buffer = new Buffer(data, "utf8");
		else if (data instanceof exports.Blob) {
			// TODO Lazy read appended blobs on 'composite' blob construction (i.e., getBlob)?
			var reader = new exports.FileReaderSync();

			buffer = reader.readAsBuffer(data);
		} else if (Buffer.isBuffer(data))
			buffer = data;
		else
			throw new TypeError("first argument must be a string, blob, or buffer");

		this.__contents.push(buffer);
		this.__contentsLength += buffer.length;
	};

	exports.BlobBuilder.prototype.getBlob = function (contentType) {
		var targetBuffer = new Buffer(this.__contentsLength),
			targetStart = 0;

		this.__contents.forEach(function (buffer) {
			buffer.copy(targetBuffer, targetStart);

			targetStart += buffer.length;
		});

		this.__contents = [];
		this.__contentsLength = 0;

		return new exports.Buffer(targetBuffer, contentType);
	};

	exports.Buffer = function (buffer, contentType) {
		exports.Blob.call(this);

		var relativeContentType = "";

		if (typeof contentType === "string" /* && defined(contentType) */)
			relativeContentType = contentType;

		this.size = buffer.length;
		this.type = relativeContentType;

		this.__buffer = buffer;
	}

	nUtil.inherits(exports.Buffer, exports.Blob);

	exports.Buffer.prototype.slice = function (start, end, contentType) {
		var relativeStart = 0,
			relativeEnd = this.size;

		if (typeof start === "number")
			if (start < 0)
				relativeStart = Math.max(this.size + start, 0);
			else
				relativeStart = Math.min(start, this.size);

		if (typeof end === "number")
			if (end < 0)
				relativeEnd = Math.max(this.size + end, 0);
			else
				relativeEnd = Math.min(end, this.size);

		// Normalize contentType during blob construction...
		return new exports.Buffer(this.__buffer.slice(relativeStart, relativeEnd), contentType);
	};

	exports.File = function (entry, start, end, contentType) {
		exports.Blob.call(this);

		var stats = mUtils.wrap(nFs.statSync)(entry.realize());

		var relativeStart = 0,
			relativeEnd = stats.size,
			relativeContentType = "";

		if (typeof start === "number")
			if (start < 0)
				relativeStart = Math.max(stats.size + start, 0);
			else
				relativeStart = Math.min(start, stats.size);

		if (typeof end === "number")
			if (end < 0)
				relativeEnd = Math.max(stats.size + end, 0);
			else
				relativeEnd = Math.min(end, stats.size);

		if (typeof contentType === "string" /* && defined(contentType) */)
			relativeContentType = contentType;

		var span = Math.max(relativeEnd - relativeStart, 0);

		this.name = entry.name;
		this.size = span;
		this.type = relativeContentType;
		this.lastModifiedDate = stats.mtime;

		this.__entry = entry;
		this.__size = stats.size;
		this.__start = relativeStart;
		this.__end = relativeEnd;
	};

	nUtil.inherits(exports.File, exports.Blob);

	exports.File.prototype.slice = function (start, end, contentType) {
		var relativeStart = 0,
			relativeEnd = this.size;

		if (typeof start === "number")
			if (start < 0)
				relativeStart = Math.max(this.size + start, 0);
			else
				relativeStart = Math.min(start, this.size);

		if (typeof end === "number")
			if (end < 0)
				relativeEnd = Math.max(this.size + end, 0);
			else
				relativeEnd = Math.min(end, this.size);

		// Normalize contentType during blob construction...
		return new exports.File(this.__entry, this.__start + relativeStart, this.__start + relativeEnd, contentType);
	};

	exports.FileReaderSync = function () {
	};

	exports.FileReaderSync.prototype.__read = function (blob, format, encoding) {
		var buffer;

		if (blob instanceof exports.File)
			buffer = mUtils.wrap(nFs.readFileSync)(blob.__entry.realize());
		else if (blob instanceof exports.Buffer)
			buffer = blob.__buffer;
		else
			throw new TypeError("first argument must be a (recognized) blob");

		switch (format) {
			case "buffer":
				return buffer;
			case "text":
				var relativeEncoding /* charset */ = "utf8";

				if (typeof encoding === "string" /* && defined(encoding) */)
					relativeEncoding = encoding /* ... nodify(encoding) */;

				// TODO If the blob's type attribute is present, and its charset parameter is the name or alias of a
				// character set used on the Internet, let relativeEncoding be set to its charset parameter. Otherwise,
				// check the first bytes of blob (see specification for more details).

				return buffer.toString(relativeEncoding);
			case "dataURL":
				// TODO If the blob's type attribute is present and characterizes text (i.e., it equals "text/?"),
				// and, if set, its charset parameter equals "UTF-8", then (1) let the media type's charset parameter
				// be "UTF-8", and (2) encode the buffers's contents with UTF-8 instead of Base64.

				return "data:" + blob.type + ";base64," + buffer.toString("base64");
			default:
				throw new Error("second argument must be 'buffer', 'text', or 'dataURL'");
		}
	};

	exports.FileReaderSync.prototype.readAsBuffer = function (blob) {
		return this.__read(blob, "buffer");
	};

	exports.FileReaderSync.prototype.readAsText = function (blob, encoding) {
		return this.__read(blob, "text", encoding);
	};

	exports.FileReaderSync.prototype.readAsDataURL = function (blob) {
		return this.__read(blob, "dataURL");
	};

	exports.FileReader = function () {
		webinos.dom.EventTarget.call(this);

		this.addEventListener("loadstart", function (event) {
			webinos.utils.callback(this.onloadstart, this)(event);
		});

		this.addEventListener("progress", function (event) {
			webinos.utils.callback(this.onprogress, this)(event);
		});

		this.addEventListener("error", function (event) {
			webinos.utils.callback(this.onerror, this)(event);
		});

		this.addEventListener("abort", function (event) {
			webinos.utils.callback(this.onabort, this)(event);
		});

		this.addEventListener("load", function (event) {
			webinos.utils.callback(this.onload, this)(event);
		});

		this.addEventListener("loadend", function (event) {
			webinos.utils.callback(this.onloadend, this)(event);
		});
	};

	exports.FileReader.EMPTY = 0;
	exports.FileReader.LOADING = 1;
	exports.FileReader.DONE = 2;

	exports.FileReader.BUFFER_SIZE = 1024;

	nUtil.inherits(exports.FileReader, webinos.dom.EventTarget);

	exports.FileReader.prototype.readyState = exports.FileReader.EMPTY;
	exports.FileReader.prototype.result = null;
	exports.FileReader.prototype.error = undefined;

	exports.FileReader.prototype.__read = function (blob, format, encoding) {
		if (this.readyState == exports.FileReader.LOADING)
			throw new webinos.dom.DOMException("InvalidStateError", "read in progress");

		var isFile = blob instanceof exports.File,
			isBuffer = blob instanceof exports.Buffer;

		if (!isFile && !isBuffer)
			throw new TypeError("first argument must be a (recognized) blob");

		var toBuffer = false,
			toText = false,
			toDataURL = false;

		var relativeEncoding /* charset */,
			relativeMediaType;

		switch (format) {
			case "buffer":
				toBuffer = true;

				this.result = new Buffer(0);
				break;
			case "text":
				toText = true;

				 relativeEncoding = "utf8";

				if (typeof encoding === "string" /* && defined(encoding) */)
					relativeEncoding = encoding /* ... nodify(encoding) */;

				// TODO If the blob's type attribute is present, and its charset parameter is the name or alias of a
				// character set used on the Internet, let relativeEncoding be set to its charset parameter. Otherwise,
				// check the first bytes of blob (see specification for more details).

				this.result = "";
				break;
			case "dataURL":
				toDataURL = true;

				relativeEncoding = "base64";
				relativeMediaType = blob.type;

				// TODO If the blob's type attribute is present and characterizes text (i.e., it equals "text/?"),
				// and, if set, its charset parameter equals "UTF-8", then (1) let the media type's charset parameter
				// be "UTF-8", and (2) encode the buffers's contents with UTF-8 instead of Base64.

				this.result = null;
				break;
			default:
				throw new Error("second argument must be 'buffer', 'text', or 'dataURL'");
		}

		this.readyState = exports.FileReader.LOADING;

		var loaded = 0,
			total = blob.size;

		var createEventInitDict = webinos.utils.bind(function (withProgress) {
			var eventInitDict = {
				bubbles: false,
				cancelable: false
			};

			if (withProgress) {
				eventInitDict.lengthComputable = true;
				eventInitDict.loaded = loaded;
				eventInitDict.total = total;
			}

			return eventInitDict;
		}, this);

		this.dispatchEvent(new webinos.dom.ProgressEvent("loadstart", createEventInitDict(true)));

		webinos.utils.bind(mUtils.schedule(function () {
			if (toBuffer || toDataURL)
				var targetBuffer = new Buffer(blob.size),
					targetStart = 0;

			var stream;

			if (isFile)
				stream = nFs.createReadStream(blob.__entry.realize(), {
					bufferSize: exports.FileReader.BUFFER_SIZE,
					start: blob.__start,
					end: Math.max(blob.__end - 1, 0)
				});
			else if (isBuffer)
				stream = new nStream.Stream();

			stream.on("data", webinos.utils.bind(function (data) {
				if (toBuffer || toDataURL) {
					data.copy(targetBuffer, targetStart);

					targetStart += data.length;
				}

				if (toBuffer)
					this.result = targetBuffer.slice(0, targetStart);
				else if (toText)
					this.result += data.toString(relativeEncoding);

				loaded += data.length;

				if (toBuffer || toText)
					this.dispatchEvent(new webinos.dom.ProgressEvent("progress", createEventInitDict(true)));
			}, this));

			stream.on("error", webinos.utils.bind(function (error) {
				this.readyState = exports.FileReader.DONE;
				this.result = null;

				this.error = new webinos.dom.DOMError("SecurityError");

				var eventInitDict = createEventInitDict(false);

				this.dispatchEvent(new webinos.dom.ProgressEvent("error", eventInitDict));
				this.dispatchEvent(new webinos.dom.ProgressEvent("loadend", eventInitDict));
			}, this));

			stream.on("end", webinos.utils.bind(function () {
				var eventInitDict = createEventInitDict(true);

				if (((toBuffer || toText) && loaded == 0) || toDataURL)
					this.dispatchEvent(new webinos.dom.ProgressEvent("progress", eventInitDict));

				if (toDataURL) {
					this.result = "data:" + relativeMediaType;

					if (relativeEncoding == "base64")
						this.result += ";base64";

					this.result += "," + targetBuffer.toString(relativeEncoding);
				}

				this.readyState = exports.FileReader.DONE;

				this.dispatchEvent(new webinos.dom.ProgressEvent("load", eventInitDict));
				this.dispatchEvent(new webinos.dom.ProgressEvent("loadend", eventInitDict));
			}, this));

			if (isBuffer) {
				stream.emit("data", blob.__buffer);
				stream.emit("end");
			}
		}), this)();
	};

	exports.FileReader.prototype.readAsBuffer = function (blob) {
		return this.__read(blob, "buffer");
	};

	exports.FileReader.prototype.readAsText = function (blob, encoding) {
		return this.__read(blob, "text", encoding);
	};

	exports.FileReader.prototype.readAsDataURL = function (blob) {
		return this.__read(blob, "dataURL");
	};

	exports.FileReader.prototype.abort = function () {
		throw new webinos.dom.DOMException("NotSupportedError", "aborting is not supported");
	};

	exports.FileWriterSync = function (entry) {
		var stats = mUtils.wrap(nFs.statSync)(entry.realize());

		this.length = stats.size;

		this.__entry = entry;
	};

	exports.FileWriterSync.prototype.position = 0;
	exports.FileWriterSync.prototype.length = 0;

	exports.FileWriterSync.prototype.write = function (data) {
		var reader = new exports.FileReaderSync();
		var buffer = reader.readAsBuffer(data);

		var fd = mUtils.wrap(nFs.openSync)(this.__entry.realize(), "a");

		var written = mUtils.wrap(nFs.writeSync)(fd, buffer, 0, buffer.length, this.position);

		this.position += written;
		this.length = Math.max(this.position, this.length);
	};

	exports.FileWriterSync.prototype.seek = function (offset) {
		if (offset >= 0)
			this.position = Math.min(offset, this.length);
		else
			this.position = Math.max(this.length + offset, 0);
	};

	exports.FileWriterSync.prototype.truncate = function (size) {
		var fd = mUtils.wrap(nFs.openSync)(this.__entry.realize(), "r+");

		mUtils.wrap(nFs.truncateSync)(fd, size);
		mUtils.wrap(nFs.closeSync)(fd);

		this.position = Math.min(size, this.position);
		this.length = size;
	};

	exports.FileWriter = function (entry) {
		webinos.dom.EventTarget.call(this);

		var stats = mUtils.wrap(nFs.statSync)(entry.realize());

		this.length = stats.size;

		this.__entry = entry;

		this.addEventListener("writestart", function (event) {
			webinos.utils.callback(this.onwritestart, this)(event);
		});

		this.addEventListener("progress", function (event) {
			webinos.utils.callback(this.onprogress, this)(event);
		});

		this.addEventListener("error", function (event) {
			webinos.utils.callback(this.onerror, this)(event);
		});

		this.addEventListener("abort", function (event) {
			webinos.utils.callback(this.onabort, this)(event);
		});

		this.addEventListener("write", function (event) {
			webinos.utils.callback(this.onwrite, this)(event);
		});

		this.addEventListener("writeend", function (event) {
			webinos.utils.callback(this.onwriteend, this)(event);
		});
	};

	exports.FileWriter.INIT = 0;
	exports.FileWriter.WRITING = 1;
	exports.FileWriter.DONE = 2;

	nUtil.inherits(exports.FileWriter, webinos.dom.EventTarget);

	exports.FileWriter.prototype.readyState = exports.FileWriter.INIT;
	exports.FileWriter.prototype.error = undefined;

	exports.FileWriter.prototype.position = 0;
	exports.FileWriter.prototype.length = 0;

	exports.FileWriter.prototype.write = function (data) {
		if (this.readyState == exports.FileWriter.WRITING)
			throw new exports.FileException(exports.FileException.INVALID_STATE_ERR);

		var isFile = data instanceof exports.File,
			isBuffer = data instanceof exports.Buffer;

		if (!isFile && !isBuffer)
			throw new TypeError("first argument must be a (recognized) blob");

		this.readyState = exports.FileWriter.WRITING;

		var eventInitDict = {
			bubbles: false,
			cancelable: false,
			lengthComputable: false,
			loaded: 0,
			total: 0
		};

		this.dispatchEvent(new webinos.dom.ProgressEvent("writestart", eventInitDict));

		webinos.utils.bind(mUtils.schedule(function () {
			// TODO Reuse readable stream creation from FileReader (somehow?!).
			var readStream;

			if (isFile)
				readStream = nFs.createReadStream(data.__entry.realize(), {
					bufferSize: exports.FileReader.BUFFER_SIZE,
					start: data.__start,
					end: Math.max(data.__end - 1, 0)
				});
			else if (isBuffer)
				readStream = new nStream.Stream();

			var writeStream = nFs.createWriteStream(this.__entry.realize(), {
				flags: "r+",
				start: this.position
			});

			readStream.on("data", webinos.utils.bind(function (data) {
				if (writeStream.write(data) === false && isFile)
					readStream.pause();

				this.position += data.length;
				this.length = Math.max(this.position, this.length);

				this.dispatchEvent(new webinos.dom.ProgressEvent("progress", eventInitDict));
			}, this));

			writeStream.on("drain", webinos.utils.bind(function () {
				if (isFile)
					readStream.resume();
			}, this));

			if (isBuffer) {
				readStream.emit("data", data.__buffer);
				readStream.emit("end");
			}

//			// TODO Use a writable stream, i.e., fs.WriteStream?
//			var output = mUtils.wrap(nFs.openSync)(this.__entry.realize(), "a");
//
//			if (data instanceof exports.Text) {
//				// TODO Write in chunks?
//				var written = mUtils.wrap(nFs.writeSync)(output, data.__text, this.position,
//						"utf8" /* blob.type */);
//
//				this.position += written;
//				this.length = Math.max(this.length, this.position);
//
//				this.dispatchEvent(new webinos.dom.ProgressEvent("progress", eventInitDict));
//			} else if (data instanceof exports.File) {
//				// TODO Use exports.FileReader?
//				var input = mUtils.wrap(nFs.openSync)(data.__entry.realize(), "r");
//
//				var read;
//				while ((read = mUtils.wrap(nFs.readSync)
//						(input, 1024, null, "utf8" /* blob.type */))[1] > 0) {
//					var written = mUtils.wrap(nFs.writeSync)(output, read[0], this.position,
//							"utf8" /* blob.type */);
//
//					this.position += written;
//					this.length = Math.max(this.length, this.position);
//
//					this.dispatchEvent(new webinos.dom.ProgressEvent("progress", eventInitDict));
//				}
//
//				mUtils.wrap(nFs.closeSync)(input);
//			}
//
//			mUtils.wrap(nFs.closeSync)(output);
		}, function () {
			this.readyState = exports.FileWriter.DONE;

			this.dispatchEvent(new webinos.dom.ProgressEvent("write", eventInitDict));
			this.dispatchEvent(new webinos.dom.ProgressEvent("writeend", eventInitDict));
		}, function (error) {
			this.error = new exports.FileError(exports.FileError.SECURITY_ERR);

			this.readyState = exports.FileWriter.DONE;

			this.dispatchEvent(new webinos.dom.ProgressEvent("error", eventInitDict));
			this.dispatchEvent(new webinos.dom.ProgressEvent("writeend", eventInitDict));
		}), this)();
	};

	exports.FileWriter.prototype.seek = function (offset) {
		if (this.readyState == exports.FileWriter.WRITING)
			throw new exports.FileException(exports.FileException.INVALID_STATE_ERR);

		if (offset >= 0)
			this.position = Math.min(offset, this.length);
		else
			this.position = Math.max(this.length + offset, 0);
	};

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
		};

		this.dispatchEvent(new webinos.dom.ProgressEvent("writestart", eventInitDict));

		webinos.utils.bind(mUtils.schedule(function () {
			var fd = mUtils.wrap(nFs.openSync)(this.__entry.realize(), "r+");

			mUtils.wrap(nFs.truncateSync)(fd, size);
			mUtils.wrap(nFs.closeSync)(fd);
		}, function () {
			this.position = Math.min(size, this.position);
			this.length = size;

			this.readyState = exports.FileWriter.DONE;

			this.dispatchEvent(new webinos.dom.ProgressEvent("write", eventInitDict));
			this.dispatchEvent(new webinos.dom.ProgressEvent("writeend", eventInitDict));
		}, function (error) {
			this.error = new exports.FileError(exports.FileError.SECURITY_ERR);

			this.readyState = exports.FileWriter.DONE;

			this.dispatchEvent(new webinos.dom.ProgressEvent("error", eventInitDict));
			this.dispatchEvent(new webinos.dom.ProgressEvent("writeend", eventInitDict));
		}), this)();
	};

	exports.FileWriter.prototype.abort = function () {
		throw new exports.FileException(exports.FileException.SECURITY_ERR);
	};

	exports.LocalFileSystemSync = function () {
	}

	exports.LocalFileSystemSync.TEMPORARY = 0;
	exports.LocalFileSystemSync.PERSISTENT = 1;

	// TODO Choose filesystem according to specification.
	exports.LocalFileSystemSync.prototype.requestFileSystemSync = function (type, size) {
		return new exports.FileSystemSync("default", nPath.join(process.cwd(), "default"));
	}

	exports.LocalFileSystemSync.prototype.resolveLocalFileSystemSyncURL = function (url) {
		throw new exports.FileException(exports.FileException.SECURITY_ERR);
	}

	exports.FileSystemSync = function (name, realPath) {
		this.name = name;
		this.root = new exports.DirectoryEntrySync(this, "/");

		this.__realPath = realPath;
	}

	exports.FileSystemSync.prototype.realize = function (fullPath) {
		return nPath.join(this.__realPath, fullPath);
	}

	exports.EntrySync = function (filesystem, fullPath) {
		this.filesystem = filesystem;

		this.name = webinos.path.basename(fullPath);
		this.fullPath = fullPath;
	}

	exports.EntrySync.create = function (filesystem, fullPath) {
		var stats = mUtils.wrap(nFs.statSync)(filesystem.realize(fullPath));

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

		return webinos.path.resolve.apply(webinos.path, argsArray);
	}

	exports.EntrySync.prototype.relative = function (to) {
		return webinos.path.relative(this.fullPath, this.resolve(to));
	}

	exports.EntrySync.prototype.copyTo = function (parent, newName) {
		newName = newName || this.name;

		if (webinos.path.equals(parent.fullPath, this.getParent().fullPath) && newName == this.name)
			throw new exports.FileException(exports.FileException.INVALID_MODIFICATION_ERR);

		var newFullPath = webinos.path.join(parent.fullPath, newName);

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
			var data = mUtils.wrap(nFs.readFileSync)(this.realize());

			// TODO Use exports.FileWriterSync?
			mUtils.wrap(nFs.writeFileSync)(parent.filesystem.realize(newFullPath), data);
		}

		return newEntry;
	}

	exports.EntrySync.prototype.getMetadata = function () {
		var stats = mUtils.wrap(nFs.statSync)(this.realize());

		return {
			modificationTime: stats.mtime
		}
	}

	exports.EntrySync.prototype.getParent = function () {
		if (webinos.path.equals(this.fullPath, this.filesystem.root.fullPath))
			return this;

		return new exports.DirectoryEntrySync(this.filesystem, webinos.path.dirname(this.fullPath));
	}

	exports.EntrySync.prototype.moveTo = function (parent, newName) {
		newName = newName || this.name;

		if (webinos.path.equals(parent.fullPath, this.getParent().fullPath) && newName == this.name)
			throw new exports.FileException(exports.FileException.INVALID_MODIFICATION_ERR);

		// TODO Is this really necessary? (I don't like it.)
		if (this.isDirectory && this.isPrefixOf(parent.fullPath))
			throw new exports.FileException(exports.FileException.INVALID_MODIFICATION_ERR);

		var newFullPath = webinos.path.join(parent.fullPath, newName);

		mUtils.wrap(nFs.renameSync)(this.realize(), parent.filesystem.realize(newFullPath));

		// TODO We already know whether this is a directory or a file...
		return exports.EntrySync.create(parent.filesystem, newFullPath);
	}

	exports.EntrySync.prototype.remove = function () {
		if (webinos.path.equals(this.fullPath, this.filesystem.root.fullPath))
			throw new exports.FileException(exports.FileException.SECURITY_ERR);

		if (this.isDirectory)
			var remove = nFs.rmdirSync;
		else if (this.isFile)
			var remove = nFs.unlinkSync;

		mUtils.wrap(remove)(this.realize());
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
		return webinos.path.isPrefixOf(this.fullPath, fullPath);
	}

	exports.DirectoryEntrySync.prototype.getDirectory = function (path, options) {
		var fullPath = this.resolve(path);

		if (nPath.existsSync(this.filesystem.realize(fullPath))) {
			if (options && options.create && options.exclusive)
				throw new exports.FileException(exports.FileException.PATH_EXISTS_ERR);

			var entry = exports.EntrySync.create(this.filesystem, fullPath);

			if (!entry.isDirectory)
				throw new exports.FileException(exports.FileException.TYPE_MISMATCH_ERR);
		} else {
			if (!options || !options.create)
				throw new exports.FileException(exports.FileException.NOT_FOUND_ERR);

			// TODO Use fullPath's parent instead of "this".
			var stats = mUtils.wrap(nFs.statSync)(this.realize());

			mUtils.wrap(nFs.mkdirSync)(this.filesystem.realize(fullPath), stats.mode);

			var entry = new exports.DirectoryEntrySync(this.filesystem, fullPath)
		}

		return entry;
	}

	exports.DirectoryEntrySync.prototype.getFile = function (path, options) {
		var fullPath = this.resolve(path);

		if (nPath.existsSync(this.filesystem.realize(fullPath))) {
			if (options && options.create && options.exclusive)
				throw new exports.FileException(exports.FileException.PATH_EXISTS_ERR);

			var entry = exports.EntrySync.create(this.filesystem, fullPath);

			if (!entry.isFile)
				throw new exports.FileException(exports.FileException.TYPE_MISMATCH_ERR);
		} else {
			if (!options || !options.create)
				throw new exports.FileException(exports.FileException.NOT_FOUND_ERR);

			var fd = mUtils.wrap(nFs.openSync)(this.filesystem.realize(fullPath), "w");

			mUtils.wrap(nFs.closeSync)(fd);

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
			this.__children = mUtils.wrap(nFs.readdirSync)(this.__entry.realize());

		var entries = [];

		for ( var i = this.__start; i < Math.min(this.__start + this.__length, this.__children.length); i++)
			entries.push(exports.EntrySync.create(this.__entry.filesystem, webinos.path.join(this.__entry.fullPath,
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
		webinos.utils.bind(
				mUtils.schedule(webinos.utils.bind(exports.LocalFileSystemSync.prototype.requestFileSystemSync,
						mUtils.sync(this)), function (filesystem) {
					webinos.utils.callback(successCallback, this)(mUtils.async(filesystem));
				}, errorCallback), this)(type, size);
	}

	exports.LocalFileSystem.prototype.resolveLocalFileSystemURL = function (url, successCallback, errorCallback) {
		webinos.utils.bind(
				mUtils.schedule(webinos.utils.bind(exports.LocalFileSystemSync.prototype.resolveLocalFileSystemSyncURL,
						mUtils.sync(this)), function (entry) {
					webinos.utils.callback(successCallback, this)(mUtils.async(entry));
				}, errorCallback), this)(url);
	}

	exports.FileSystem = function (name, realPath) {
		this.name = name;
		this.root = new exports.DirectoryEntry(this, "/");

		this.__realPath = realPath;
	}

	exports.FileSystem.prototype.realize = function (fullPath) {
		return exports.FileSystemSync.prototype.realize.call(mUtils.sync(this), fullPath);
	}

	exports.Entry = function (filesystem, fullPath) {
		this.filesystem = filesystem;

		this.name = webinos.path.basename(fullPath);
		this.fullPath = fullPath;
	}

	exports.Entry.create = function (filesystem, fullPath, successCallback, errorCallback) {
		mUtils.schedule(exports.EntrySync.create, function (entry) {
			successCallback(mUtils.async(entry));
		}, errorCallback)(mUtils.sync(filesystem), fullPath);
	}

	exports.Entry.prototype.isFile = false;
	exports.Entry.prototype.isDirectory = false;

	exports.Entry.prototype.realize = function () {
		return exports.EntrySync.prototype.realize.call(mUtils.sync(this));
	}

	exports.Entry.prototype.resolve = function () {
		return exports.EntrySync.prototype.resolve.apply(mUtils.sync(this), arguments);
	}

	exports.Entry.prototype.relative = function (to) {
		return exports.EntrySync.prototype.relative.call(mUtils.sync(this), to);
	}

	exports.Entry.prototype.copyTo = function (parent, newName, successCallback, errorCallback) {
		webinos.utils.bind(
				mUtils.schedule(webinos.utils.bind(exports.EntrySync.prototype.copyTo, mUtils.sync(this)),
						function (entry) {
							webinos.utils.callback(successCallback, this)(mUtils.async(entry));
						}, errorCallback), this)(mUtils.sync(parent), newName);
	}

	exports.Entry.prototype.getMetadata = function (successCallback, errorCallback) {
		webinos.utils.bind(
				mUtils.schedule(webinos.utils.bind(exports.EntrySync.prototype.getMetadata, mUtils.sync(this)),
						successCallback, errorCallback), this)();
	}

	exports.Entry.prototype.getParent = function (successCallback, errorCallback) {
		webinos.utils.bind(
				mUtils.schedule(webinos.utils.bind(exports.EntrySync.prototype.getParent, mUtils.sync(this)),
						function (entry) {
							webinos.utils.callback(successCallback, this)(mUtils.async(entry));
						}, errorCallback), this)();
	}

	exports.Entry.prototype.moveTo = function (parent, newName, successCallback, errorCallback) {
		webinos.utils.bind(
				mUtils.schedule(webinos.utils.bind(exports.EntrySync.prototype.moveTo, mUtils.sync(this)),
						function (entry) {
							webinos.utils.callback(successCallback, this)(mUtils.async(entry));
						}, errorCallback), this)(mUtils.sync(parent), newName);
	}

	exports.Entry.prototype.remove = function (successCallback, errorCallback) {
		webinos.utils.bind(
				mUtils.schedule(webinos.utils.bind(exports.EntrySync.prototype.remove, mUtils.sync(this)),
						successCallback, errorCallback), this)();
	}

	exports.Entry.prototype.toURL = function (mimeType) {
		return exports.EntrySync.prototype.toURL.call(mUtils.sync(this), mimeType);
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
		return exports.DirectoryEntrySync.prototype.isPrefixOf.call(mUtils.sync(this), fullPath);
	}

	exports.DirectoryEntry.prototype.getDirectory = function (path, options, successCallback, errorCallback) {
		webinos.utils.bind(
				mUtils.schedule(webinos.utils.bind(exports.DirectoryEntrySync.prototype.getDirectory, exports.utils
						.sync(this)), function (entry) {
					webinos.utils.callback(successCallback, this)(mUtils.async(entry));
				}, errorCallback), this)(path, options);
	}

	exports.DirectoryEntry.prototype.getFile = function (path, options, successCallback, errorCallback) {
		webinos.utils.bind(
				mUtils.schedule(webinos.utils.bind(exports.DirectoryEntrySync.prototype.getFile, exports.utils
						.sync(this)), function (entry) {
					webinos.utils.callback(successCallback, this)(mUtils.async(entry));
				}, errorCallback), this)(path, options);
	}

	exports.DirectoryEntry.prototype.removeRecursively = function (successCallback, errorCallback) {
		webinos.utils.bind(
				mUtils.schedule(webinos.utils.bind(exports.DirectoryEntrySync.prototype.removeRecursively, exports.utils
						.sync(this)), successCallback, errorCallback), this)();
	}

	exports.DirectoryReader = function (entry) {
		this.__entry = entry;
	}

	exports.DirectoryReader.prototype.__start = 0;
	exports.DirectoryReader.prototype.__length = 10;

	exports.DirectoryReader.prototype.readEntries = function (successCallback, errorCallback) {
		var sync = mUtils.sync(this);

		webinos.utils.bind(
				mUtils.schedule(webinos.utils.bind(exports.DirectoryReaderSync.prototype.readEntries, sync), function (
						entries) {
					this.__start = sync.__start;
					this.__length = sync.__length;

					webinos.utils.callback(successCallback, this)(entries.map(mUtils.async));
				}, errorCallback), this)();
	}

	exports.FileEntry = function (filesystem, fullPath) {
		exports.Entry.call(this, filesystem, fullPath);
	}

	exports.FileEntry.prototype = new exports.Entry();
	exports.FileEntry.prototype.constructor = exports.FileEntry;

	exports.FileEntry.prototype.isFile = true;

	exports.FileEntry.prototype.createWriter = function (successCallback, errorCallback) {
		webinos.utils.bind(mUtils.schedule(function () {
			return new exports.FileWriter(this);
		}, successCallback, errorCallback), this)();
	}

	exports.FileEntry.prototype.file = function (successCallback, errorCallback) {
		webinos.utils.bind(mUtils.schedule(function () {
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
