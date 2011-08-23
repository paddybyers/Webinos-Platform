(function() {

	webinos = {}; 
	
	///////////////////// WEBINOS INTERNAL RPC HELPER ///////////////////////////////
	webinos.rpc = {};
	
	webinos.rpc.channel = null;
	
	webinos.rpc.awaitingResponse = {};
	
	webinos.rpc.objectRef = {};
	
	webinos.rpc.registeredServices = 0;
	
	/**
	 * Executes the givin RPC Request and registers an optional callback that
	 * is invoked if an RPC responce with same id was received
	 */
	webinos.rpc.executeRPC = function (rpc, callback) {
		
	    webinos.rpc.channel.send(JSON.stringify(rpc));
		
		if (typeof callback !== 'undefined' && typeof rpc.id !== 'undefined' && rpc.id != null)
			webinos.rpc.awaitingResponse[rpc.id] = callback;
	}
	
	/**
	 * 
	 * 
	 */
	webinos.rpc.registerObjectRef = function (ref, callback) {
		
		if (typeof callback !== 'undefined' && typeof ref !== 'undefined' && ref != null)
			webinos.rpc.objectRef[ref] = callback;
	}
	
	/**
	 * 
	 * 
	 */
	webinos.rpc.unregisterObjectRef = function (ref) {
		
		if (typeof ref !== 'undefined' && ref != null)
			webinos.rpc.objectRef[ref] = null;
	}
	
	/**
	 * Creates a JSON RPC 2.0 compliant object
	 * @param service The service Identifier (e.g., the file reader or the
	 * 	      camera service)
	 * @param method The method that should be invoked on the service
	 * @param an optional array of parameters to be used
	 * @param an optional ID that can be used to map incomming RPC responses
	 * 		  to requests
	 */
	webinos.rpc.createRPC = function (service, method, params, id) {
		
		if (typeof service === 'undefined') throw "Service is undefined";
		if (typeof method === 'undefined') throw "Method is undefined";
		
		var rpc = {};
		rpc.jsonrpc = "2.0";
		rpc.service = service;
		rpc.method = method;
		
		if (typeof params === 'undefined') rpc.params = [];
		else rpc.params = params;
		
		if (typeof id !== 'undefined') rpc.id = id;
		
		return rpc;
	}
	
	///////////////////// WEBINOS INTERNAL COMMUNICATION INTERFACE ///////////////////////////////
	
	/**
	 * Creates the socket communication channel
	 * for a locally hosted websocket server at port 8080
	 * for now this channel is used for sending RPC, later the webinos
	 * messaging/eventing system will be used
	 */
	webinos.rpc.createCommChannel = function (success){
		webinos.rpc.channel  = new WebSocket('ws://127.0.0.1:8080');
		var opened = success;
		webinos.rpc.channel.onopen = function() {
			opened();
		};

		var self = this;
		webinos.rpc.channel.onmessage = function(ev) {
			var myObject = JSON.parse(ev.data);
			
			logObj(myObject, "rpc");
			
			//received message is RPC request
			if (typeof myObject.method !== 'undefined'){
				if (typeof myObject.objectRef !== 'undefined'){
					webinos.rpc.objectRef[myObject.objectRef](ev.data);
				}
			}
			//received message is RPC response
			else{
				if (typeof myObject.id === 'undefined' || myObject.id == null) return;
				if (webinos.rpc.awaitingResponse[myObject.id] !== 'undefined'){
					if (webinos.rpc.awaitingResponse[myObject.id] != null){
						webinos.rpc.awaitingResponse[myObject.id](ev);
						webinos.rpc.awaitingResponse[myObject.id] == null;
					}
				}
			}
		};
	}
	
	function logObj(obj, name){
		for (var myKey in obj){
			console.log(name + "["+myKey +"] = "+obj[myKey]);
			if (typeof obj[myKey] == 'object') logObj(obj[myKey], myKey);
		}
	}

	///////////////////// WEBINOS DISCOVERY INTERFACE ///////////////////////////////
	
	webinos.ServiceDiscovery = {};
	
	webinos.ServiceDiscovery.findServices = function (type, callback) {
		if (type == "FileReader"){
			var tmp = new WebinosFileReader();
			//some additional meta data that may be needed for a "real"
			//discovery service
			tmp.origin = 'ws://127.0.0.1:8080';
			callback.onFound(tmp);
			webinos.rpc.registeredServices++;
			return;
		}
		if (type == "FileSaver"){
			var tmp = new WebinosFileSaverRetriever();
			tmp.origin = 'ws://127.0.0.1:8080';
			webinos.rpc.registeredServices++;
			callback.onFound(tmp);
			return;
		}
		if (type == "FileWriter"){
			var tmp = new WebinosFileWriterRetriever();
			tmp.origin = 'ws://127.0.0.1:8080';
			webinos.rpc.registeredServices++;
			callback.onFound(tmp);
			return;
		}
		if (type == "BlobBuilder"){
			var tmp = new BlobBuilder();
			tmp.origin = 'ws://127.0.0.1:8080';
			webinos.rpc.registeredServices++;
			callback.onFound(tmp);
			return;
		}
		
	}
	
	///////////////////// WEBINOS SERVICE INTERFACE ///////////////////////////////
	
	var WebinosService = function () {
		this.id = Math.floor(Math.random()*101);
		
	};
	
	
	WebinosService.prototype.bind = function(success) {
		if (webinos.rpc.channel == null){ 
			var x = success;
			webinos.rpc.createCommChannel(function () {
				x();
			});
			
		}
		else{
			success();
		}
	};
	
	WebinosService.prototype.unbind = function() {
		webinos.rpc.registeredServices--;
		if (webinos.rpc.channel != null && webinos.rpc.registeredServices > 0) {
			webinos.rpc.channel.close();
			webinos.rpc.channel = null;
		}
	}

	
	///////////////////// BLOB INTERFACE ///////////////////////////////
	
    var Blob;
    
    Blob = function () {
    	
    }
        
     Blob.prototype.size = 0;
     
     Blob.prototype.__dataAsString = "";
     Blob.prototype.__contentType = null;
     
     Blob.prototype.slice = function (start, length) {
    	 if (start + length >= this.size){
    		 tmp = new Blob();
    		 tmp.__dataAsString = this.__dataAsString.substring(start, start + length);
    		 tmp.size = length;
    		 return tmp;
    	 }
    	 else{
    		 
    		 //throws "DOMException";
    	 }
     };
	
	///////////////////// BLOBBUILDER INTERFACE ///////////////////////////////
	var BlobBuilder;
	
	BlobBuilder = function () {
		
	};
	
	BlobBuilder.prototype.__dataAsString = "";
	
	BlobBuilder.prototype.getBlob = function (contentType){
		var tmp = new Blob();
		tmp.__dataAsString = this.__dataAsString;
		tmp.size = this.__dataAsString.length;
		return tmp;
	};
	
	BlobBuilder.prototype.append = function (text, endings){
		// throws "FileException";
		this.__dataAsString += text;
	};
	/*
	BlobBuilder.prototype.append = function (blob) {
		
	};
	
	BlobBuilder.prototype.append = function (arryBuffer) {
		
	};*/
	
	///////////////////// FILEREADER INTERFACE ///////////////////////////////
	var WebinosFileReader;
	
	WebinosFileReader = function () {
		this.objectRef = Math.floor(Math.random()*101);
	};
	
	WebinosFileReader.prototype = WebinosService.prototype;
	
	WebinosFileReader.prototype.readAsText = function(blob, encoding) {
		var self = this;
		
		var rpc = webinos.rpc.createRPC("FileReader", "readFileAsString", arguments, Math.floor(Math.random()*101));

		webinos.rpc.executeRPC(rpc, function (result){
			if (result.data === 'undefined') return;
			var myObject = JSON.parse(result.data);
			if (self.onload !== 'undefined' && myObject.error == null){
				self.onload(myObject.result);
			}
			if (self.onerror !== 'undefined' && myObject.error != null){
				self.onerror(myObject.error);
			}
		});
	};
	
	///////////////////// FILESAVER INTERFACE ///////////////////////////////
	
	var WebinosFileSaver, WebinosFileSaverRetriever;
	
	WebinosFileSaverRetriever = function () {
		
	};
	
	WebinosFileSaverRetriever.prototype = WebinosService.prototype;
	
	WebinosFileSaverRetriever.prototype.saveAs = function (blob, filename) {
		
		var fileSaver = new WebinosFileSaver();
		
		var rpc = webinos.rpc.createRPC("FileSaver", "saveAs", arguments);
		rpc.objectRef = fileSaver.objectRef;
		
		webinos.rpc.registerObjectRef(fileSaver.objectRef , function (result){
		
			if (result.data === 'undefined') return;
			
			var myObject = JSON.parse(result);
			
			logObj(myObject, "FileSaver Response");
			
			if (fileSaver.onwriteend != null && myObject.method === 'FileSaver.onwriteend'){
				console.log("filesaver onwriteend");
				fileSaver.onwriteend();
				return;
			}
			if (fileSaver.onwritestart != null && myObject.method === 'FileSaver.onwritestart'){
				fileSaver.onwritestart();
				return;
			}
			if (fileSaver.onerror != null && myObject.method === 'FileSaver.onerror'){
				fileSaver.onerror(myObject.param[0]);
				return;
			}
			if (fileSaver.onwrite != null && myObject.method === 'FileSaver.onwrite'){
				fileSaver.onwrite();
				return;
			}
			if (fileSaver.onprogress != null && myObject.method === 'FileSaver.onprogress'){
				fileSaver.onprogress();
				return;
			}
			if (fileSaver.onabort != null && myObject.method === 'FileSaver.onabort'){
				fileSaver.onabort();
				return;
			}
		});
		webinos.rpc.executeRPC(rpc);

		return fileSaver;
	};
	
	WebinosFileSaver = function () {
		this.objectRef = Math.floor(Math.random()*101);
	};

	WebinosFileSaver.prototype.INIT = 0;
    WebinosFileSaver.prototype.WRITING = 1;
    WebinosFileSaver.prototype.DONE = 2;
    
	WebinosFileSaver.prototype.readyState = 0;
	
	WebinosFileSaver.prototype.abort = function () {
		
	};
	
	WebinosFileSaver.prototype.onwritestart = null;
	WebinosFileSaver.prototype.onprogress = null;
	WebinosFileSaver.prototype.onwrite = null;
	WebinosFileSaver.prototype.onabort = null;
	WebinosFileSaver.prototype.onerror = null;
	WebinosFileSaver.prototype.onwriteend = null;
	
	///////////////////// FILEWRITER INTERFACE ///////////////////////////////
	var WebinosFileWriter, WebinosFileWriterRetriever;
	
	WebinosFileWriterRetriever = function () {
		
	};
	
	WebinosFileWriterRetriever.prototype = WebinosService.prototype;
		
	WebinosFileWriterRetriever.prototype.writeAs = function (filename) {
		var fileWriter = new WebinosFileSaver();
		
		fileWriter.fileName =filename;
	
		webinos.rpc.registerObjectRef(fileWriter.objectRef , function (result){
		
			if (result.data === 'undefined') return;
			
			var myObject = JSON.parse(result);
			
			logObj(myObject, "myobject");
			
			
			if (fileWriter.onwriteend != null && myObject.method === 'FileWriter.onwriteend'){
				fileWriter.onwriteend();
				return;
			}
			if (fileWriter.onwritestart != null && myObject.method === 'FileWriter.onwritestart'){
				fileWriter.onwritestart();
				return;
			}
			if (fileWriter.onerror != null && myObject.method === 'FileWriter.onerror'){
				fileWriter.onerror(myObject.param[0]);
				return;
			}
			if (fileWriter.onwrite != null && myObject.method === 'FileWriter.onwrite'){
				fileWriter.onwrite();
				return;
			}
			if (fileWriter.onprogress != null && myObject.method === 'FileWriter.onprogress'){
				fileWriter.onprogress();
				return;
			}
			if (fileWriter.onabort != null && myObject.method === 'FileWriter.onabort'){
				fileWriter.onabort();
				return;
			}
		});
		return fileWriter;
	};
	
	WebinosFileWriter = function () {
		this.objectRef = Math.floor(Math.random()*101);
	};
	
	WebinosFileWriter.prototype = WebinosFileSaver.prototype;
	
	WebinosFileWriter.prototype.position = null;
	WebinosFileWriter.prototype.length = null;
	WebinosFileWriter.prototype.write = function (blob) {
		arguments[1] = this.fileName;
		var rpc = webinos.rpc.createRPC("FileWriter", "write", arguments);
		rpc.objectRef = this.objectRef;
		webinos.rpc.executeRPC(rpc);
	}
	WebinosFileWriter.prototype.seek = function (offset) {
	
	}
    
	WebinosFileWriter.prototype.truncate = function (size) {
		
	}
	
}());