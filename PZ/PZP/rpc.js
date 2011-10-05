//This RPC implementation should be compliant to JSON RPC 2.0
//as specified @ http://groups.google.com/group/json-rpc/web/json-rpc-2-0

(function() {


write = null;

webinos = {};
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
	
	var myObject = JSON.parse(message);
	logObj(myObject, "rpc");
	
	//received message is RPC request
	if (typeof myObject.method !== 'undefined' && myObject.method != null) {
		var idx = myObject.method.lastIndexOf('.');
		var method = myObject.method.substring(idx+1);
		var service = myObject.method.substring(0,idx);
		//TODO send back error if service and method is not webinos style
		
		if (typeof service !== 'undefined'){
			console.log("Got message to invoke " + method + " on " + service + " with params: " + myObject.params[0] );
		
			//enable functions bound to attributes in nested objects
			var methodPathParts = service.split('.');
			var includingObject = webinos.rpc.objects[methodPathParts[0]];
			for(var pIx = 0; pIx<methodPathParts.length; pIx++){
				if(methodPathParts[pIx] && includingObject[methodPathParts[pIx]]){
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
	//rpc.service = service;
	rpc.method = service + "." + method;
	
	if (typeof params === 'undefined') rpc.params = [];
	else rpc.params = params;
	
	//if (typeof id !== 'undefined') rpc.id = id;
	//else rpc.id = Math.floor(Math.random()*101);
	
	return rpc;
}


/**
 * Registers an object as RPC request receiver.
 * @param ref reference that is used to select this object as receiver
 * @param callback the callback object the contains the methods available via RPC
 */
webinos.rpc.registerObject = function (ref, callback) {
	if (typeof callback !== 'undefined' && typeof ref !== 'undefined' && ref != null){
		console.log("Adding handler: " + ref);	
		webinos.rpc.objects[ref] = callback;
	}
}

/**
 * 
 * 
 */
webinos.rpc.unregisterObject = function (ref) {
	if (typeof ref !== 'undefined' && ref != null){
		console.log("Adding handler: " + ref);	
		delete webinos.rpc.objects[ref];
	}
}

/**
 * Export definitions for node.js
 */
if (typeof exports !== 'undefined'){
	exports.setWriter = webinos.rpc.setWriter;
	exports.handleMessage = webinos.rpc.handleMessage;
	exports.executeRPC = webinos.rpc.executeRPC;
	exports.createRPC = webinos.rpc.createRPC;
	exports.registerObject = webinos.rpc.registerObject;
	exports.unregisterObject = webinos.rpc.unregisterObject ;

	//add your RPC Implementations here!
	require('./rpc_test.js');
	require('./rpc_geolocation.js');

}


}());
