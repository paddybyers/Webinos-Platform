// TODO Extract (de)serialization to <pre>webinos.file.serialization.js</pre>?
(function (exports) {
	"use strict";

	var file = require('./webinos.file.js');
	var rpc = require('./rpc.js');
	
	var dom = require("./webinos.dom.rpc.js");

	exports.file = exports;
	
	exports.file.Blob = {
		serialize: function (blob) {
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
					__entry: exports.file.Entry.serialize(blob.__entry),
					__start: blob.__start
				};
		},
		
		deserialize: function (object) {
			if (object.__type == 'text')
				return new file.Text(object.__text, object.type);
			else if (object.__type == 'file')
				return new file.File(exports.file.Entry.deserialize(object.__entry),
						object.type, object.__start, object.size);
		}
	};
	
	exports.file.FileReader = {
		serialize: function (reader) {
			return {
				readyState: reader.readyState,
				result: reader.result,
				error: reader.error ? exports.file.FileError.serialize(reader.error) : null
			};
		},
		
		readAsText: function (params, successCallback, errorCallback, objectRef) {
			var __object = new file.FileReader();
			
			var eventCallback = function (attribute) {
				return function (evt) {
					rpc.utils.notify(objectRef, attribute)
							(exports.file.FileReader.serialize(__object), exports.events.ProgressEvent.serialize(evt));
				};
			};
			
			__object.onloadstart = eventCallback('onloadstart');
			__object.onprogress = eventCallback('onprogress');
			__object.onerror = eventCallback('onerror');
			__object.onabort = eventCallback('onabort');
			__object.onload = eventCallback('onload');
			__object.onloadend = eventCallback('onloadend');
			
			__object.readAsText(exports.file.Blob.deserialize(params[0]), params[1]);
		}
	};
	
	exports.file.FileWriter = {
		serialize: function (writer) {
			return {
				readyState: writer.readyState,
				position: writer.position,
				length: writer.length,
				error: writer.error ? exports.file.FileError.serialize(writer.error) : null,
				__entry: exports.file.Entry.serialize(writer.__entry)
			};
		},
		
		deserialize: function (object) {
			var writer = new file.FileWriter(exports.file.Entry.deserialize(object.__entry));
			
			// writer.readyState = object.readyState;
			writer.position = object.position;
			writer.length = object.length;
			writer.error = object.error;
			
			return writer;
		},
		
		write: function (params, successCallback, errorCallback, objectRef) {
			var __object = exports.file.FileWriter.deserialize(params[0]);
			
			var eventCallback = function (attribute) {
				return function (evt) {
					rpc.utils.notify(objectRef, attribute)
							(exports.file.FileWriter.serialize(__object), exports.events.ProgressEvent.serialize(evt));
				};
			};
			
			__object.onwritestart = eventCallback('onwritestart');
			__object.onprogress = eventCallback('onprogress');
			__object.onerror = eventCallback('onerror');
			__object.onabort = eventCallback('onabort');
			__object.onwrite = eventCallback('onwrite');
			__object.onwriteend = eventCallback('onwriteend');
			
			__object.write(exports.file.Blob.deserialize(params[1]));
		},
		
		truncate: function (params, successCallback, errorCallback, objectRef) {
			var __object = exports.file.FileWriter.deserialize(params[0]);
			
			var eventCallback = function (attribute) {
				return function (evt) {
					rpc.utils.notify(objectRef, attribute)
							(exports.file.FileWriter.serialize(__object), exports.events.ProgressEvent.serialize(evt));
				};
			};
			
			__object.onwritestart = eventCallback('onwritestart');
			__object.onprogress = eventCallback('onprogress');
			__object.onerror = eventCallback('onerror');
			__object.onabort = eventCallback('onabort');
			__object.onwrite = eventCallback('onwrite');
			__object.onwriteend = eventCallback('onwriteend');
			
			__object.truncate(params[1]);
		}
	};

	exports.file.LocalFileSystem = {
		__object: new file.LocalFileSystem(),

		requestFileSystem: function (params, successCallback, errorCallback) {
			exports.file.LocalFileSystem.__object.requestFileSystem(params[0], params[1], function (filesystem) {
				successCallback(exports.file.FileSystem.serialize(filesystem));
			}, function (error) {
				errorCallback(exports.file.FileError.serialize(error));
			});
		},

		resolveLocalFileSystemURL: function (params, successCallback, errorCallback) {
			exports.file.LocalFileSystem.__object.resolveLocalFileSystemURL(params[0], function (entry) {
				successCallback(exports.file.Entry.serialize(entry));
			}, function (error) {
				errorCallback(exports.file.FileError.serialize(error));
			});
		}
	};

	exports.file.FileSystem = {
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

	exports.file.Entry = {
		serialize: function (entry) {
			return {
				filesystem: exports.file.FileSystem.serialize(entry.filesystem),
				fullPath: entry.fullPath,
				isFile: entry.isFile,
				isDirectory: entry.isDirectory
			};
		},
	
		deserialize: function (object) {
			if (object.isDirectory)
				var entry = file.DirectoryEntry;
			else if (object.isFile)
				var entry = file.FileEntry;
	
			return new entry(exports.file.FileSystem.deserialize(object.filesystem), object.fullPath);
		},
	
		copyTo: function (params, successCallback, errorCallback) {
			var __object = exports.file.Entry.deserialize(params[0]);
			
			__object.copyTo(exports.file.Entry.deserialize(params[1]), params[2], function (entry) {
				successCallback(exports.file.Entry.serialize(entry));
			}, function (error) {
				errorCallback(exports.file.FileError.serialize(error));
			});
		},
	
		getMetadata: function (params, successCallback, errorCallback) {
			var __object = exports.file.Entry.deserialize(params[0]);
	
			__object.getMetadata(function (metadata) {
				successCallback(metadata);
			}, function (error) {
				errorCallback(exports.file.FileError.serialize(error));
			});
		},
	
		getParent: function (params, successCallback, errorCallback) {
			var __object = exports.file.Entry.deserialize(params[0]);
	
			__object.getParent(function (entry) {
				successCallback(exports.file.Entry.serialize(entry));
			}, function (error) {
				errorCallback(exports.file.FileError.serialize(error));
			});
		},
	
		moveTo: function (params, successCallback, errorCallback) {
			var __object = exports.file.Entry.deserialize(params[0]);
	
			__object.moveTo(exports.file.Entry.deserialize(params[1]), params[2], function (entry) {
				successCallback(exports.file.Entry.serialize(entry));
			}, function (error) {
				errorCallback(exports.file.FileError.serialize(error));
			});
		},
	
		remove: function (params, successCallback, errorCallback) {
			var __object = exports.file.Entry.deserialize(params[0]);
	
			__object.remove(function () {
				successCallback();
			}, function (error) {
				errorCallback(exports.file.FileError.serialize(error));
			});
		}
	};

	exports.file.DirectoryEntry = {
		getDirectory: function (params, successCallback, errorCallback) {
			var __object = exports.file.Entry.deserialize(params[0]);
	
			__object.getDirectory(params[1], params[2], function (entry) {
				successCallback(exports.file.Entry.serialize(entry));
			}, function (error) {
				errorCallback(exports.file.FileError.serialize(error));
			});
		},
	
		getFile: function (params, successCallback, errorCallback) {
			var __object = exports.file.Entry.deserialize(params[0]);
	
			__object.getFile(params[1], params[2], function (entry) {
				successCallback(exports.file.Entry.serialize(entry));
			}, function (error) {
				errorCallback(exports.file.FileError.serialize(error));
			});
		},
	
		removeRecursively: function (params, successCallback, errorCallback) {
			var __object = exports.file.Entry.deserialize(params[0]);
	
			__object.removeRecursively(function () {
				successCallback();
			}, function (error) {
				errorCallback(exports.file.FileError.serialize(error));
			});
		}
	};
	
	exports.file.DirectoryReader = {
		readEntries: function (params, successCallback, errorCallback) {
			var __object = exports.file.Entry.deserialize(params[0]).createReader();
	
			__object.__start = params[1];
			__object.__length = params[2];
	
			__object.readEntries(function (entries) {
				successCallback({
					__start: __object.__start,
					__length: __object.__length,
					entries: entries.map(exports.file.Entry.serialize)
				});
			}, function (error) {
				errorCallback(exports.file.FileError.serialize(error));
			});
		}
	};
	
	exports.file.FileEntry = {
		createWriter: function (params, successCallback, errorCallback) {
			var __object = exports.file.Entry.deserialize(params[0]);
			
			__object.createWriter(function (writer) {
				successCallback(exports.file.FileWriter.serialize(writer));
			}, function (error) {
				errorCallback(exports.file.FileError.serialize(error));
			});
		},
		
		file: function (params, successCallback, errorCallback) {
			var __object = exports.file.Entry.deserialize(params[0]);
			
			__object.file(function (file) {
				successCallback(exports.file.Blob.serialize(file));
			}, function (error) {
				errorCallback(exports.file.FileError.serialize(error));
			});
		}
	};

	exports.file.FileError = {
		serialize: function (error) {
			return {
				code: error.code
			};
		},
	
		deserialize: function (object) {
			return new file.FileError(object.code);
		}
	};
	
	exports.file.Service = function (object) {
		RPCWebinosService.call(this, object);
	}
	
	exports.file.Service.prototype = new RPCWebinosService();
	exports.file.Service.prototype.constructor = exports.file.Service;
	
	exports.file.Service.prototype.readAsText = exports.file.FileReader.readAsText;
	
	exports.file.Service.prototype.write = exports.file.FileWriter.write;
	exports.file.Service.prototype.seek = exports.file.FileWriter.seek;
	exports.file.Service.prototype.truncate = exports.file.FileWriter.truncate;
	
	exports.file.Service.prototype.requestFileSystem = exports.file.LocalFileSystem.requestFileSystem;
	exports.file.Service.prototype.resolveLocalFileSystemURL = exports.file.LocalFileSystem.resolveLocalFileSystemURL;
	
	exports.file.Service.prototype.copyTo = exports.file.Entry.copyTo;
	exports.file.Service.prototype.getMetadata = exports.file.Entry.getMetadata;
	exports.file.Service.prototype.getParent = exports.file.Entry.getParent;
	exports.file.Service.prototype.moveTo = exports.file.Entry.moveTo;
	exports.file.Service.prototype.remove = exports.file.Entry.remove;
	
	exports.file.Service.prototype.getDirectory = exports.file.DirectoryEntry.getDirectory;
	exports.file.Service.prototype.getFile = exports.file.DirectoryEntry.getFile;
	exports.file.Service.prototype.removeRecursively = exports.file.DirectoryEntry.removeRecursively;
	
	exports.file.Service.prototype.readEntries = exports.file.DirectoryReader.readEntries;
	
	exports.file.Service.prototype.createWriter = exports.file.FileEntry.createWriter;
	exports.file.Service.prototype.file = exports.file.FileEntry.file;

	rpc.registerObject(new exports.file.Service({
		api: 'http://webinos.org/api/file',
		displayName: 'File API',
		description: 'W3C File API (including Writer, and Directories and System) implementation.'
	}));
})(module.exports);