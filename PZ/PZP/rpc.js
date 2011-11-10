//This RPC implementation should be compliant to JSON RPC 2.0
//as specified @ http://jsonrpc.org/spec.html

(function() {
	if (typeof webinos === 'undefined')
		webinos = {};
	
	if (typeof module !== 'undefined')
		var utils = require('./webinos.utils.js');
	else if (typeof webinos.utils !== 'undefined')
		var utils = webinos.utils;
	
	if (typeof utils !== 'undefined')
		utils.rpc = {
			request: function (service, method, objectRef, successCallback, errorCallback, responseto, msgid) {
				return function () {
					var params = Array.prototype.slice.call(arguments);
					var message = webinos.rpc.createRPC(service, method, params);
					
					if (objectRef)
						message.fromObjectRef = objectRef;

					webinos.rpc.executeRPC(message, utils.callback(successCallback, this), utils.callback(errorCallback, this), responseto, msgid);
				};
			},
			
			notify: function (service, method, objectRef, responseto, msgid) {
				return function () {
					var params = Array.prototype.slice.call(arguments);
					var message = webinos.rpc.createRPC(service, method, params);
					
					if (objectRef)
						message.fromObjectRef = objectRef;
					webinos.rpc.executeRPC(message, null, null, responseto, msgid);
				};
			}
		};

write = null;


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
webinos.rpc.handleMessage = function (message, responseto, msgid){
	console.log("New packet from messaging");
	//console.log("Message: " + JSON.stringify(message));
	console.log("Response to " + responseto);
	var myObject = message;
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
			console.log("Got message to invoke " + method + " on " + service + (serviceId ? "@" + serviceId : "") +" with params: " + myObject.params );
	
			var receiverObjs = webinos.rpc.objects[service];

			if (!receiverObjs)
				receiverObjs = [];
			var filteredRO = receiverObjs.filter(function(el, idx, array) {
				return el.id === serviceId;
			});
			var includingObject = filteredRO[0]; 
			if (typeof includingObject === 'undefined') includingObject = receiverObjs[0]; 
			
			if (typeof includingObject === 'undefined'){
				console.log("No service found with id/type " + service);
				return;
			}
			
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
							res.jsonrpc = "2.0";
							if (typeof result !== 'undefined') res.result = result;
							else res.result = {};
							res.id = id;							
							webinos.rpc.executeRPC(res, null, null, responseto, msgid);
						},
						function (error){
							if (typeof id === 'undefined') return;
							var res = {};
							res.jsonrpc = "2.0";
							res.error = {};
							res.error.data = error;
							res.error.code = 32000;  //webinos specific error code representing that an API specific error occured
							res.error.message = "Method Invocation returned with error";
							res.id = id;
							webinos.rpc.executeRPC(res, null, null, responseto, msgid);
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
							if (typeof result !== 'undefined') res.result = result;
							else res.result = {};
							res.id = id;
							//webinos.rpc.executeRPC(res, responseto);
							webinos.rpc.executeRPC(res, null, null, responseto, msgid);
							
							// CONTEXT LOGGING HOOK
							webinos.context.logContext(myObject,res);
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

							webinos.rpc.executeRPC(res, null, null, responseto, msgid);
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
webinos.rpc.executeRPC = function (rpc, callback, errorCB, responseto, msgid) {
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
    debugger;
    //TODO check if rpc is request on a specific object (objectref) and get mapped responseto / destination session
    
    //TODO remove stringify when integrating with Message Routing/Ziran
    write(rpc, responseto, msgid);
   
};


/**
 * Creates a JSON RPC 2.0 compliant object.
 * @param service The service (e.g., the file reader or the
 * 	      camera service) as RPCWebinosService object instance.
 * @param method The method that should be invoked on the service.
 * @param params An optional array of parameters to be used.
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
	
	return rpc;
};


/**
 * Registers a Webinos service object as RPC request receiver.
 * @param callback The callback object the contains the methods available via RPC.
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
			throw new Error('cannot register, already got object with same id. try changing your service desc.');
		
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
};

/**
 * 
 */
webinos.rpc.findServices = function (serviceType) {
	results = new Array();

	var cstar = serviceType.api.indexOf("*");
	if(cstar !== -1){
		//*c*
		if(serviceType.api.lastIndexOf("*") !== 0){
			var len = serviceType.api.length - 1;
			var midString = serviceType.api.substring(1, len);
			for (var i in webinos.rpc.objects){
				if(i.indexOf(midString) != -1) {
					for( var j = 0; j <webinos.rpc.objects[i].length; j++){
						results.push(webinos.rpc.objects[i][j]);
					}
				}
			}
		return results;
		}
		//*, *c
		else {
			if(serviceType.api.length == 1) {
				logObj(webinos.rpc.objects,"services");
				for (var i in webinos.rpc.objects){
					for( var j = 0; j <webinos.rpc.objects[i].length;j++){ 
						results.push(webinos.rpc.objects[i][j]);
					}
				}
                return results; 		
			}
			else {
				var restString = serviceType.api.substr(1);
 				for (var i in webinos.rpc.objects) {
 					if(i.indexOf(restString, i.length - restString.length) !== -1)	{
 						for( var j = 0; j <webinos.rpc.objects[i].length; j++){
 							results.push(webinos.rpc.objects[i][j]);
 						}
 					}
 				}
 				return results;
			}
		}
      
	}
	else {
		for (var i in webinos.rpc.objects) {
			if (i === serviceType.api) {
				console.log("findService: found matching service(s) for ServiceType: " + serviceType.api);
				return webinos.rpc.objects[i];
			}
		} 
	}
};

/**
 * RPCWebinosService object to be registered as RPC module.
 * 
 * The RPCWebinosService has fields with information about a Webinos service.
 * It is used for three things:
 * 1) For registering a webinos service as RPC module.
 * 2) The service discovery module passes this into the constructor of a
 *    webinos service on the client side.
 * 3) For registering a RPC callback object on the client side using ObjectRef
 *    as api field.
 * When registering a service the constructor should be called with an object
 * that has the following three fields: api, displayName, description. When
 * used as RPC callback object, it is enough to specify the api field and set
 * that to ObjectRef.
 * @param obj Object with fields describing the service.
 */
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

	require('./rpc_servicedisco.js');

	
	//add your RPC Implementations here!
	var modules = [
	            './rpc_test2.js',
	            './rpc_test.js',
	           	'./rpc_file.js',
				'./webinos.rpc.file.js',
				'./rpc_geolocation.js',
				'./rpc_vehicle.js',
				'./rpc_sensors.js',
				'../API/DeviceStatus/src/main/javascript/webinos.rpc.devicestatus.js',
				'./UserProfile/Server/UserProfileServer.js',
				'./tv/provider/webinos.rpc.tv.js',
				'./../Manager/Context/Interception/contextInterception.js',
				'./rpc_contacts.js'
	               ];
	
	for (var i = 0; i <modules.length; i++){
		try{
			require(modules[i]);
		}
		catch (error){
			console.log("Could not load module " + modules[i] + " with message: " + error );
		}
	}
}
})();
