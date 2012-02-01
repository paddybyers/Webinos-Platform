if (typeof webinos === "undefined")
	webinos = {}

if (typeof webinos.file === "undefined")
	webinos.file = {}; // First necessary semicolon.

(function (exports) {
	"use strict";

	var path = webinos.path || (webinos.path = {});
	var utils = webinos.utils || (webinos.utils = {});

	// TODO Extract (de)serialization to webinos.dom.js?
	var dom = {}

	dom.ProgressEvent = {
		deserialize: function (object, target) {
			object.target = target
			object.currentTarget = target;

			return object;
		}
	}

	exports.Blob = function () {
	}

	exports.Blob.serialize = function (blob) {
		var object = {
			type: blob.type
		/* , */
		// size: blob.size
		}

		if (blob instanceof exports.Text) {
			object.__type = "text";
			object.__text = blob.__text;
		} else if (blob instanceof exports.File) {
			object.__type = "file";
			object.lastModifiedDate = blob.lastModifiedDate;
			object.__entry = exports.Entry.serialize(blob.__entry);
			object.__size = blob.__size;
			object.__start = blob.__start;
			object.__end = blob.__end;
		}

		return object;
	}

	exports.Blob.deserialize = function (service, object) {
		if (object.__type == "text")
			return new exports.Text(object.__text, object.type);
		else if (object.__type == "file") {
			var blob = new exports.File(exports.Entry.deserialize(service, object.__entry), object.__size,
					object.__start, object.__end, object.type);

			blob.lastModifiedDate = object.lastModifiedDate;

			return blob;
		}
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

	exports.File = function (entry, size, start, end, contentType) {
		exports.Blob.call(this);

		if (!(entry instanceof exports.FileEntry))
			throw new TypeError("first argument must be a FileEntry")

		if (typeof size !== "number")
			throw new TypeError("second argument must be a number");

		if (typeof start !== "number")
			var relativeStart = 0;
		else if (start < 0)
			var relativeStart = Math.max(size + start, 0);
		else
			var relativeStart = Math.min(start, size);

		if (typeof end !== "number")
			var relativeEnd = size;
		else if (end < 0)
			var relativeEnd = Math.max(size + end, 0);
		else
			var relativeEnd = Math.min(end, size);

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
		this.lastModifiedDate = 0;

		this.__entry = entry;
		this.__size = size;
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

		return new exports.File(this.__entry, this.__size, this.__start + relativeStart, this.__start + relativeEnd,
				contentType);
	}

	exports.FileReader = function (filesystem) {
		this.__filesystem = filesystem;
	}

	exports.FileReader.EMPTY = 0;
	exports.FileReader.LOADING = 1;
	exports.FileReader.DONE = 2;

	exports.FileReader.prototype.readyState = exports.FileReader.EMPTY;
	exports.FileReader.prototype.result = null;
	exports.FileReader.prototype.error = undefined;

	exports.FileReader.prototype.readAsArrayBuffer = function (blob) {
		throw new DOMException("NotSupportedError", "reading as ArrayBuffer is not supported");
	}

	exports.FileReader.prototype.readAsBinaryString = function (blob) {
		throw new DOMException("NotSupportedError", "reading as binary string is not supported");
	}

	exports.FileReader.prototype.readAsText = function (blob, encoding) {
		var eventListener = new RPCWebinosService({
			api: Math.floor(Math.random() * 100)
		});

		var eventCallback = function (attributeFun) {
			return function (params, successCallback, errorCallback) {
				this.readyState = params[0].readyState;
				this.result = params[0].result;
				this.error = params[0].error /* ? dom.DOMError.deserialize(params[0].error) : null */;

				attributeFun.call(this)(dom.ProgressEvent.deserialize(params[1], this));
			}
		}

		eventListener.onloadstart = utils.bind(eventCallback(function () {
			return utils.callback(this.onloadstart, this);
		}), this);

		eventListener.onprogress = utils.bind(eventCallback(function () {
			return utils.callback(this.onprogress, this);
		}), this);

		eventListener.onerror = utils.bind(eventCallback(function () {
			return utils.callback(this.onerror, this);
		}), this);

		eventListener.onabort = utils.bind(eventCallback(function () {
			return utils.callback(this.onabort, this);
		}), this);

		eventListener.onload = utils.bind(eventCallback(function () {
			return utils.callback(this.onload, this);
		}), this);

		eventListener.onloadend = utils.bind(eventCallback(function () {
			return utils.callback(this.onloadend, this);
		}), this);

		webinos.rpcHandler.registerCallbackObject(eventListener);

		webinos.rpcHandler.notify(this.__filesystem.__service, "readAsText", eventListener.api)(
				exports.Blob.serialize(blob), encoding);
	}

	exports.FileReader.prototype.readAsDataURL = function (blob) {
		throw new DOMException("NotSupportedError", "reading as data url is not supported");
	}

	exports.FileReader.prototype.abort = function () {
		throw new DOMException("NotSupportedError", "aborting is not supported");
	}

	exports.FileWriter = function (entry) {
		this.length = 0;

		this.__entry = entry;
	}

	exports.FileWriter.INIT = 0;
	exports.FileWriter.WRITING = 1;
	exports.FileWriter.DONE = 2;

	exports.FileWriter.serialize = function (writer) {
		return {
			readyState: writer.readyState,
			error: writer.error ? exports.FileError.serialize(writer.error) : null,
			position: writer.position,
			length: writer.length,
			__entry: exports.Entry.serialize(writer.__entry)
		}
	}

	exports.FileWriter.deserialize = function (service, object) {
		var writer = new exports.FileWriter(exports.Entry.deserialize(service, object.__entry));

		writer.readyState = object.readyState;
		writer.error = object.error;
		writer.position = object.position;
		writer.length = object.length;

		return writer;
	}

	exports.FileWriter.prototype.readyState = exports.FileWriter.INIT;
	exports.FileWriter.prototype.error = undefined;

	exports.FileWriter.prototype.position = 0;
	exports.FileWriter.prototype.length = 0;

	exports.FileWriter.prototype.write = function (data) {
		var eventListener = new RPCWebinosService({
			api: Math.floor(Math.random() * 100)
		});

		var eventCallback = function (attributeFun) {
			return function (params, successCallback, errorCallback) {
				this.readyState = params[0].readyState;
				this.error = params[0].error ? exports.FileError.deserialize(params[0].error) : null;

				this.position = params[0].position;
				this.length = params[0].length;

				attributeFun.call(this)(dom.ProgressEvent.deserialize(params[1], this));
			}
		}

		eventListener.onwritestart = utils.bind(eventCallback(function () {
			return utils.callback(this.onwritestart, this);
		}), this);

		eventListener.onprogress = utils.bind(eventCallback(function () {
			return utils.callback(this.onprogress, this);
		}), this);

		eventListener.onerror = utils.bind(eventCallback(function () {
			return utils.callback(this.onerror, this);
		}), this);

		eventListener.onabort = utils.bind(eventCallback(function () {
			return utils.callback(this.onabort, this);
		}), this);

		eventListener.onwrite = utils.bind(eventCallback(function () {
			return utils.callback(this.onwrite, this);
		}), this);

		eventListener.onwriteend = utils.bind(eventCallback(function () {
			return utils.callback(this.onwriteend, this);
		}), this);

		webinos.rpcHandler.registerCallbackObject(eventListener);

		webinos.rpcHandler.notify(this.__entry.filesystem.__service, "write", eventListener.api)(
				exports.FileWriter.serialize(this), exports.Blob.serialize(data));
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
		var eventListener = new RPCWebinosService({
			api: Math.floor(Math.random() * 100)
		});

		var eventCallback = function (attributeFun) {
			return function (params, successCallback, errorCallback) {
				this.readyState = params[0].readyState;
				this.error = params[0].error ? exports.FileError.deserialize(params[0].error) : null;

				this.position = params[0].position;
				this.length = params[0].length;

				attributeFun.call(this)(dom.ProgressEvent.deserialize(params[1], this));
			}
		}

		eventListener.onwritestart = utils.bind(eventCallback(function () {
			return utils.callback(this.onwritestart, this);
		}), this);

		eventListener.onprogress = utils.bind(eventCallback(function () {
			return utils.callback(this.onprogress, this);
		}), this);

		eventListener.onerror = utils.bind(eventCallback(function () {
			return utils.callback(this.onerror, this);
		}), this);

		eventListener.onabort = utils.bind(eventCallback(function () {
			return utils.callback(this.onabort, this);
		}), this);

		eventListener.onwrite = utils.bind(eventCallback(function () {
			return utils.callback(this.onwrite, this);
		}), this);

		eventListener.onwriteend = utils.bind(eventCallback(function () {
			return utils.callback(this.onwriteend, this);
		}), this);

		webinos.rpcHandler.registerCallbackObject(eventListener);

		webinos.rpcHandler.notify(this.__entry.filesystem.__service, "truncate", eventListener.api)(
				exports.FileWriter.serialize(this), size);
	}

	exports.FileWriter.prototype.abort = function () {
		throw new exports.FileException(exports.FileException.SECURITY_ERR);
	}

	exports.LocalFileSystem = function (object) {
		WebinosService.call(this, object);
	}

	exports.LocalFileSystem.TEMPORARY = 0;
	exports.LocalFileSystem.PERSISTENT = 1;

	exports.LocalFileSystem.prototype = new WebinosService();
	exports.LocalFileSystem.prototype.constructor = exports.LocalFileSystem;

	exports.LocalFileSystem.prototype.requestFileSystem = function (type, size, successCallback, errorCallback) {
		utils.bind(webinos.rpcHandler.request(this, "requestFileSystem", null, function (result) {
			utils.callback(successCallback, this)(exports.FileSystem.deserialize(this, result));
		}, function (error) {
			utils.callback(errorCallback, this)(exports.FileError.deserialize(error));
		}), this)(type, size);
	}

	exports.LocalFileSystem.prototype.resolveLocalFileSystemURL = function (url, successCallback, errorCallback) {
		utils.bind(webinos.rpcHandler.request(this, "resolveLocalFileSystemURL", null, function (result) {
			utils.callback(successCallback, this)(exports.Entry.deserialize(this, result));
		}, function (error) {
			utils.callback(errorCallback, this)(exports.FileError.deserialize(error));
		}), this)(url);
	}

	exports.FileSystem = function (service, name, realPath) {
		this.name = name;
		this.root = new exports.DirectoryEntry(this, "/");

		this.__service = service;
		this.__realPath = realPath;
	}

	exports.FileSystem.serialize = function (filesystem) {
		return {
			name: filesystem.name,
			__realPath: filesystem.__realPath
		}
	}

	exports.FileSystem.deserialize = function (service, object) {
		return new exports.FileSystem(service, object.name, object.__realPath);
	}

	exports.Entry = function (filesystem, fullPath) {
		this.filesystem = filesystem;

		this.name = path.basename(fullPath);
		this.fullPath = fullPath;
	}

	exports.Entry.serialize = function (entry) {
		return {
			filesystem: exports.FileSystem.serialize(entry.filesystem),
			fullPath: entry.fullPath,
			isFile: entry.isFile,
			isDirectory: entry.isDirectory
		}
	}

	exports.Entry.deserialize = function (service, object) {
		if (object.isDirectory)
			var entry = exports.DirectoryEntry;
		else if (object.isFile)
			var entry = exports.FileEntry;

		return new entry(exports.FileSystem.deserialize(service, object.filesystem), object.fullPath);
	}

	exports.Entry.prototype.isFile = false;
	exports.Entry.prototype.isDirectory = false;

	exports.Entry.prototype.resolve = function () {
		var argsArray = Array.prototype.slice.call(arguments);

		argsArray.unshift(this.fullPath);

		return path.resolve.apply(path, argsArray);
	}

	exports.Entry.prototype.relative = function (to) {
		return path.relative(this.fullPath, this.resolve(to));
	}

	exports.Entry.prototype.copyTo = function (parent, newName, successCallback, errorCallback) {
		utils.bind(webinos.rpcHandler.request(this.filesystem.__service, "copyTo", null, function (result) {
			utils.callback(successCallback, this)(exports.Entry.deserialize(this.filesystem.__service, result));
		}, function (error) {
			utils.callback(errorCallback, this)(exports.FileError.deserialize(error));
		}), this)(exports.Entry.serialize(this), exports.Entry.serialize(parent), newName);
	}

	exports.Entry.prototype.getMetadata = function (successCallback, errorCallback) {
		utils.bind(webinos.rpcHandler.request(this.filesystem.__service, "getMetadata", null, function (result) {
			utils.callback(successCallback, this)(result);
		}, function (error) {
			utils.callback(errorCallback, this)(exports.FileError.deserialize(error));
		}), this)(exports.Entry.serialize(this));
	}

	exports.Entry.prototype.getParent = function (successCallback, errorCallback) {
		utils.bind(webinos.rpcHandler.request(this.filesystem.__service, "getParent", null, function (result) {
			utils.callback(successCallback, this)(exports.Entry.deserialize(this.filesystem.__service, result));
		}, function (error) {
			utils.callback(errorCallback, this)(exports.FileError.deserialize(error));
		}), this)(exports.Entry.serialize(this));
	}

	exports.Entry.prototype.moveTo = function (parent, newName, successCallback, errorCallback) {
		utils.bind(webinos.rpcHandler.request(this.filesystem.__service, "moveTo", null, function (result) {
			utils.callback(successCallback, this)(exports.Entry.deserialize(this.filesystem.__service, result));
		}, function (error) {
			utils.callback(errorCallback, this)(exports.FileError.deserialize(error));
		}), this)(exports.Entry.serialize(this), exports.Entry.serialize(parent), newName);
	}

	exports.Entry.prototype.remove = function (successCallback, errorCallback) {
		utils.bind(webinos.rpcHandler.request(this.filesystem.__service, "remove", null, function (result) {
			utils.callback(successCallback, this)();
		}, function (error) {
			utils.callback(errorCallback, this)(exports.FileError.deserialize(error));
		}), this)(exports.Entry.serialize(this));
	}

	// TODO Transmit filesystem url.
	exports.Entry.prototype.toURL = function (mimeType) {
		throw new exports.FileException(exports.FileException.SECURITY_ERR);
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
		return path.isPrefixOf(this.fullPath, fullPath);
	}

	exports.DirectoryEntry.prototype.getDirectory = function (path, options, successCallback, errorCallback) {
		utils.bind(webinos.rpcHandler.request(this.filesystem.__service, "getDirectory", null, function (result) {
			utils.callback(successCallback, this)(exports.Entry.deserialize(this.filesystem.__service, result));
		}, function (error) {
			utils.callback(errorCallback, this)(exports.FileError.deserialize(error));
		}), this)(exports.Entry.serialize(this), path, options);
	}

	exports.DirectoryEntry.prototype.getFile = function (path, options, successCallback, errorCallback) {
		utils.bind(webinos.rpcHandler.request(this.filesystem.__service, "getFile", null, function (result) {
			utils.callback(successCallback, this)(exports.Entry.deserialize(this.filesystem.__service, result));
		}, function (error) {
			utils.callback(errorCallback, this)(exports.FileError.deserialize(error));
		}), this)(exports.Entry.serialize(this), path, options);
	}

	exports.DirectoryEntry.prototype.removeRecursively = function (successCallback, errorCallback) {
		utils.bind(webinos.rpcHandler.request(this.filesystem.__service, "removeRecursively", null, function (result) {
			utils.callback(successCallback, this)();
		}, function (error) {
			utils.callback(errorCallback, this)(exports.FileError.deserialize(error));
		}), this)(exports.Entry.serialize(this));
	}

	exports.DirectoryReader = function (entry) {
		this.__entry = entry;
	}

	exports.DirectoryReader.prototype.__start = 0;
	exports.DirectoryReader.prototype.__length = 10;

	exports.DirectoryReader.prototype.readEntries = function (successCallback, errorCallback) {
		utils.bind(
				webinos.rpcHandler.request(this.__entry.filesystem.__service, "readEntries", null, function (result) {
					this.__start = result.__start;
					this.__length = result.__length;

					utils.callback(successCallback, this)(result.entries.map(function (object) {
						return exports.Entry.deserialize(this.__entry.filesystem.__service, object);
					}, this));
				}, function (error) {
					utils.callback(errorCallback, this)(exports.FileError.deserialize(error));
				}), this)(exports.Entry.serialize(this.__entry), this.__start, this.__length);
	}

	exports.FileEntry = function (filesystem, fullPath) {
		exports.Entry.call(this, filesystem, fullPath);
	}

	exports.FileEntry.prototype = new exports.Entry();
	exports.FileEntry.prototype.constructor = exports.FileEntry;

	exports.FileEntry.prototype.isFile = true;

	exports.FileEntry.prototype.createWriter = function (successCallback, errorCallback) {
		utils.bind(webinos.rpcHandler.request(this.filesystem.__service, "createWriter", null, function (result) {
			utils.callback(successCallback, this)(exports.FileWriter.deserialize(this.filesystem.__service, result));
		}, function (error) {
			utils.callback(errorCallback, this)(exports.FileError.deserialize(error));
		}), this)(exports.Entry.serialize(this));
	}

	exports.FileEntry.prototype.file = function (successCallback, errorCallback) {
		utils.bind(webinos.rpcHandler.request(this.filesystem.__service, "file", null, function (result) {
			utils.callback(successCallback, this)(exports.Blob.deserialize(this.filesystem.__service, result));
		}, function (error) {
			utils.callback(errorCallback, this)(exports.FileError.deserialize(error));
		}), this)(exports.Entry.serialize(this));
	}

	exports.FileError = function (code) {
		this.code = code;
	}

	exports.FileError.deserialize = function (object) {
		return new exports.FileError(object.code);
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
})(webinos.file);