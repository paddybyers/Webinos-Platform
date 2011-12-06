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
            console.log('creating callback');
            
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
				webinos.message_send(pzpId, msg);
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
			
			if (baseServiceObj.api === 'http://webinos.org/api/sensors.temperature'){
				var tmp = new typeMap['http://webinos.org/api/sensors'](baseServiceObj);
			}
			else{
				var tmp = new typeMap[baseServiceObj.api](baseServiceObj);
			}

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
		
		webinos.message_send(findServiceBindAddress, rpc);
		
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
  
}());
