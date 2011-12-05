(function() {
	if (typeof webinos === "undefined") webinos = {};
	var channel = null;
	var sessionid = null;
	var pzpId, pzhId, connectedPzp, connectdPzh;
	
	var findServiceBindAddress = null;
	
	webinos.message_send = function(to, rpc, successCB, errorCB) {
		var type, id = 0;	
		if(rpc.type !== undefined && rpc.type === "prop") {
			type = "prop";
			rpc = rpc.payload;	
		} else {
			type = "JSONRPC";
		}
		if(rpc.fromObjectRef === undefined)
			rpc.fromObjectRef = Math.floor(Math.random()*1001);
		if(rpc.id === undefined)
			rpc.id = Math.floor(Math.random()*1001);
		
		if(findServiceBindAddress !== null && (to === "" || to !== findServiceBindAddress)) {
			to = findServiceBindAddress;
		}
		if(typeof rpc.method !== undefined && rpc.method === 'ServiceDiscovery.findServices')
			id = rpc.params[2];
			
		var message = {"type": type, 
			"id": id, 
			"from": sessionid, 
			"to": to, 
			"resp_to": sessionid, 
			"payload": rpc
			};
		if(rpc.register !== "undefined" && rpc.register === true) {
			channel.send(JSON.stringify(rpc));
		} else {
			webinos.message.createMessageId(message, successCB, errorCB);
			console.log('WebSocket Client: Message Sent');
			console.log(message);
			channel.send(JSON.stringify(message));
		}
	}
	
	webinos.getSessionId = function() {
		return sessionid;
	}
	webinos.getPZPId = function() {
		return pzpid;
	}
	webinos.getPZHId = function() {
		return pzhid;
	}
	webinos.getOtherPZP = function() {
		return otherpzp;
	}
	webinos.findServiceBindAddress = function(address) {
		if(typeof address !== "undefined")
			findServiceBindAddress = address;
		return findServiceBindAddress;
	}
	
	/**
	 * Creates the socket communication channel
	 * for a locally hosted websocket server at port 8080
	 * for now this channel is used for sending RPC, later the webinos
	 * messaging/eventing system will be used
	 */
	 function createCommChannel(successCB) {
		try{
			var port = parseInt(location.port) + 1;
			if (isNaN(port)) port = 81;
			channel  = new WebSocket('ws://'+window.location.hostname+':'+port);
		} catch(e) {
			channel  = new MozWebSocket('ws://'+window.location.hostname+':'+port);
		}
				
		channel.onmessage = function(ev) {
			console.log('WebSocket Client: Message Received');
			console.log(JSON.parse(ev.data));
			var data = JSON.parse(ev.data);
			if(data.type === "prop" && data.payload.status === 'registeredBrowser') {
				sessionid = data.to;
				pzpId = data.from;				
				pzhId = data.payload.message.pzhId;
				connectedPzp = data.payload.message.connectedPzp;
				connectedPzh = data.payload.message.connectedPzh;
				$(".pzh_pzp_list").empty();
				$("<optgroup label = 'PZP' id ='pzp_list' >").appendTo("#pzh_pzp_list");
				var i;
				for(i =0; i < connectedPzp.length; i++) {
					$("<option value=" + connectedPzp[i] + " >" +connectedPzp[i] + "</option>").appendTo("#pzh_pzp_list");					
				}
				$("<option value="+pzpId+" >" + pzpId+ "</option>").appendTo("#pzh_pzp_list");						
				$("</optgroup>").appendTo("#pzh_pzp_list");
				$("<optgroup label = 'PZH' id ='pzh_list' >").appendTo("#pzh_pzp_list");
				for(i =0; i < connectedPzh.length; i++) {
					$("<option value=" + connectedPzh[i] + " >" + + "</option>").appendTo("#pzh_pzp_list");					
				}
				$("<option value="+pzhId+" >" + pzhId+ "</option>").appendTo("#pzh_pzp_list");						
				$("</optgroup>").appendTo("#pzh_pzp_list");
				webinos.message.setGetOwnId(sessionid);
				
				var msg = webinos.message.registerSender(sessionid , pzpId);
				webinos.message_send(pzpId, msg, null, null);
			} else if(data.type === "prop" && data.payload.status === "info") {
				$('#message').append('<li>'+data.payload.message+'</li>');
			} else if(data.type === "prop" && data.payload.status === "update") {
				if(typeof data.payload.message.pzp !== "undefined")
					$("<option value=" + data.payload.message.pzp + " >" +data.payload.message.pzp + "</option>").appendTo("#pzp_list");
				else
					$("<option value=" + data.payload.message.pzh + " >" +data.payload.message.pzh + "</option>").appendTo("#pzh_list");

			} else {
				webinos.message.setGetOwnId(sessionid);
				webinos.message.setObjectRef(this);
				webinos.message.setSendMessage(webinos.message_send_messaging);
				webinos.message.onMessageReceived(data, data.to);
			}
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
	
	webinos.ServiceDiscovery.findServices = function (address, serviceType, callback) {
		findServiceBindAddress = address;
		// pure local services..
		if (serviceType == "BlobBuilder"){
			var tmp = new BlobBuilder();
			webinos.ServiceDiscovery.registeredServices++;
			callback.onFound(tmp);
			return;
		}

		function success(params) {
			var baseServiceObj = params;
			
			console.log("servicedisco: service found.");
			$('#message').append('<li> Found Service: '+baseServiceObj.api+'</li>');				
			
			var typeMap = {};
			if (typeof webinos.file !== 'undefined' && typeof webinos.file.LocalFileSystem !== 'undefined')
				typeMap['http://webinos.org/api/file'] = webinos.file.LocalFileSystem;
			if (typeof WebinosFileReader !== 'undefined') typeMap['http://www.w3.org/ns/api-perms/file.read'] = WebinosFileReader;
			if (typeof WebinosFileSaverRetriever !== 'undefined') typeMap['http://www.w3.org/ns/api-perms/file.save'] = WebinosFileSaverRetriever;
			if (typeof WebinosFileWriterRetriever !== 'undefined') typeMap['http://www.w3.org/ns/api-perms/file.write'] = WebinosFileWriterRetriever;
			if (typeof TestModule !== 'undefined') typeMap['http://webinos.org/api/test'] = TestModule;
			if (typeof WebinosGeolocation !== 'undefined') typeMap['http://www.w3.org/ns/api-perms/geolocation'] = WebinosGeolocation;
			if (typeof Vehicle !== 'undefined') typeMap['http://webinos.org/api/vehicle'] = Vehicle;
			if (typeof EventsModule !== 'undefined') typeMap['http://webinos.org/api/events'] = EventsModule;
			if (typeof Sensor !== 'undefined') typeMap['http://webinos.org/api/sensors'] = Sensor;
			if (typeof UserProfileIntModule !== 'undefined') typeMap['UserProfileInt'] = UserProfileIntModule;
			if (typeof TVManager !== 'undefined') typeMap['http://webinos.org/api/tv'] = TVManager;
			if (typeof DeviceStatusManager !== 'undefined') typeMap['http://wacapps.net/api/devicestatus'] = DeviceStatusManager;
			if (typeof Contacts !== 'undefined') typeMap['http://www.w3.org/ns/api-perms/contacts'] = Contacts;
			if (typeof Context !== 'undefined') typeMap['http://webinos.org/api/context'] = Context;
			if (typeof BluetoothManager !== 'undefined') typeMap['http://webinos.org/manager/discovery/bluetooth'] = BluetoothManager;
			// elevate baseServiceObj to usable local WebinosService object
			
//			if (baseServiceObj.api === 'http://webinos.org/api/sensors.temperature'){
//				var tmp = new typeMap['http://webinos.org/api/sensors'](baseServiceObj);
//			}
//			else{
				var tmp = new typeMap[baseServiceObj.api](baseServiceObj);
//			}
			webinos.ServiceDiscovery.registeredServices++;
			callback.onFound(tmp);
		}
		
		var id = Math.floor(Math.random()*1001);
		var rpc = webinos.rpc.createRPC("ServiceDiscovery", "findServices", [serviceType, sessionid, id]);
		rpc.fromObjectRef = Math.floor(Math.random()*101); //random object ID
		
		var callback2 = new RPCWebinosService({api:rpc.fromObjectRef});
		callback2.onservicefound = function (params, successCallback, errorCallback, objectRef) {
			// params
			success(params);
		};
		webinos.rpc.registerCallbackObject(callback2);
		
		webinos.message_send(findServiceBindAddress, rpc, callback2);
		
		return;
	};
	
	///////////////////// WEBINOS SERVICE INTERFACE ///////////////////////////////
	
	// TODO decide what to do with this class.
	WebinosService = function (obj) {
		this.base = RPCWebinosService;
		this.base(obj);
		
//		this.id = Math.floor(Math.random()*101);
	};
	WebinosService.prototype = new RPCWebinosService;
	
	WebinosService.prototype.state = "";
    

//	WebinosService.prototype.api = "";
    

//	WebinosService.prototype.id = "";
    

//	WebinosService.prototype.displayName = "";
    

//	WebinosService.prototype.description = "";
    

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
	
	WebinosFileReader = function (obj) {
		this.base = WebinosService;
		this.base(obj);
		
		this.objectRef = Math.floor(Math.random()*101);
	};
	WebinosFileReader.prototype = new WebinosService;
	
	WebinosFileReader.prototype.readAsText = function(blob, encoding) {
		var self = this;
		
		var rpc = webinos.rpc.createRPC(this, "readFileAsString", arguments);

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
	WebinosFileSaverRetriever = function(obj) {
		this.base = WebinosService;
		this.base(obj);
		
		this.objRefFileSaverRetr = obj;
	};
	
	WebinosFileSaverRetriever.prototype = new WebinosService;
	
	WebinosFileSaverRetriever.prototype.saveAs = function (blob, filename) {
		
		var fileSaver = new WebinosFileSaver(this.objRefFileSaverRetr);
		
		var callback = new RPCWebinosService({api:fileSaver.objectRef});
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
		webinos.rpc.registerCallbackObject(callback);
		
		var rpc = webinos.rpc.createRPC(this, "saveAs", arguments);
		rpc.fromObjectRef = fileSaver.objectRef;
				
		webinos.rpc.executeRPC(rpc);
		
		return fileSaver;
	};
	
	WebinosFileSaver = function (obj) {
		this.base = WebinosService;
		this.base(obj);
		
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
	WebinosFileWriterRetriever = function(obj) {
		this.base = WebinosService;
		this.base(obj);
		
		this.objRefFileWriterRetr = obj;
	};
	
	WebinosFileWriterRetriever.prototype = new WebinosService;
		
	WebinosFileWriterRetriever.prototype.writeAs = function (filename) {
		var fileWriter = new WebinosFileWriter(this.objRefFileWriterRetr);
		
		fileWriter.fileName =filename;
		
		var callback = new RPCWebinosService({api:fileWriter.objectRef});
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
		webinos.rpc.registerCallbackObject(callback);
		
		return fileWriter;
	};
	
	WebinosFileWriter = function (obj) {
		this.base = WebinosService;
		this.base(obj);
		this.objectRef = Math.floor(Math.random()*101);
	};
	
	WebinosFileWriter.prototype = WebinosFileSaver.prototype;
	
	WebinosFileWriter.prototype.seek = 0;
	
	WebinosFileWriter.prototype.position = 0;
	WebinosFileWriter.prototype.length = 0;
	WebinosFileWriter.prototype.write = function (blob) {
		if (this.readyState == this.WRITING) throw ("INVALID_STATE_ERR");
		
		arguments[1] = this.fileName;
		var rpc = webinos.rpc.createRPC(this, "write", arguments);
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
		var rpc = webinos.rpc.createRPC(this, "truncate", arguments);
		rpc.fromObjectRef = this.objectRef;
		webinos.rpc.executeRPC(rpc);
	};
	
	///////////////////// VEHICLE INTERFACE ///////////////////////////////
	var Vehicle;
	
	var _referenceMapping = new Array();
	var _vehicleDataIds = new Array('climate-all', 'climate-driver', 'climate-passenger-front', 'climate-passenger-rear-left','passenger-rear-right','lights-fog-front','lights-fog-rear','lights-signal-right','lights-signal-warn','lights-parking-hibeam','lights-head','lights-head','wiper-front-wash','wiper-rear-wash','wiper-automatic','wiper-front-once','wiper-rear-once','wiper-front-level1','wiper-front-level2','destination-reached','destination-changed','destination-cancelled','parksensors-front','parksensors-rear','shift','tripcomputer'); 
	
	
	Vehicle = function(obj) {
		this.base = WebinosService;
		this.base(obj);
	};
	Vehicle.prototype = new WebinosService;
	
	Vehicle.prototype.get = function(vehicleDataId, callOnSuccess, callOnError) {	
		arguments[0] = vehicleDataId;
		var rpc = webinos.rpc.createRPC(this, "get", arguments);
		
		webinos.rpc.executeRPC(rpc,
			function(result){
					callOnSuccess(result);
			},
			function(error){
					callOnError(error);
			}
		);
	};
	
	Vehicle.prototype.addEventListener = function(vehicleDataId, eventHandler, capture) {
		if(_vehicleDataIds.indexOf(vehicleDataId) != -1){	
			var rpc = webinos.rpc.createRPC(this, "addEventListener", vehicleDataId);
			rpc.fromObjectRef = Math.floor(Math.random()*101); //random object ID	
			
			_referenceMapping.push([rpc.fromObjectRef, eventHandler]);
			console.log('# of references' + _referenceMapping.length);
			
			var callback = new RPCWebinosService({api:rpc.fromObjectRef});
			callback.onEvent = function (vehicleEvent) {
				eventHandler(vehicleEvent);
			};
			webinos.rpc.registerCallbackObject(callback);
			
			webinos.rpc.executeRPC(rpc);
		}else{
			console.log(vehicleDataId + ' not found');	
		}
	
	};
		
	Vehicle.prototype.removeEventListener = function(vehicleDataId, eventHandler, capture){
		var refToBeDeleted = null;
		for(var i = 0; i < _referenceMapping.length; i++){
			console.log("Reference" + i + ": " + _referenceMapping[i][0]);
			console.log("Handler" + i + ": " + _referenceMapping[i][1]);
			if(_referenceMapping[i][1] == eventHandler){
					var arguments = new Array();
					arguments[0] = _referenceMapping[i][0];
					arguments[1] = vehicleDataId;
					
					
					console.log("ListenerObject to be removed ref#" + refToBeDeleted);					
					var rpc = webinos.rpc.createRPC(this, "removeEventListener", arguments);
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
	
	 ///////////////////// CONTEXT INTERFACE ///////////////////////////////
  var Context;
  
  Context = function(obj) {
    this.base = WebinosService;
    this.base(obj);
  };
  Context.prototype = new WebinosService;
  
  Context.prototype.find = function(what, callOnSuccess, callOnError) { 
    arguments[0] = what;
    var rpc = webinos.rpc.createRPC(this, "find", arguments);
    
    webinos.rpc.executeRPC(rpc,
      function(result){
          callOnSuccess(result);
      },
      function(error){
          callOnError(error);
      }
    );
  };
  
 
	///////////////////// GEOLOCATION INTERFACE ///////////////////////////////
	
	var WebinosGeolocation;

	WebinosGeolocation = function (obj) {
		this.base = WebinosService;
		this.base(obj);
	};

	WebinosGeolocation.prototype = new WebinosService;

	WebinosGeolocation.prototype.getCurrentPosition = function (PositionCB, PositionErrorCB, PositionOptions) {  // according to webinos api definition 
			var rpc = webinos.rpc.createRPC(this, "getCurrentPosition", PositionOptions); // RPC service name, function, position options
			webinos.rpc.executeRPC(rpc,
					function (position){  // this is called on success
						PositionCB(position); 
					},
					function (error){ // this is called on error
						PositionErrorCB(error);
					}
			);
		};

	WebinosGeolocation.prototype.watchPosition = function (PositionCB, PositionErrorCB, PositionOptions) {   // not yet working
			var rpc = webinos.rpc.createRPC(this, "watchPosition", PositionOptions); // RPC service name, function, options
			rpc.fromObjectRef = Math.floor(Math.random()*101); //random object ID	

			var callback = new RPCWebinosService({api:rpc.fromObjectRef});
			callback.onEvent = function (position) {
				console.log(position);
				PositionCB(position[0]); 
			};
			webinos.rpc.registerCallbackObject(callback);
			
			var watchId = webinos.rpc.executeRPC(rpc);
			
			return(watchId);
		};

	WebinosGeolocation.prototype.clearWatch = function (watchId) {   // not yet working
			var rpc = webinos.rpc.createRPC(this, "clearWatch", watchId); 
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
