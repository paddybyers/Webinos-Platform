// TODO Extract (de)serialization?
(function (exports) {
	"use strict";

	var rpc = webinos.rpc;
	
	// TODO Extract (to somewhere else).
	rpc.events = {};
	
	rpc.events.ProgressEvent = {
		deserialize: function (object, target) {
			object.target = target
			object.currentTarget = target;
			
			return object;
		}
	};
	
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
	
	file.Blob = function () {
	}
	
	file.Blob.serialize = function (blob) {
		if (blob instanceof file.Text)
			return {
				__type: 'text',
				size: blob.size,
				type: blob.type,
				__text: blob.__text
			};
		else if (blob instanceof file.File)
			return {
				__type: 'file',
				name: blob.name,
				size: blob.size,
				type: blob.type,
				lastModifiedDate: blob.lastModifiedDate,
				__entry: file.Entry.serialize(blob.__entry),
				__start: blob.__start
			};
	}
	
	file.Blob.deserialize = function (service, object) {
		if (object.__type == 'text')
			return new file.Text(object.__text, object.type);
		else if (object.__type == 'file') {
			var blob = new file.File(file.Entry.deserialize(service, object.__entry),
					object.type, object.__start, object.size);
			
			blob.lastModifiedDate = object.lastModifiedDate;
			
			return blob;
		}
	}
	
	file.Blob.prototype.size = 0;
	file.Blob.prototype.type = '';
	
	file.BlobBuilder = function () {
	}
	
	file.BlobBuilder.prototype.__text = '';
	
	// TODO Add support for Blob and ArrayBuffer(?).
	file.BlobBuilder.prototype.append = function (data) {
		if (typeof data === 'string')
			this.__text += data;
	}
	
	file.BlobBuilder.prototype.getBlob = function (contentType) {
		return new file.Text(this.__text, contentType);
	}
	
	file.Text = function (text, type) {
		file.Blob.call(this);
		
		this.size = text ? text.length : 0;
		this.type = type || this.type;
		
		this.__text = text || '';
	}
	
	file.Text.prototype = new file.Blob();
	file.Text.prototype.constructor = file.Text;
	
	file.Text.prototype.slice = function (start, length, contentType) {
		if (start > this.size)
			length = 0;
		else if (start + length > this.size)
			length = this.size - start;
		
		return new file.Text(length > 0 ? this.__text.substr(start, length) : '', contentType || this.type);
	}
	
	file.File = function (entry, type, start, length) {
		file.Blob.call(this);

		this.name = entry.name;
		this.size = length || 0;
		this.type = type || this.type;
		this.lastModifiedDate = 0;
		
		this.__entry = entry;
		this.__start = start || 0;
	}

	file.File.prototype = new file.Blob();
	file.File.prototype.constructor = file.File;

	file.File.prototype.slice = function (start, length, contentType) {
		if (start > this.size)
			length = 0;
		else if (start + length > this.size)
			length = this.size - start;
		
		return new file.File(this.__entry, contentType || this.type, length > 0 ? this.__start + start : 0, length);
	}
	
	file.FileReader = function (filesystem) {
		this.__filesystem = filesystem;
	}
	
	file.FileReader.EMPTY = 0;
	file.FileReader.LOADING = 1;
	file.FileReader.DONE = 2;
	
	file.FileReader.prototype.readyState = file.FileReader.EMPTY;
	file.FileReader.prototype.result = null;
	file.FileReader.prototype.error = undefined;
	
	file.FileReader.prototype.readAsArrayBuffer = function (blob) {
	}
	
	file.FileReader.prototype.readAsBinaryString = function (blob) {
	}
	
	file.FileReader.prototype.readAsText = function (blob, encoding) {
		var eventListener = new RPCWebinosService({
			api: Math.floor(Math.random() * 100)
		});
		
		var eventCallback = function (attributeFun) {
			return function (params, successCallback, errorCallback) {
				this.readyState = params[0].readyState;
				this.result = params[0].result;
				this.error = params[0].error ? file.FileError.deserialize(params[0].error) : null;
				
				attributeFun.call(this)(rpc.events.ProgressEvent.deserialize(params[1], this));
			};
		};
		
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

		rpc.registerCallbackObject(eventListener);
		
		utils.rpc.notify(this.__filesystem.__service, 'readAsText', eventListener.api)
				(file.Blob.serialize(blob), encoding);
	}
	
	file.FileReader.prototype.readAsDataURL = function (blob) {
	}
	
	file.FileReader.prototype.abort = function () {
	}
	
	file.FileWriter = function (entry) {
		this.length = 0;
		
		this.__entry = entry;
	}
	
	file.FileWriter.INIT = 0;
	file.FileWriter.WRITING = 1;
	file.FileWriter.DONE = 2;
	
	file.FileWriter.serialize = function (writer) {
		return {
//			readyState: writer.readyState,
			position: writer.position,
			length: writer.length,
			error: writer.error ? rpc.file.FileError.serialize(writer.error) : null,
			__entry: file.Entry.serialize(writer.__entry)
		};
	}
	
	file.FileWriter.deserialize = function (service, object) {
		var writer = new file.FileWriter(file.Entry.deserialize(service, object.__entry));
		
		writer.readyState = object.readyState;
		writer.position = object.position;
		writer.length = object.length;
		writer.error = object.error;
		
		return writer;
	}
	
	file.FileWriter.prototype.readyState = file.FileWriter.INIT;
	file.FileWriter.prototype.position = 0;
	file.FileWriter.prototype.length = 0;
	file.FileWriter.prototype.error = undefined;

	file.FileWriter.prototype.write = function (data) {
		if (this.readyState == file.FileWriter.WRITING)
			throw new file.FileException(file.FileException.INVALID_STATE_ERR);
		
		this.readyState = file.FileWriter.WRITING;
		
		var eventListener = new RPCWebinosService({
			api: Math.floor(Math.random() * 100)
		});
		
		var eventCallback = function (attributeFun) {
			return function (params, successCallback, errorCallback) {
				this.readyState = params[0].readyState;
				this.position = params[0].position;
				this.length = params[0].length;
				this.error = params[0].error ? file.FileError.deserialize(params[0].error) : null;
				
				attributeFun.call(this)(rpc.events.ProgressEvent.deserialize(params[1], this));
			};
		};
		
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

		webinos.rpc.registerCallbackObject(eventListener);
		
		utils.rpc.notify(this.__entry.filesystem.__service, 'write', eventListener.api)
				(file.FileWriter.serialize(this), file.Blob.serialize(data));
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
		
		var eventListener = new RPCWebinosService({
			api: Math.floor(Math.random() * 100)
		});
		
		var eventCallback = function (attributeFun) {
			return function (params, successCallback, errorCallback) {
				this.readyState = params[0].readyState;
				this.position = params[0].position;
				this.length = params[0].length;
				this.error = params[0].error ? file.FileError.deserialize(params[0].error) : null;
				
				attributeFun.call(this)(rpc.events.ProgressEvent.deserialize(params[1], this));
			};
		};
		
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

		webinos.rpc.registerCallbackObject(eventListener);
		
		utils.rpc.notify(this.__entry.filesystem.__service, 'truncate', eventListener.api)
				(file.FileWriter.serialize(this), size);
	}
	
	file.FileWriter.prototype.abort = function () {
	}

	file.LocalFileSystem = function (object) {
		WebinosService.call(this, object);
	}

	file.LocalFileSystem.TEMPORARY = 0;
	file.LocalFileSystem.PERSISTENT = 1;

	file.LocalFileSystem.prototype = new WebinosService();
	file.LocalFileSystem.prototype.constructor = file.LocalFileSystem;

	file.LocalFileSystem.prototype.requestFileSystem = function (type, size, successCallback, errorCallback) {
		utils.bind(utils.rpc.request(this, 'requestFileSystem', null, function (result) {
			utils.callback(successCallback, this)(file.FileSystem.deserialize(this, result));
		}, function (error) {
			utils.callback(errorCallback, this)(file.FileError.deserialize(error));
		}), this)(type, size);
	}

	file.LocalFileSystem.prototype.resolveLocalFileSystemURL = function (url, successCallback, errorCallback) {
		utils.bind(utils.rpc.request(this, 'resolveLocalFileSystemURL', null, function (result) {
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
		utils.bind(utils.rpc.request(this.filesystem.__service, 'copyTo', null, function (result) {
			utils.callback(successCallback, this)(file.Entry.deserialize(this.filesystem.__service, result));
		}, function (error) {
			utils.callback(errorCallback, this)(file.FileError.deserialize(error));
		}), this)(file.Entry.serialize(this), file.Entry.serialize(parent), newName);
	}

	file.Entry.prototype.getMetadata = function (successCallback, errorCallback) {
		utils.bind(utils.rpc.request(this.filesystem.__service, 'getMetadata', null, function (result) {
			utils.callback(successCallback, this)(result);
		}, function (error) {
			utils.callback(errorCallback, this)(file.FileError.deserialize(error));
		}), this)(file.Entry.serialize(this));
	}

	file.Entry.prototype.getParent = function (successCallback, errorCallback) {
		utils.bind(utils.rpc.request(this.filesystem.__service, 'getParent', null, function (result) {
			utils.callback(successCallback, this)(file.Entry.deserialize(this.filesystem.__service, result));
		}, function (error) {
			utils.callback(errorCallback, this)(file.FileError.deserialize(error));
		}), this)(file.Entry.serialize(this));
	}

	file.Entry.prototype.moveTo = function (parent, newName, successCallback, errorCallback) {
		utils.bind(utils.rpc.request(this.filesystem.__service, 'moveTo', null, function (result) {
			utils.callback(successCallback, this)(file.Entry.deserialize(this.filesystem.__service, result));
		}, function (error) {
			utils.callback(errorCallback, this)(file.FileError.deserialize(error));
		}), this)(file.Entry.serialize(this), file.Entry.serialize(parent), newName);
	}

	file.Entry.prototype.remove = function (successCallback, errorCallback) {
		utils.bind(utils.rpc.request(this.filesystem.__service, 'remove', null, function (result) {
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
		utils.bind(utils.rpc.request(this.filesystem.__service, 'getDirectory', null, function (result) {
			utils.callback(successCallback, this)(file.Entry.deserialize(this.filesystem.__service, result));
		}, function (error) {
			utils.callback(errorCallback, this)(file.FileError.deserialize(error));
		}), this)(file.Entry.serialize(this), path, options);
	}

	file.DirectoryEntry.prototype.getFile = function (path, options, successCallback, errorCallback) {
		utils.bind(utils.rpc.request(this.filesystem.__service, 'getFile', null, function (result) {
			utils.callback(successCallback, this)(file.Entry.deserialize(this.filesystem.__service, result));
		}, function (error) {
			utils.callback(errorCallback, this)(file.FileError.deserialize(error));
		}), this)(file.Entry.serialize(this), path, options);
	}

	file.DirectoryEntry.prototype.removeRecursively = function (successCallback, errorCallback) {
		utils.bind(utils.rpc.request(this.filesystem.__service, 'removeRecursively', null, function (result) {
			utils.callback(successCallback, this)();
		}, function (error) {
			utils.callback(errorCallback, this)(file.FileError.deserialize(error));
		}), this)(file.Entry.serialize(this));
	}

	file.DirectoryReader = function (entry) {
		this.__entry = entry;
	}

	file.DirectoryReader.prototype.__start = 0;
	file.DirectoryReader.prototype.__length = 10;

	file.DirectoryReader.prototype.readEntries = function (successCallback, errorCallback) {
		utils.bind(utils.rpc.request(this.__entry.filesystem.__service, 'readEntries', null, function (result) {
			this.__start = result.__start;
			this.__length = result.__length;

			utils.callback(successCallback, this)(result.entries.map(function (object) {
				return file.Entry.deserialize(this.__entry.filesystem.__service, object);
			}, this));
		}, function (error) {
			utils.callback(errorCallback, this)(file.FileError.deserialize(error));
		}), this)(file.Entry.serialize(this.__entry), this.__start, this.__length);
	}

	file.FileEntry = function (filesystem, fullPath) {
		file.Entry.call(this, filesystem, fullPath);
	}

	file.FileEntry.prototype = new file.Entry();
	file.FileEntry.prototype.constructor = file.FileEntry;

	file.FileEntry.prototype.isFile = true;

	file.FileEntry.prototype.createWriter = function (successCallback, errorCallback) {
		utils.bind(utils.rpc.request(this.filesystem.__service, 'createWriter', null, function (result) {
			utils.callback(successCallback, this)(file.FileWriter.deserialize(this.filesystem.__service, result));
		}, function (error) {
			utils.callback(errorCallback, this)(file.FileError.deserialize(error));
		}), this)(file.Entry.serialize(this));
	}

	file.FileEntry.prototype.file = function (successCallback, errorCallback) {
		utils.bind(utils.rpc.request(this.filesystem.__service, 'file', null, function (result) {
			utils.callback(successCallback, this)(file.Blob.deserialize(this.filesystem.__service, result));
		}, function (error) {
			utils.callback(errorCallback, this)(file.FileError.deserialize(error));
		}), this)(file.Entry.serialize(this));
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