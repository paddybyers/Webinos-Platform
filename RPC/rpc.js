//This RPC implementation should be compliant to JSON RPC 2.0
//as specified @ http://groups.google.com/group/json-rpc/web/json-rpc-2-0

(function() {
	if (typeof module !== 'undefined')
		var utils = require('./webinos.utils.js');
	else
		var utils = webinos.utils;

	utils.rpc = {
		request: function (service, method, successCallback, errorCallback) {
			return function () {
				var params = Array.prototype.slice.call(arguments);
				var message = webinos.rpc.createRPC(service, method, params);
				
				webinos.rpc.executeRPC(message, utils.callback(successCallback, this), utils.callback(errorCallback, this));
			}
		}
	};


write = null;

if (typeof webinos === 'undefined') webinos = {};
webinos.rpc = {};
webinos.rpc.awaitingResponse = {};
webinos.rpc.objects = {};
webinos.rpc.responseToMapping = [];


function logObj(obj, name){
	for (var myKey in obj){
		console.log(name + "["+myKey +"] = "+obj[myKey]);
		if (typeof obj[myKey] == 'object') logObj(obj[myKey], name + "." + myKey);
	}
}

/**
 * Sets the writer that should be used to write the stringified JSON RPC request.
 */
webinos.rpc.setWriter = function (writer){
	write = writer;
};

/**
 * Handles a new JSON RPC message (as string)
 */
webinos.rpc.handleMessage = function (message, responseto){
	console.log("New websocket packet");
	console.log("Message" + message);
	console.log("Response to" + responseto);
	var myObject = JSON.parse(message);
	logObj(myObject, "rpc");
	
	//received message is RPC request
	if (typeof myObject.method !== 'undefined' && myObject.method != null) {
		var idx = myObject.method.lastIndexOf('.');
		var service = myObject.method.substring(0, idx);
		var method = myObject.method.substring(idx + 1);
		var serviceId = undefined;
		idx = service.indexOf('@');
		if (idx !== -1) {
			var serviceIdRest = service.substring(idx + 1);
			service = service.substring(0, idx);
			var idx2 = serviceIdRest.indexOf('.');
			if (idx2 !== -1) {
				serviceId = serviceIdRest.substring(0, idx2);
			} else {
				serviceId = serviceIdRest;
			}
		}
		//TODO send back error if service and method is not webinos style
		
		if (typeof service !== 'undefined'){
			console.log("Got message to invoke " + method + " on " + service + (serviceId ? "@" + serviceId : "") +" with params: " + myObject.params[0] );
		
			var receiverObjs = webinos.rpc.objects[service];
			if (!receiverObjs)
				receiverObjs = [];
			var filteredRO = receiverObjs.filter(function(el, idx, array) {
				return el.id === serviceId;
			});
			var includingObject = filteredRO[0]; // what if the array is empty? TODO
			if (!includingObject) includingObject = receiverObjs[0]; // failsafe for line above. what if the array is empty? TODO
			
			//enable functions bound to attributes in nested objects, TODO
			idx = myObject.method.lastIndexOf('.');
			var methodPathParts = myObject.method.substring(0, idx);
			methodPathParts = methodPathParts.split('.');
			for (var pIx = 0; pIx<methodPathParts.length; pIx++) {
				if (methodPathParts[pIx] && methodPathParts[pIx].indexOf('@') >= 0) continue;
				if (methodPathParts[pIx] && includingObject[methodPathParts[pIx]]) {
					includingObject = includingObject[methodPathParts[pIx]];
				}
			}
			
			//if (typeof webinos.rpc.objects[service] === 'object'){
			if (typeof includingObject === 'object'){
				id = myObject.id;
				
				if (typeof myObject.fromObjectRef !== 'undefined' && myObject.fromObjectRef != null) {
				
					webinos.rpc.responseToMapping[myObject.fromObjectRef] = responseto;
				
					//webinos.rpc.objects[service][method](
					includingObject[method](
						myObject.params, 
						function (result) {
							if (typeof id === 'undefined') return;
							var res = {};
							rpc.jsonrpc = "2.0";
							res.result = result;
							res.id = id;						
							webinos.rpc.executeRPC(res, responseto);
						},
						function (error){
							if (typeof id === 'undefined') return;
							var res = {};
							rpc.jsonrpc = "2.0";
							res.error = {};
							res.error.data = error;
							res.error.code = 32000;  //webinos specific error code representing that an API specific error occured
							res.error.message = "Method Invocation returned with error";
							res.id = id;
							webinos.rpc.executeRPC(res, responseto);
						}, 
						myObject.fromObjectRef
					);
				}
				else {
					//webinos.rpc.objects[service][method](
					includingObject[method](
						myObject.params, 
						function (result) {
							if (typeof id === 'undefined') return;
							var res = {};
							res.jsonrpc = "2.0";
							res.result = result;
							res.id = id;
							webinos.rpc.executeRPC(res, responseto);
						},
						function (error){
							if (typeof id === 'undefined') return;
							var res = {};
							res.jsonrpc = "2.0";
							res.error = {};
							res.error.data = error;
							res.error.code = 32000;
							res.error.message = "Method Invocation returned with error";
							res.id = id;
							webinos.rpc.executeRPC(res, responseto);
						}
					);
				}
			}
		}
	}
	else {
		//if no id is provided we cannot invoke a callback
		if (typeof myObject.id === 'undefined' || myObject.id == null) return;
			
		//invoking linked error / success callback
		if (typeof webinos.rpc.awaitingResponse[myObject.id] !== 'undefined'){
			if (webinos.rpc.awaitingResponse[myObject.id] != null){
				
				if (typeof webinos.rpc.awaitingResponse[myObject.id].onResult !== 'undefined' && typeof myObject.result !== 'undefined'){
					webinos.rpc.awaitingResponse[myObject.id].onResult(myObject.result);
				}
					
				if (typeof webinos.rpc.awaitingResponse[myObject.id].onError !== 'undefined' && typeof myObject.error !== 'undefined'){
					if (typeof myObject.error.data !== 'undefined')
						webinos.rpc.awaitingResponse[myObject.id].onError(myObject.error.data);
					else webinos.rpc.awaitingResponse[myObject.id].onError();
				}
					
				//webinos.rpc.awaitingResponse[myObject.id] == null;
				//webinos.rpc.awaitingResponse.splice(myObject.id,1);
				delete webinos.rpc.awaitingResponse[myObject.id];
			}
		}
	}
	
};

/**
 * Executes the given RPC Request and registers an optional callback that
 * is invoked if an RPC response with same id was received
 */
webinos.rpc.executeRPC = function (rpc, callback, errorCB, responseto) {
    if (typeof callback === 'function'){
    	rpc.id = Math.floor(Math.random()*101);
		var cb = {};
		cb.onResult = callback;
		if (typeof errorCB === 'function') cb.onError = errorCB;
		if (typeof rpc.id !== 'undefined') webinos.rpc.awaitingResponse[rpc.id] = cb;
	}
    else{
    	if (typeof callback !== 'undefined' && typeof responseto === 'undefined') responseto = callback;
    }
    
    //TODO check if rpc is request on a specific object (objectref) and get mapped responseto / destination session
    
    //TODO remove stringify when integrating with Message Routing/Ziran
    write(JSON.stringify(rpc), responseto);
   
};


/**
 * Creates a JSON RPC 2.0 compliant object
 * @param service The service Identifier (e.g., the file reader or the
 * 	      camera service) as string or an object reference as number
 * @param method The method that should be invoked on the service
 * @param an optional array of parameters to be used
 */
webinos.rpc.createRPC = function (service, method, params) {
	
	if (typeof service === 'undefined') throw "Service is undefined";
	if (typeof method === 'undefined') throw "Method is undefined";
	
	var rpc = {};
	rpc.jsonrpc = "2.0";
	
	if (typeof service === "object") {
		// e.g. FileReader@2375443534.truncate
		rpc.method = service.api + "@" + service.id + "." + method;
	} else {
		rpc.method = service + "." + method;
	}
	
	if (typeof params === 'undefined') rpc.params = [];
	else rpc.params = params;
	
	//if (typeof id !== 'undefined') rpc.id = id;
	//else rpc.id = Math.floor(Math.random()*101);
	
	return rpc;
}


/**
 * Registers a Webinos service object as RPC request receiver.
 * @param callback the callback object the contains the methods available via RPC
 */
webinos.rpc.registerObject = function (callback) {
	if (typeof callback !== 'undefined') {
		console.log("Adding handler: " + callback.api);

		var receiverObjs = webinos.rpc.objects[callback.api];
		if (!receiverObjs)
			receiverObjs = [];
		
		// generate id
		callback.id = md5.hexhash(callback.api + callback.displayName + callback.description);
		// verify id isn't existing already
		var filteredRO = receiverObjs.filter(function(el, idx, array) {
			return el.id === callback.id;
		});
		if (filteredRO.length > 0)
			throw new Error('cannot register, already got object with same id. try changing your service desc.')
		
		receiverObjs.push(callback);
		webinos.rpc.objects[callback.api] = receiverObjs;
	}
};

/**
 * Registers an object as RPC request receiver.
 * @param callback the callback object the contains the methods available via RPC
 */
webinos.rpc.registerCallbackObject = function (callback) {
	if (typeof callback !== 'undefined') {
		console.log("Adding handler: " + callback.api);

		var receiverObjs = webinos.rpc.objects[callback.api];
		if (!receiverObjs)
			receiverObjs = [];
		
		receiverObjs.push(callback);
		webinos.rpc.objects[callback.api] = receiverObjs;
	}
};

/**
 * 
 * 
 */
webinos.rpc.unregisterObject = function (callback) {
	if (typeof callback !== 'undefined' && callback != null){
		console.log("Removing handler: " + callback.api);	
		var receiverObjs = webinos.rpc.objects[callback.api];
		
		if (!receiverObjs)
			receiverObjs = [];
		
		var filteredRO = receiverObjs.filter(function(el, idx, array) {
			return el.id !== callback.id;
		});
		webinos.rpc.objects[callback.api] = filteredRO;
	}
}

/**
 * 
 */
webinos.rpc.findServices = function (serviceType) {
	console.log("findService: looking for serviceType: " + serviceType.api);
	
	for (var i in webinos.rpc.objects) {
		if (i === serviceType.api) {
			console.log("findService: found matching service(s) for ServiceType: " + serviceType.api);
			return webinos.rpc.objects[i];
		}
	}
};

this.RPCWebinosService = function (obj) {
	if (!obj) {
		this.id = '';
		this.api = '';
		this.displayName = '';
		this.description = '';
	} else {
		this.id = obj.id || '';
		this.api = obj.api || '';
		this.displayName = obj.displayName || '';
		this.description = obj.description || '';
	}
};

/**
 * Webinos ServiceType from ServiceDiscovery
 * @param api
 */
this.ServiceType = function(api) {
	if (!api)
		throw new Error('ServiceType: missing argument: api');
	
	this.api = api; 
};

/**
 * Export definitions for node.js
 */
if (typeof exports !== 'undefined'){
	exports.setWriter = webinos.rpc.setWriter;
	exports.handleMessage = webinos.rpc.handleMessage;
	exports.executeRPC = webinos.rpc.executeRPC;
	exports.createRPC = webinos.rpc.createRPC;
	exports.registerObject = webinos.rpc.registerObject;
	exports.unregisterObject = webinos.rpc.unregisterObject;
	exports.findServices = webinos.rpc.findServices;
	exports.RPCWebinosService = RPCWebinosService;
	exports.ServiceType = ServiceType;

	// none webinos modules
	var md5 = require('./md5.js');
	
	//add your RPC Implementations here!
	require('./rpc_servicedisco.js');
	require('./rpc_test2.js');
	require('./rpc_test.js');
	require('./rpc_file.js');
	require('./webinos.rpc.file.js');
	require('./rpc_geolocation.js');
	require('./rpc_vehicle.js');
	require('./rpc_sensors.js');
	require('./UserProfile/Server/UserProfileServer.js');
	require('./tv/provider/webinos.rpc.tv.js');
}
})();
