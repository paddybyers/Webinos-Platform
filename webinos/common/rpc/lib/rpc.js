//This RPC implementation should be compliant to JSON RPC 2.0
//as specified @ http://jsonrpc.org/spec.html

(function () {
	if (typeof webinos === 'undefined')
		webinos = {};

	if (typeof module === 'undefined')
		var exports = {};
	else
		var exports = module.exports = {};

	if (typeof module !== 'undefined')
		var utils = require('./webinos.utils.js');
	else
		var utils = webinos.utils || (webinos.utils = {});

	exports.utils = {};

	exports.utils.request = function (service, method, objectRef, successCallback, errorCallback, responseto, msgid) {
		return function () {
			var params = Array.prototype.slice.call(arguments);
			var message = exports.createRPC(service, method, params);

			if (objectRef)
				message.fromObjectRef = objectRef;

			exports.executeRPC(message, utils.callback(successCallback, this), utils.callback(errorCallback, this));
		};
	}

	exports.utils.notify = function (service, method, objectRef, responseto, msgid) {
		return function () {
			var params = Array.prototype.slice.call(arguments);
			var message = exports.createRPC(service, method, params);

			if (objectRef)
				message.fromObjectRef = objectRef;

			exports.executeRPC(message);
		};
	}

	var contextEnabled = false;
	

	function logObj(obj, name){
		for (var myKey in obj){
			console.log(name + "["+myKey +"] = "+obj[myKey]);
			if (typeof obj[myKey] == 'object') logObj(obj[myKey], name + "." + myKey);
		}
	}
	
	
	/**
	 * RPCHandler constructor
	 */
	this.RPCHandler = function() {
		/*
		 * used to store objectRefs for callbacks that get invoked more than once
		 */ 
		this.objRefCachTable = {};

		this.awaitingResponse = {};
		this.objects = {};
		this.responseToMapping = [];
		
		this.write = null;
	}
	
	/**
	 * Sets the writer that should be used to write the stringified JSON RPC request.
	 */
	RPCHandler.prototype.setWriter = function (writer){
		this.write = writer;
	};

	/**
	 * Handles a new JSON RPC message (as string)
	 */
	RPCHandler.prototype.handleMessage = function (message, responseto, msgid){
		console.log("New packet from messaging");
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

				var receiverObjs = this.objects[service];
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

				if (typeof includingObject === 'object'){
					var id = myObject.id;

					if (typeof myObject.fromObjectRef !== 'undefined' && myObject.fromObjectRef != null) {
						// callback registration case (one request to many responses)

						this.responseToMapping[myObject.fromObjectRef] = responseto;

						this.objRefCachTable[myObject.fromObjectRef] = {responseTo:responseto, msgId: msgid};

						var that = this;
						includingObject[method](
								myObject.params, 
								function (result) {
									if (typeof id === 'undefined') return;
									var res = {};
									res.jsonrpc = "2.0";
									if (typeof result !== 'undefined') res.result = result;
									else res.result = {};
									res.id = id;						
									that.executeRPC(res, undefined, undefined, responseto, msgid);
									// CONTEXT LOGGING HOOK
									if (contextEnabled){
										webinos.context.logContext(myObject,res);
									}
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
									that.executeRPC(res, undefined, undefined, responseto, msgid);
								}, 
								myObject.fromObjectRef
						);
					}
					else {
						// default request-response case
						var that = this;
						includingObject[method](
								myObject.params, 
								function (result) {
									if (typeof id === 'undefined') return;
									var res = {};
									res.jsonrpc = "2.0";
									if (typeof result !== 'undefined') res.result = result;
									else res.result = {};
									res.id = id;
									that.executeRPC(res, undefined, undefined, responseto, msgid);

									// CONTEXT LOGGING HOOK
									if (contextEnabled)
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
									that.executeRPC(res, undefined, undefined, responseto, msgid);
								}
						);
					}
				}
			}
		}
		else {
			//if no id is provided we cannot invoke a callback
			if (typeof myObject.id === 'undefined' || myObject.id == null) return;

			console.log("Received a response that is registered for " + myObject.id);

			//invoking linked error / success callback
			if (typeof this.awaitingResponse[myObject.id] !== 'undefined'){
				if (this.awaitingResponse[myObject.id] != null){

					if (typeof this.awaitingResponse[myObject.id].onResult !== 'undefined' && typeof myObject.result !== 'undefined'){

						this.awaitingResponse[myObject.id].onResult(myObject.result);
						console.log("called SCB");
					}

					if (typeof this.awaitingResponse[myObject.id].onError !== 'undefined' && typeof myObject.error !== 'undefined'){
						if (typeof myObject.error.data !== 'undefined'){
							console.log("Propagating error to application");
							this.awaitingResponse[myObject.id].onError(myObject.error.data);
						}
						else this.awaitingResponse[myObject.id].onError();
					}

					//this.awaitingResponse[myObject.id] == null;
					//this.awaitingResponse.splice(myObject.id,1);
					delete this.awaitingResponse[myObject.id];
				}
			}
		}

	};

	/**
	 * Executes the given RPC Request and registers an optional callback that
	 * is invoked if an RPC response with same id was received
	 */
	RPCHandler.prototype.executeRPC = function (rpc, callback, errorCB, responseto, msgid) {

		//service invocation case
		if (typeof rpc.serviceAddress !== 'undefined') {
			// this only happens in the web browser
			webinos.message_send(rpc, rpc.serviceAddress);// TODO move the whole mmessage_send function here?

			if (typeof callback === 'function'){
				var cb = {};
				cb.onResult = callback;
				if (typeof errorCB === 'function') cb.onError = errorCB;
				if (typeof rpc.id !== 'undefined') this.awaitingResponse[rpc.id] = cb;
			}
			return;
		}


		// ObjectRef invocation case
		if (typeof callback === 'function'){
			var cb = {};
			cb.onResult = callback;
			if (typeof errorCB === 'function') cb.onError = errorCB;
			if (typeof rpc.id !== 'undefined') this.awaitingResponse[rpc.id] = cb;

			if (rpc.method && rpc.method.indexOf('@') === -1) {
				var objectRef = rpc.method.split('.')[0];
				if (typeof this.objRefCachTable[objectRef] !== 'undefined') {
					responseto = this.objRefCachTable[objectRef].responseTo;

				}
				console.log('RPC MESSAGE' + " to " + responseto + " for callback " + objectRef);
			}

		}
		else if (rpc.method && rpc.method.indexOf('@') === -1) {
			var objectRef = rpc.method.split('.')[0];
			if (typeof this.objRefCachTable[objectRef] !== 'undefined') {
				responseto = this.objRefCachTable[objectRef].responseTo;

			}
			console.log('RPC MESSAGE' + " to " + responseto + " for callback " + objectRef);
		}

		//TODO check if rpc is request on a specific object (objectref) and get mapped responseto / destination session

		this.write(rpc, responseto, msgid);
	};

	/**
	 * Creates a JSON RPC 2.0 compliant object.
	 * @param service The service (e.g., the file reader or the
	 * 	      camera service) as RPCWebinosService object instance.
	 * @param method The method that should be invoked on the service.
	 * @param params An optional array of parameters to be used.
	 */
	RPCHandler.prototype.createRPC = function (service, method, params) {

		if (typeof service === 'undefined') throw "Service is undefined";
		if (typeof method === 'undefined') throw "Method is undefined";

		var rpc = {};
		rpc.jsonrpc = "2.0";
		rpc.id = Math.floor(Math.random()*101);

		if (typeof service === "object") {
			// e.g. FileReader@2375443534.truncate
			rpc.method = service.api + "@" + service.id + "." + method;

			// TODO find a better way to store the service address?
			if (typeof service.serviceAddress !== 'undefined') {
				rpc.serviceAddress = service.serviceAddress;
			}
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
	RPCHandler.prototype.registerObject = function (callback) {
		if (typeof callback !== 'undefined') {
			console.log("Adding handler: " + callback.api);

			var receiverObjs = this.objects[callback.api];
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
			this.objects[callback.api] = receiverObjs;
		}
	};

	/**
	 * Registers an object as RPC request receiver.
	 * @param callback the callback object the contains the methods available via RPC
	 */
	RPCHandler.prototype.registerCallbackObject = function (callback) {
		if (typeof callback !== 'undefined') {
			console.log("Adding handler: " + callback.api);

			var receiverObjs = this.objects[callback.api];
			if (!receiverObjs)
				receiverObjs = [];

			receiverObjs.push(callback);
			this.objects[callback.api] = receiverObjs;
		}
	};

	/**
	 * 
	 * 
	 */
	RPCHandler.prototype.unregisterObject = function (callback) {
		if (typeof callback !== 'undefined' && callback != null){
			console.log("Removing handler: " + callback.api);	
			var receiverObjs = this.objects[callback.api];

			if (!receiverObjs)
				receiverObjs = [];

			var filteredRO = receiverObjs.filter(function(el, idx, array) {
				return el.id !== callback.id;
			});
			this.objects[callback.api] = filteredRO;
		}
	};

	/**
	 * 
	 */
	RPCHandler.prototype.findServices = function (serviceType) {
		console.log("findService: searching for ServiceType: " + serviceType.api);
		var results = [];
		var cstar = serviceType.api.indexOf("*");
		if(cstar !== -1){
			//*c*
			if(serviceType.api.lastIndexOf("*") !== 0){
				var len = serviceType.api.length - 1;
				var midString = serviceType.api.substring(1, len);
				for (var i in this.objects){
					if(i.indexOf(midString) != -1) {
						for( var j = 0; j <this.objects[i].length; j++){
							results.push(this.objects[i][j]);
						}
					}
				}
			}
			//*, *c
			else {
				if(serviceType.api.length == 1) {
					logObj(this.objects,"services");
					for (var i in this.objects){
						for( var j = 0; j <this.objects[i].length;j++){ 
							results.push(this.objects[i][j]);
						}
					}
				}
				else {
					var restString = serviceType.api.substr(1);
					for (var i in this.objects) {
						if(i.indexOf(restString, i.length - restString.length) !== -1)	{
							for( var j = 0; j <this.objects[i].length; j++){
								results.push(this.objects[i][j]);
							}
						}
					}
				}
			}

		}
		else {
			for (var i in this.objects) {
				if (i === serviceType.api) {
					console.log("findService: found matching service(s) for ServiceType: " + serviceType.api);
					results = this.objects[i];
				}
			} 
			// add address where this service is available, namely this pzp sessionid
			for (var i=0; i<results.length; i++) {
				results[i].serviceAddress = this.pzp.getPzpSessionId();
			}

			return results;
		}
	};
	
	RPCHandler.prototype.setPzp = function(pzp) {
		this.pzp = pzp;
	}


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
			this.serviceAddresss = '';
		} else {
			this.id = obj.id || '';
			this.api = obj.api || '';
			this.displayName = obj.displayName || '';
			this.description = obj.description || '';
			this.serviceAddress = obj.serviceAddress || '';
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

	function loadModules(rpcHdlr) {
		if (typeof module === 'undefined') return;
		
		var moduleRoot = require('../dependencies.json');
		var dependencies = require('../' + moduleRoot.root.location + '/dependencies.json');
		var webinosRoot = '../' + moduleRoot.root.location;

		// webinos related modules
		var Pzp = require(webinosRoot + dependencies.pzp.location + 'lib/session_pzp.js');
		rpcHdlr.setPzp(Pzp);
		
		//Fix for modules located in old rpc folder
		var oldRpcLocation = webinosRoot + '../RPC/';
		//add your RPC Implementations here!
		var modules = [
		               webinosRoot + dependencies.api.service_discovery.location + 'lib/rpc_servicedisco.js',
		               webinosRoot + dependencies.api.get42.location + 'lib/rpc_test2.js',
		               webinosRoot + dependencies.api.get42.location + 'lib/rpc_test.js',
//		               webinosRoot + dependencies.api.file.location + 'lib/webinos.file.rpc.js',
		               webinosRoot + dependencies.api.geolocation.location + 'lib/webinos.geolocation.rpc.js',
		               webinosRoot + dependencies.api.events.location + 'lib/events.js',
		               webinosRoot + dependencies.api.sensors.location + 'lib/rpc_sensors.js',
		               webinosRoot + dependencies.api.tv.location + 'lib/webinos.rpc_tv.js',
//		               webinosRoot + dependencies.api.deviceorientation.location + 'lib/webinos.deviceorientation.rpc.js',
		               webinosRoot + dependencies.api.vehicle.location + 'lib/webinos.vehicle.rpc.js',
		               webinosRoot + dependencies.api.context.location,
		               webinosRoot + dependencies.api.authentication.location + 'lib/webinos.authentication.rpc.js',
		               webinosRoot + dependencies.api.contacts.location + 'lib/webinos.contacts.rpc.js'
//		               // Disabled as these cause webinos from functioning
		               //oldRpcLocation + '../API/DeviceStatus/src/main/javascript/webinos.rpc.devicestatus.js',
		               //oldRpcLocation + 'UserProfile/Server/UserProfileServer.js',
		               //oldRpcLocation + 'tv/provider/webinos.rpc.tv.js',
		               //oldRpcLocation + 'rpc_contacts.js',
		               //oldRpcLocation + 'bluetooth_module/bluetooth.rpc.server.js'
		               ];

		if (contextEnabled) {
			modules.push(webinosRoot + dependencies.manager.context_manager.location);
		}

		for (var i = 0; i <modules.length; i++){
			try{
				var Service = require(modules[i]).Service;
				rpcHdlr.registerObject(new Service(rpcHdlr));
			}
			catch (error){
				console.log(error);
				console.log("Could not load module " + modules[i] + " with message: " + error );
			}
		}
	}
	
	/**
	 * Export definitions for node.js
	 */
	if (typeof module !== 'undefined'){
		exports.RPCHandler = RPCHandler;
		exports.loadModules = loadModules;
		exports.RPCWebinosService = RPCWebinosService;
		exports.ServiceType = ServiceType;

		// none webinos modules
		var md5 = require('../contrib/md5.js');

	}
})();
