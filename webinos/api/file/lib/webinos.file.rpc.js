(function (exports) {
	"use strict";

	var dom = require("./webinos.dom.rpc.js");
	var file = require("./webinos.file.js");
	var rpc = require("../../../common/rpc/lib/rpc.js");

	exports = exports;
	
	exports.Blob = {
		serialize: function (blob) {
			var object = {
				type: blob.type /* , */
				// size: blob.size
			}
			
			if (blob instanceof file.Text) {
				object.__type = "text";
				object.__text = blob.__text;
			} else if (blob instanceof file.File) {
				object.__type = "file";
				object.lastModifiedDate = blob.lastModifiedDate;
				object.__entry = exports.Entry.serialize(blob.__entry);
				object.__size = blob.__size;
				object.__start = blob.__start;
				object.__end = blob.__end;
			}
				
			return object;
		},
		
		deserialize: function (object) {
			if (object.__type == "text")
				return new file.Text(object.__text, object.type);
			else if (object.__type == "file")
				return new file.File(exports.Entry.deserialize(object.__entry),
						object.__start, object.__end, object.type);
		}
	}
	
	exports.FileReader = {
		serialize: function (reader) {
			return {
				readyState: reader.readyState,
				result: reader.result,
				error: reader.error ? dom.DOMError.serialize(reader.error) : null
			}
		},
		
		readAsText: function (params, successCallback, errorCallback, objectRef) {
			var __object = new file.FileReader();
			
			var eventCallback = function (attribute) {
				return function (event) {
					rpc.utils.notify(objectRef, attribute)
							(exports.FileReader.serialize(__object), dom.ProgressEvent.serialize(event));
				}
			}
			
			__object.onloadstart = eventCallback("onloadstart");
			__object.onprogress = eventCallback("onprogress");
			__object.onerror = eventCallback("onerror");
			__object.onabort = eventCallback("onabort");
			__object.onload = eventCallback("onload");
			__object.onloadend = eventCallback("onloadend");
			
			// TODO Catch...
			__object.readAsText(exports.Blob.deserialize(params[0]), params[1]);
		}
	}
	
	exports.FileWriter = {
		serialize: function (writer) {
			return {
				readyState: writer.readyState,
				error: writer.error ? exports.FileError.serialize(writer.error) : null,
				position: writer.position,
				length: writer.length,
				__entry: exports.Entry.serialize(writer.__entry)
			}
		},
		
		deserialize: function (object) {
			var writer = new file.FileWriter(exports.Entry.deserialize(object.__entry));
			
			// writer.readyState = object.readyState;
			writer.error = object.error;
			writer.position = object.position;
			// writer.length = object.length;
			
			return writer;
		},
		
		write: function (params, successCallback, errorCallback, objectRef) {
			var __object = exports.FileWriter.deserialize(params[0]);
			
			var eventCallback = function (attribute) {
				return function (event) {
					rpc.utils.notify(objectRef, attribute)
							(exports.FileWriter.serialize(__object), dom.ProgressEvent.serialize(event));
				}
			}
			
			__object.onwritestart = eventCallback("onwritestart");
			__object.onprogress = eventCallback("onprogress");
			__object.onerror = eventCallback("onerror");
			__object.onabort = eventCallback("onabort");
			__object.onwrite = eventCallback("onwrite");
			__object.onwriteend = eventCallback("onwriteend");
			
			// TODO Catch...
			__object.write(exports.Blob.deserialize(params[1]));
		},
		
		truncate: function (params, successCallback, errorCallback, objectRef) {
			var __object = exports.FileWriter.deserialize(params[0]);
			
			var eventCallback = function (attribute) {
				return function (event) {
					rpc.utils.notify(objectRef, attribute)
							(exports.FileWriter.serialize(__object), dom.ProgressEvent.serialize(event));
				}
			}
			
			__object.onwritestart = eventCallback("onwritestart");
			__object.onprogress = eventCallback("onprogress");
			__object.onerror = eventCallback("onerror");
			__object.onabort = eventCallback("onabort");
			__object.onwrite = eventCallback("onwrite");
			__object.onwriteend = eventCallback("onwriteend");
			
			// TODO Catch...
			__object.truncate(params[1]);
		}
	}

	exports.LocalFileSystem = {
		__object: new file.LocalFileSystem(),

		requestFileSystem: function (params, successCallback, errorCallback) {
			exports.LocalFileSystem.__object.requestFileSystem(params[0], params[1], function (filesystem) {
				successCallback(exports.FileSystem.serialize(filesystem));
			}, function (error) {
				errorCallback(exports.FileError.serialize(error));
			});
		},

		resolveLocalFileSystemURL: function (params, successCallback, errorCallback) {
			exports.LocalFileSystem.__object.resolveLocalFileSystemURL(params[0], function (entry) {
				successCallback(exports.Entry.serialize(entry));
			}, function (error) {
				errorCallback(exports.FileError.serialize(error));
			});
		}
	}

	exports.FileSystem = {
		serialize: function (filesystem) {
			return {
				name: filesystem.name,
				__realPath: filesystem.__realPath
			}
		},
	
		deserialize: function (object) {
			return new file.FileSystem(object.name, object.__realPath);
		}
	}

	exports.Entry = {
		serialize: function (entry) {
			return {
				filesystem: exports.FileSystem.serialize(entry.filesystem),
				fullPath: entry.fullPath,
				isFile: entry.isFile,
				isDirectory: entry.isDirectory
			}
		},
	
		deserialize: function (object) {
			if (object.isDirectory)
				var entry = file.DirectoryEntry;
			else if (object.isFile)
				var entry = file.FileEntry;
	
			return new entry(exports.FileSystem.deserialize(object.filesystem), object.fullPath);
		},
	
		copyTo: function (params, successCallback, errorCallback) {
			var __object = exports.Entry.deserialize(params[0]);
			
			__object.copyTo(exports.Entry.deserialize(params[1]), params[2], function (entry) {
				successCallback(exports.Entry.serialize(entry));
			}, function (error) {
				errorCallback(exports.FileError.serialize(error));
			});
		},
	
		getMetadata: function (params, successCallback, errorCallback) {
			var __object = exports.Entry.deserialize(params[0]);
	
			__object.getMetadata(function (metadata) {
				successCallback(metadata);
			}, function (error) {
				errorCallback(exports.FileError.serialize(error));
			});
		},
	
		getParent: function (params, successCallback, errorCallback) {
			var __object = exports.Entry.deserialize(params[0]);
	
			__object.getParent(function (entry) {
				successCallback(exports.Entry.serialize(entry));
			}, function (error) {
				errorCallback(exports.FileError.serialize(error));
			});
		},
	
		moveTo: function (params, successCallback, errorCallback) {
			var __object = exports.Entry.deserialize(params[0]);
	
			__object.moveTo(exports.Entry.deserialize(params[1]), params[2], function (entry) {
				successCallback(exports.Entry.serialize(entry));
			}, function (error) {
				errorCallback(exports.FileError.serialize(error));
			});
		},
	
		remove: function (params, successCallback, errorCallback) {
			var __object = exports.Entry.deserialize(params[0]);
	
			__object.remove(function () {
				successCallback();
			}, function (error) {
				errorCallback(exports.FileError.serialize(error));
			});
		}
	}

	exports.DirectoryEntry = {
		getDirectory: function (params, successCallback, errorCallback) {
			var __object = exports.Entry.deserialize(params[0]);
	
			__object.getDirectory(params[1], params[2], function (entry) {
				successCallback(exports.Entry.serialize(entry));
			}, function (error) {
				errorCallback(exports.FileError.serialize(error));
			});
		},
	
		getFile: function (params, successCallback, errorCallback) {
			var __object = exports.Entry.deserialize(params[0]);
	
			__object.getFile(params[1], params[2], function (entry) {
				successCallback(exports.Entry.serialize(entry));
			}, function (error) {
				errorCallback(exports.FileError.serialize(error));
			});
		},
	
		removeRecursively: function (params, successCallback, errorCallback) {
			var __object = exports.Entry.deserialize(params[0]);
	
			__object.removeRecursively(function () {
				successCallback();
			}, function (error) {
				errorCallback(exports.FileError.serialize(error));
			});
		}
	}
	
	exports.DirectoryReader = {
		readEntries: function (params, successCallback, errorCallback) {
			var __object = exports.Entry.deserialize(params[0]).createReader();
	
			__object.__start = params[1];
			__object.__length = params[2];
	
			__object.readEntries(function (entries) {
				successCallback({
					__start: __object.__start,
					__length: __object.__length,
					entries: entries.map(exports.Entry.serialize)
				});
			}, function (error) {
				errorCallback(exports.FileError.serialize(error));
			});
		}
	}
	
	exports.FileEntry = {
		createWriter: function (params, successCallback, errorCallback) {
			var __object = exports.Entry.deserialize(params[0]);
			
			__object.createWriter(function (writer) {
				successCallback(exports.FileWriter.serialize(writer));
			}, function (error) {
				errorCallback(exports.FileError.serialize(error));
			});
		},
		
		file: function (params, successCallback, errorCallback) {
			var __object = exports.Entry.deserialize(params[0]);
			
			__object.file(function (file) {
				successCallback(exports.Blob.serialize(file));
			}, function (error) {
				errorCallback(exports.FileError.serialize(error));
			});
		}
	}

	exports.FileError = {
		serialize: function (error) {
			return {
				code: error.code
			}
		}
	}
	
	exports.Service = function (object) {
		RPCWebinosService.call(this, object);
	}
	
	exports.Service.prototype = new RPCWebinosService();
	exports.Service.prototype.constructor = exports.Service;
	
	exports.Service.prototype.readAsText = exports.FileReader.readAsText;
	
	exports.Service.prototype.write = exports.FileWriter.write;
	exports.Service.prototype.seek = exports.FileWriter.seek;
	exports.Service.prototype.truncate = exports.FileWriter.truncate;
	
	exports.Service.prototype.requestFileSystem = exports.LocalFileSystem.requestFileSystem;
	exports.Service.prototype.resolveLocalFileSystemURL = exports.LocalFileSystem.resolveLocalFileSystemURL;
	
	exports.Service.prototype.copyTo = exports.Entry.copyTo;
	exports.Service.prototype.getMetadata = exports.Entry.getMetadata;
	exports.Service.prototype.getParent = exports.Entry.getParent;
	exports.Service.prototype.moveTo = exports.Entry.moveTo;
	exports.Service.prototype.remove = exports.Entry.remove;
	
	exports.Service.prototype.getDirectory = exports.DirectoryEntry.getDirectory;
	exports.Service.prototype.getFile = exports.DirectoryEntry.getFile;
	exports.Service.prototype.removeRecursively = exports.DirectoryEntry.removeRecursively;
	
	exports.Service.prototype.readEntries = exports.DirectoryReader.readEntries;
	
	exports.Service.prototype.createWriter = exports.FileEntry.createWriter;
	exports.Service.prototype.file = exports.FileEntry.file;

	rpc.registerObject(new exports.Service({
		api: "http://webinos.org/api/file",
		displayName: "File API",
		description: "W3C File API (including Writer, and Directories and System) implementation."
	}));
})(module.exports);