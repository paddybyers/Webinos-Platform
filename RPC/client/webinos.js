(function() {

	
	channel = null;
	function write(text){
		if (channel != null){
			channel.send(text);
		}
		else{
			var toSend = text;
			createCommChannel(function (){
				channel.send(toSend);
			});
		}
	}
	
	/**
	 * Creates the socket communication channel
	 * for a locally hosted websocket server at port 8080
	 * for now this channel is used for sending RPC, later the webinos
	 * messaging/eventing system will be used
	 */
	function createCommChannel (successCB){
		try{
		channel  = new WebSocket('ws://127.0.0.1:8080');
		}catch(e){
			channel  = new MozWebSocket('ws://127.0.0.1:8080');
		}
		channel.onopen = function() {
			webinos.rpc.setWriter(write);
			if (typeof successCB === 'function') successCB();
		};
		channel.onmessage = function(ev) {
			webinos.rpc.handleMessage(ev.data);
		};
	}
	createCommChannel ();
	
	
	
	
	if (typeof webinos === 'undefined') webinos = {}; 
	
	
	

	
	///////////////////// WEBINOS INTERNAL COMMUNICATION INTERFACE ///////////////////////////////

	
	function logObj(obj, name){
		for (var myKey in obj){
			console.log(name + "["+myKey +"] = "+obj[myKey]);
			if (typeof obj[myKey] == 'object') logObj(obj[myKey], name + "." + myKey);
		}
	}

	///////////////////// WEBINOS DISCOVERY INTERFACE ///////////////////////////////
	
	webinos.ServiceDiscovery = {};
	webinos.ServiceDiscovery.registeredServices = 0;
	
	webinos.ServiceDiscovery.findServices = function (type, callback) {
		if (type == "FileReader"){
			var tmp = new WebinosFileReader();
			//some additional meta data that may be needed for a "real"
			//discovery service
			tmp.origin = 'ws://127.0.0.1:8080';
			callback.onFound(tmp);
			webinos.ServiceDiscovery.registeredServices++;
			return;
		}
		if (type == "FileSaver"){
			var tmp = new WebinosFileSaverRetriever();
			tmp.origin = 'ws://127.0.0.1:8080';
			webinos.ServiceDiscovery.registeredServices++;
			callback.onFound(tmp);
			return;
		}
		if (type == "FileWriter"){
			var tmp = new WebinosFileWriterRetriever();
			tmp.origin = 'ws://127.0.0.1:8080';
			webinos.ServiceDiscovery.registeredServices++;
			callback.onFound(tmp);
			return;
		}
		if (type == "BlobBuilder"){
			var tmp = new BlobBuilder();
			tmp.origin = 'ws://127.0.0.1:8080';
			webinos.ServiceDiscovery.registeredServices++;
			callback.onFound(tmp);
			return;
		}
		
		if (type == "Test"){
			var tmp = new TestModule();
			tmp.origin = 'ws://127.0.0.1:8080';
			webinos.ServiceDiscovery.registeredServices++;
			callback.onFound(tmp);
			return;
		}
		
		if (type == "Vehicle"){
			var tmp = new Vehicle();
			tmp.origin = 'ws://127.0.0.1:8080';
			webinos.ServiceDiscovery.registeredServices++;
			callback.onFound(tmp);
			return;
		}

		if (type == "Geolocation"){	// 'Geolocation' is registered rpc service name
			var tmp = new webinosGeolocation();  // see below for geolocation api definition
			tmp.origin = 'ws://127.0.0.1:8080';
			webinos.ServiceDiscovery.registeredServices++;
			callback.onFound(tmp);
			return;
		}
		
		if (type == 'RemoteFileSystem') {
			webinos.ServiceDiscovery.registeredServices++;
			
			return void (callback.onFound(new webinos.file.RemoteFileSystem()));
		}
		
		if (type == 'Sensors') {
			var sensor = new Sensor();
			sensor.api = "SensorAPI" + Math.floor(Math.random()*101);
			callback.onFound(sensor);
			return;
		}
		
		if (type == "UserProfileInt"){
			var tmp = new UserProfileIntModule();
			tmp.origin = 'ws://127.0.0.1:8080';
			webinos.ServiceDiscovery.registeredServices++;
			callback.onFound(tmp);
			return;
		}
		
		
		
	};
	
	///////////////////// WEBINOS SERVICE INTERFACE ///////////////////////////////
	
	WebinosService = function () {
		this.id = Math.floor(Math.random()*101);
		
	};
	
	WebinosService.prototype.state = "";
    

	WebinosService.prototype.api = "";
    

	WebinosService.prototype.id = "";
    

	WebinosService.prototype.displayName = "";
    

	WebinosService.prototype.description = "";
    

	WebinosService.prototype.icon = "";

	
	
	WebinosService.prototype.bind = function(success) {
		if (channel == null){ 
			var x = success;
			createCommChannel(function () {
				x();
			});
			
		}
		else{
			success();
		}
	};
	
	WebinosService.prototype.unbind = function() {
		webinos.ServiceDiscovery.registeredServices--;
		if (channel != null && webinos.ServiceDiscovery.registeredServices > 0) {
			channel.close();
			channel = null;
		}
	};

	
	///////////////////// BLOB INTERFACE ///////////////////////////////
	
    var Blob;
    
    Blob = function () {
    	
    };
        
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
	
	//TODO deal with endings
	//TODO add support for ArrayBuffer as input argument
	BlobBuilder.prototype.append = function (dataToAppend, endings){
		// throws "FileException";
		
		if (typeof dataToAppend === 'string'){
			this.__dataAsString += dataToAppend;
		}
		else{
			if (typeof dataToAppend === 'Object' && dataToAppend != null) {
					if (typeof dataToAppend.__dataAsString !== 'undefined'){
						this.__dataAsString += dataToAppend.__dataAsString;
					}
			}
		}
		
		if (typeof endings !== 'undefined'){
			if (endings === 'native'){
				try {
					//TODO here the remote OS should be checked
					if (navigator.appVersion.indexOf("Win")!=-1){
						this.__dataAsString = 
							this.__dataAsString.replace(/\n/g,'\r\n');
					}
					else {
						this.__dataAsString = 
							this.__dataAsString.replace(/\r\n/g,'\n');
					}
				}
				catch (err) {
					console.log(err);
				}
			}
		}
		
	};
	
	///////////////////// FILEREADER INTERFACE ///////////////////////////////
	var WebinosFileReader;
	
	WebinosFileReader = function () {
		this.objectRef = Math.floor(Math.random()*101);
	};
	
	WebinosFileReader.prototype = WebinosService.prototype;
	
	WebinosFileReader.prototype.readAsText = function(blob, encoding) {
		var self = this;
		
		var rpc = webinos.rpc.createRPC("FileReader", "readFileAsString", arguments);

		webinos.rpc.executeRPC(
				rpc, 
				function (result){
					self.onload(result);
				},
				function (error){
					self.onerror(error);
				}
		);
	};
	
	WebinosFileReader.prototype.readAsDataURL = function () {
		
	};
	
	WebinosFileReader.prototype.readAsBinaryString = function (fileBlob, encoding) {
		this.result = null;
		this.readyState = this.EMPTY;
		
		//any errors
		
		this.readyState = this.LOADING;
	};
	
	WebinosFileReader.prototype.abort = function (file) {
		
		
	};
	
	  // states
	WebinosFileReader.prototype.EMPTY = 0;
	WebinosFileReader.prototype.LOADING = 1;
	WebinosFileReader.prototype.DONE = 2;
	  
	WebinosFileReader.prototype.readyState = 0;

	WebinosFileReader.prototype.result = null;
	  
	WebinosFileReader.prototype.error = null;
	
	///////////////////// FILESAVER INTERFACE ///////////////////////////////
	
	var WebinosFileSaver, WebinosFileSaverRetriever;
	
	WebinosFileSaverRetriever = function () {
		
	};
	
	WebinosFileSaverRetriever.prototype = WebinosService.prototype;
	
	WebinosFileSaverRetriever.prototype.saveAs = function (blob, filename) {
		
		var fileSaver = new WebinosFileSaver();
		
		callback = {};
		callback.onwriteend = function (params, successCallback, errorCallback, objectRef) {
			if (fileSaver.onwriteend != null){
				fileSaver.readyState = fileWriter.DONE;
				fileSaver.onwriteend();
			}
		};
		callback.onwritestart = function (params, successCallback, errorCallback, objectRef) {
			if (fileSaver.onwritestart != null){
				fileSaver.onwritestart();
				fileSaver.readyState = fileWriter.WRITING;
			}
		};
		callback.onerror = function (params, successCallback, errorCallback, objectRef) {
			if (fileSaver.onerror != null){
				fileSaver.onerror(params[0]);
				fileSaver.readyState = fileWriter.DONE;
			}
		};
		callback.onwrite = function (params, successCallback, errorCallback, objectRef) {
			if (fileSaver.onwrite != null){
				fileSaver.onwrite();
			}
		};
		callback.onprogress = function (params, successCallback, errorCallback, objectRef) {
			if (fileSaver.onprogress != null){
				fileSaver.onprogress();
			}
		};
		callback.onabort = function (params, successCallback, errorCallback, objectRef) {
			if (fileSaver.onabort != null){
				fileSaver.onabort();
				fileSaver.readyState = fileWriter.DONE;
			}
		};
		webinos.rpc.registerObject(fileSaver.objectRef , callback);
		
		var rpc = webinos.rpc.createRPC("FileSaver", "saveAs", arguments);
		rpc.fromObjectRef = fileSaver.objectRef;
				
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
		var fileWriter = new WebinosFileWriter();
		
		fileWriter.fileName =filename;
		
		callback = {};
		callback.onwriteend = function (params, successCallback, errorCallback, objectRef) {
			if (fileWriter.onwriteend != null){
				fileWriter.readyState = fileWriter.DONE;
				fileWriter.onwriteend();
			}
		};
		callback.onwritestart = function (params, successCallback, errorCallback, objectRef) {
			if (fileWriter.onwritestart != null){
				fileWriter.onwritestart();
				fileWriter.readyState = fileWriter.WRITING;
			}
		};
		callback.onerror = function (params, successCallback, errorCallback, objectRef) {
			if (fileWriter.onerror != null){
				fileWriter.onerror(params[0]);
				fileWriter.readyState = fileWriter.DONE;
			}
		};
		callback.onwrite = function (params, successCallback, errorCallback, objectRef) {
			if (fileWriter.onwrite != null){
				fileWriter.onwrite();
			}
		};
		callback.onprogress = function (params, successCallback, errorCallback, objectRef) {
			if (fileWriter.onprogress != null){
				fileWriter.onprogress();
			}
		};
		callback.onabort = function (params, successCallback, errorCallback, objectRef) {
			if (fileWriter.onabort != null){
				fileWriter.onabort();
				fileWriter.readyState = fileWriter.DONE;
			}
		};
		webinos.rpc.registerObject(fileWriter.objectRef , callback);
		
		return fileWriter;
	};
	
	WebinosFileWriter = function () {
		this.objectRef = Math.floor(Math.random()*101);
	};
	
	WebinosFileWriter.prototype = WebinosFileSaver.prototype;
	
	WebinosFileWriter.prototype.seek = 0;
	
	WebinosFileWriter.prototype.position = 0;
	WebinosFileWriter.prototype.length = 0;
	WebinosFileWriter.prototype.write = function (blob) {
		if (this.readyState == this.WRITING) throw ("INVALID_STATE_ERR");
		
		arguments[1] = this.fileName;
		var rpc = webinos.rpc.createRPC("FileWriter", "write", arguments);
		rpc.fromObjectRef = this.objectRef;
		webinos.rpc.executeRPC(rpc);
	};
	WebinosFileWriter.prototype.seek = function (offset) {
		if (this.readyState == this.WRITING) throw ("INVALID_STATE_ERR");
	};
    
	WebinosFileWriter.prototype.truncate = function (size) {
		if (this.readyState == this.WRITING
				|| typeof size === 'undefined'
				) throw ("INVALID_STATE_ERR");
		
		this.readyState = this.WRITING;
		
		arguments[1] = this.fileName;
		var rpc = webinos.rpc.createRPC("FileWriter", "truncate", arguments);
		rpc.fromObjectRef = this.objectRef;
		webinos.rpc.executeRPC(rpc);
	};
	
	///////////////////// VEHICLE INTERFACE ///////////////////////////////
	var Vehicle;
	
	var _referenceMapping = new Array();
	var _vehicleDataIds = new Array('climate-all', 'climate-driver', 'climate-passenger-front', 'climate-passenger-rear-left','passenger-rear-right','lights-fog-front','lights-fog-rear','lights-signal-right','lights-signal-warn','lights-parking-hibeam','lights-head','lights-head','wiper-front-wash','wiper-rear-wash','wiper-automatic','wiper-front-once','wiper-rear-once','wiper-front-level1','wiper-front-level2','destination-reached','destination-changed','destination-cancelled','parksensors-front','parksensors-rear','shift','tripcomputer'); 
	
	
	Vehicle = function(){} ;
	Vehicle.prototype = WebinosService.prototype;
	Vehicle.prototype.get = function(vehicleDataId, callOnSuccess, callOnError){	
		
		
		arguments[0] = vehicleDataId;
		var rpc = webinos.rpc.createRPC("Vehicle", "get", arguments);
		
		webinos.rpc.executeRPC(rpc,
			function(result){
					callOnSuccess(result);
				},
			function(error){
					callOnError(error);
				}
		);
		
		
		};
	Vehicle.prototype.addEventListener = function(vehicleDataId, eventHandler, capture){
		
				
		if(_vehicleDataIds.indexOf(vehicleDataId) != -1){	
			var rpc = webinos.rpc.createRPC("Vehicle", "addEventListener", vehicleDataId);
			rpc.fromObjectRef = Math.floor(Math.random()*101); //random object ID	
			
			_referenceMapping.push([rpc.fromObjectRef, eventHandler]);
			console.log('# of references' + _referenceMapping.length);
			callback = {};
			callback.onEvent = function (vehicleEvent) {
				eventHandler(vehicleEvent);
			};
			webinos.rpc.registerObject(rpc.fromObjectRef , callback);
			webinos.rpc.executeRPC(rpc);
		}else{
			console.log(vehicleDataId + ' not found');	
		}
	
	};
		
	Vehicle.prototype.removeEventListener = function(vehicleDataId, eventHandler, capture){
		var refToBeDeleted = null;
		for(i = 0; i < _referenceMapping.length; i++){
			console.log("Reference" + i + ": " + _referenceMapping[i][0]);
			console.log("Handler" + i + ": " + _referenceMapping[i][1]);
			if(_referenceMapping[i][1] == eventHandler){
					refToBeDeleted = _referenceMapping[i][0];
					console.log("ListenerObject to be removed ref#" + refToBeDeleted);					
					var rpc = webinos.rpc.createRPC("Vehicle", "removeEventListener", refToBeDeleted);
					webinos.rpc.executeRPC(rpc,
					function(result){
						callOnSuccess(result);
					},
					function(error){
						callOnError(error);
					}
		);
					break;			
			}	
		}
	};
	Vehicle.prototype.requestGuidance = function(successCB, errorCB, destinations){
		console.log('request guidance');
		
	};
	Vehicle.prototype.findDestination = function(destinationCB, errorCB, search){
		console.log('Find Destination...');
	};

	///////////////////// GEOLOCATION INTERFACE ///////////////////////////////
	
	var webinosGeolocation;

	webinosGeolocation = function () {
		// this.objectRef = Math.floor(Math.random()*101);
	};

	webinosGeolocation.prototype = WebinosService.prototype;

	webinosGeolocation.prototype.getCurrentPosition = function (PositionCB, PositionErrorCB, PositionOptions) {  // according to webinos api definition 
			var rpc = webinos.rpc.createRPC("Geolocation", "getCurrentPosition", PositionOptions); // RPC service name, function, position options
			webinos.rpc.executeRPC(rpc,
					function (position){  // this is called on success
						PositionCB(position); 
					},
					function (error){ // this is called on error
						PositionErrorCB(error);
					}
			);
		};

	webinosGeolocation.prototype.watchPosition = function (PositionCB, PositionErrorCB, PositionOptions) {   // not yet working
			var rpc = webinos.rpc.createRPC("Geolocation", "watchPosition", PositionOptions); // RPC service name, function, options
			// rpc.fromObjectRef = Math.floor(Math.random()*101); //random object ID	
			/* /create the result callback
			callback = {};
			callback.locationUpdate = function (params, successCallback, errorCallback, objectRef) {
				alert("watchPosition update: " + JSON.stringify(params));
				PositionCB(params);
			};
			
			//register the object as being remotely accessible
			webinos.rpc.registerObject(rpc.fromObjectRef, callback);			
			*/
			var watchId = webinos.rpc.executeRPC(rpc,
					function (position){  // this is called on success
						PositionCB(position); 
					},
					function (error){ // this is called on error
						PositionErrorCB(error);
					}
			);
			return(watchId);
		};

	webinosGeolocation.prototype.clearWatch = function (watchId) {   // not yet working
			var rpc = webinos.rpc.createRPC("Geolocation", "clearWatch", watchId); 
			webinos.rpc.executeRPC(rpc,
					function (result){  // this is called on success
						alert("successfully cleared watch");
					},
					function (error){ // this is called on error
						alert("error upon clearWatch: " + error);
					}
			);
		};
	
	
}());