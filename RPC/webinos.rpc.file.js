// TODO Extract (de)serialization?
(function (exports) {
	"use strict";

	var file = require('./webinos.file.js');
	var utils = require('./webinos.utils.js');

	var rpc = require('./rpc.js');
	
	// TODO Extract (to somewhere else).
	rpc.events = {};
	
	rpc.events.Event = {
			serialize: function (event) {
				return {
					type: event.type,
					eventPhase: event.eventPhase,
					bubbles: event.bubbles,
					cancelable: event.cancelable,
					timeStamp: event.timeStamp
				};
			}
		};
	
	rpc.events.ProgressEvent = {
		serialize: function (event) {
			var object = rpc.events.Event.serialize(event);
			
			object.lengthComputable = event.lengthComputable;
			object.loaded = event.loaded;
			object.total = event.total;
			
			return object;
		}
	};

	rpc.file = exports;
	
	rpc.file.Blob = {
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
					__entry: rpc.file.Entry.serialize(blob.__entry),
					__start: blob.__start
				};
		},
		
		deserialize: function (object) {
			if (object.__type == 'text')
				return new file.Text(object.__text, object.type);
			else if (object.__type == 'file')
				return new file.File(rpc.file.Entry.deserialize(object.__entry),
						object.type, object.__start, object.size);
		}
	};
	
	rpc.file.FileReader = {
		serialize: function (reader) {
			return {
				readyState: reader.readyState,
				result: reader.result,
				error: reader.error ? rpc.file.FileError.serialize(reader.error) : null
			};
		},
		
		readAsText: function (params, successCallback, errorCallback, objectRef) {
			var __object = new file.FileReader();
			
			var eventCallback = function (attribute) {
				return function (evt) {
					utils.rpc.notify(objectRef, attribute)
							(rpc.file.FileReader.serialize(__object), rpc.events.ProgressEvent.serialize(evt));
				};
			};
			
			__object.onloadstart = eventCallback('onloadstart');
			__object.onprogress = eventCallback('onprogress');
			__object.onerror = eventCallback('onerror');
			__object.onabort = eventCallback('onabort');
			__object.onload = eventCallback('onload');
			__object.onloadend = eventCallback('onloadend');
			
			__object.readAsText(rpc.file.Blob.deserialize(params[0]), params[1]);
		}
	};
	
	rpc.file.FileWriter = {
		serialize: function (writer) {
			return {
				readyState: writer.readyState,
				position: writer.position,
				length: writer.length,
				error: writer.error ? rpc.file.FileError.serialize(writer.error) : null,
				__entry: rpc.file.Entry.serialize(writer.__entry)
			};
		},
		
		deserialize: function (object) {
			var writer = new file.FileWriter(rpc.file.Entry.deserialize(object.__entry));
			
			// writer.readyState = object.readyState;
			writer.position = object.position;
			writer.length = object.length;
			writer.error = object.error;
			
			return writer;
		},
		
		write: function (params, successCallback, errorCallback, objectRef) {
			var __object = rpc.file.FileWriter.deserialize(params[0]);
			
			var eventCallback = function (attribute) {
				return function (evt) {
					utils.rpc.notify(objectRef, attribute)
							(rpc.file.FileWriter.serialize(__object), rpc.events.ProgressEvent.serialize(evt));
				};
			};
			
			__object.onwritestart = eventCallback('onwritestart');
			__object.onprogress = eventCallback('onprogress');
			__object.onerror = eventCallback('onerror');
			__object.onabort = eventCallback('onabort');
			__object.onwrite = eventCallback('onwrite');
			__object.onwriteend = eventCallback('onwriteend');
			
			__object.write(rpc.file.Blob.deserialize(params[1]));
		},
		
		truncate: function (params, successCallback, errorCallback, objectRef) {
			var __object = rpc.file.FileWriter.deserialize(params[0]);
			
			var eventCallback = function (attribute) {
				return function (evt) {
					utils.rpc.notify(objectRef, attribute)
							(rpc.file.FileWriter.serialize(__object), rpc.events.ProgressEvent.serialize(evt));
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

	rpc.file.LocalFileSystem = {
		__object: new file.LocalFileSystem(),

		requestFileSystem: function (params, successCallback, errorCallback) {
			rpc.file.LocalFileSystem.__object.requestFileSystem(params[0], params[1], function (filesystem) {
				successCallback(rpc.file.FileSystem.serialize(filesystem));
			}, function (error) {
				errorCallback(rpc.file.FileError.serialize(error));
			});
		},

		resolveLocalFileSystemURL: function (params, successCallback, errorCallback) {
			rpc.file.LocalFileSystem.__object.resolveLocalFileSystemURL(params[0], function (entry) {
				successCallback(rpc.file.Entry.serialize(entry));
			}, function (error) {
				errorCallback(rpc.file.FileError.serialize(error));
			});
		}
	};

	rpc.file.FileSystem = {
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

	rpc.file.Entry = {
		serialize: function (entry) {
			return {
				filesystem: rpc.file.FileSystem.serialize(entry.filesystem),
				fullPath: entry.fullPath,
				isFile: entry.isFile,
				isDirectory: entry.isDirectory
			};
		},
	
		deserialize: function (object) {
			if (object.isFile)
				var entry = file.FileEntry;
			else if (object.isDirectory)
				var entry = file.DirectoryEntry
	
			return new entry(rpc.file.FileSystem.deserialize(object.filesystem), object.fullPath);
		},
	
		copyTo: function (params, successCallback, errorCallback) {
			var __object = rpc.file.Entry.deserialize(params[0]);
			
			__object.copyTo(rpc.file.Entry.deserialize(params[1]), params[2], function (entry) {
				successCallback(rpc.file.Entry.serialize(entry));
			}, function (error) {
				errorCallback(rpc.file.FileError.serialize(error));
			});
		},
	
		getMetadata: function (params, successCallback, errorCallback) {
			var __object = rpc.file.Entry.deserialize(params[0]);
	
			__object.getMetadata(function (metadata) {
				successCallback(metadata);
			}, function (error) {
				errorCallback(rpc.file.FileError.serialize(error));
			});
		},
	
		getParent: function (params, successCallback, errorCallback) {
			var __object = rpc.file.Entry.deserialize(params[0]);
	
			__object.getParent(function (entry) {
				successCallback(rpc.file.Entry.serialize(entry));
			}, function (error) {
				errorCallback(rpc.file.FileError.serialize(error));
			});
		},
	
		moveTo: function (params, successCallback, errorCallback) {
			var __object = rpc.file.Entry.deserialize(params[0]);
	
			__object.moveTo(rpc.file.Entry.deserialize(params[1]), params[2], function (entry) {
				successCallback(rpc.file.Entry.serialize(entry));
			}, function (error) {
				errorCallback(rpc.file.FileError.serialize(error));
			});
		},
	
		remove: function (params, successCallback, errorCallback) {
			var __object = rpc.file.Entry.deserialize(params[0]);
	
			__object.remove(function () {
				successCallback();
			}, function (error) {
				errorCallback(rpc.file.FileError.serialize(error));
			});
		}
	};

	rpc.file.DirectoryEntry = {
		getDirectory: function (params, successCallback, errorCallback) {
			var __object = rpc.file.Entry.deserialize(params[0]);
	
			__object.getDirectory(params[1], params[2], function (entry) {
				successCallback(rpc.file.Entry.serialize(entry));
			}, function (error) {
				errorCallback(rpc.file.FileError.serialize(error));
			});
		},
	
		getFile: function (params, successCallback, errorCallback) {
			var __object = rpc.file.Entry.deserialize(params[0]);
	
			__object.getFile(params[1], params[2], function (entry) {
				successCallback(rpc.file.Entry.serialize(entry));
			}, function (error) {
				errorCallback(rpc.file.FileError.serialize(error));
			});
		},
	
		removeRecursively: function (params, successCallback, errorCallback) {
			var __object = rpc.file.Entry.deserialize(params[0]);
	
			__object.removeRecursively(function () {
				successCallback();
			}, function (error) {
				errorCallback(rpc.file.FileError.serialize(error));
			});
		}
	};
	
	rpc.file.DirectoryReader = {
		readEntries: function (params, successCallback, errorCallback) {
			var __object = rpc.file.Entry.deserialize(params[0]).createReader();
	
			__object.__start = params[1];
			__object.__length = params[2];
	
			__object.readEntries(function (entries) {
				successCallback({
					__start: __object.__start,
					__length: __object.__length,
					entries: entries.map(rpc.file.Entry.serialize)
				});
			}, function (error) {
				errorCallback(rpc.file.FileError.serialize(error));
			});
		}
	};
	
	rpc.file.FileEntry = {
		createWriter: function (params, successCallback, errorCallback) {
			var __object = rpc.file.Entry.deserialize(params[0]);
			
			__object.createWriter(function (writer) {
				successCallback(rpc.file.FileWriter.serialize(writer));
			}, function (error) {
				errorCallback(rpc.file.FileError.serialize(error));
			});
		},
		
		file: function (params, successCallback, errorCallback) {
			var __object = rpc.file.Entry.deserialize(params[0]);
			
			__object.file(function (file) {
				successCallback(rpc.file.Blob.serialize(file));
			}, function (error) {
				errorCallback(rpc.file.FileError.serialize(error));
			});
		}
	};

	rpc.file.FileError = {
		serialize: function (error) {
			return {
				code: error.code
			};
		},
	
		deserialize: function (object) {
			return new file.FileError(object.code);
		}
	};
	
	rpc.file.Service = function (object) {
		RPCWebinosService.call(this, object);
	}
	
	rpc.file.Service.prototype = new RPCWebinosService();
	rpc.file.Service.prototype.constructor = rpc.file.Service;
	
	rpc.file.Service.prototype.readAsText = rpc.file.FileReader.readAsText;
	
	rpc.file.Service.prototype.write = rpc.file.FileWriter.write;
	rpc.file.Service.prototype.seek = rpc.file.FileWriter.seek;
	rpc.file.Service.prototype.truncate = rpc.file.FileWriter.truncate;
	
	rpc.file.Service.prototype.requestFileSystem = rpc.file.LocalFileSystem.requestFileSystem;
	rpc.file.Service.prototype.resolveLocalFileSystemURL = rpc.file.LocalFileSystem.resolveLocalFileSystemURL;
	
	rpc.file.Service.prototype.copyTo = rpc.file.Entry.copyTo;
	rpc.file.Service.prototype.getMetadata = rpc.file.Entry.getMetadata;
	rpc.file.Service.prototype.getParent = rpc.file.Entry.getParent;
	rpc.file.Service.prototype.moveTo = rpc.file.Entry.moveTo;
	rpc.file.Service.prototype.remove = rpc.file.Entry.remove;
	
	rpc.file.Service.prototype.getDirectory = rpc.file.DirectoryEntry.getDirectory;
	rpc.file.Service.prototype.getFile = rpc.file.DirectoryEntry.getFile;
	rpc.file.Service.prototype.removeRecursively = rpc.file.DirectoryEntry.removeRecursively;
	
	rpc.file.Service.prototype.readEntries = rpc.file.DirectoryReader.readEntries;
	
	rpc.file.Service.prototype.createWriter = rpc.file.FileEntry.createWriter;
	rpc.file.Service.prototype.file = rpc.file.FileEntry.file;

	rpc.registerObject(new rpc.file.Service({
		api: 'http://webinos.org/api/file',
		displayName: 'File API',
		description: 'W3C File API (including Writer, and Directories and System) implementation.'
	}));
})(module.exports);