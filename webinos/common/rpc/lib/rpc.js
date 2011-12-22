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

	var sessionId;
	
	//Code to enable Context from settings file
	var contextEnabled = false;
	if (typeof module !== 'undefined'){
    var path = require('path');
    var moduleRoot = require(path.resolve(__dirname, '../dependencies.json'));
    var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
    var webinosRoot = path.resolve(__dirname, '../' + moduleRoot.root.location)+'/';
    contextEnabled = require(webinosRoot + dependencies.manager.context_manager.location + 'data/contextSettings.json').contextEnabled;
  }   


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
		
		/**
		 * Holds registered Webinos Service objects local to this RPC.
		 * 
		 * Service objects are stored in this dictionary with their API url as
		 * key.
		 */
		this.objects = {};
		
		/**
		 * Holds other Service objects, not registered here. To be filled upon
		 * connect.
		 * FIXME we should always query for these, instead of holding them here
		 */
		this.serviceObjectsFromPzh = [];
		
		this.requesterMapping = [];
		
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
	RPCHandler.prototype.handleMessage = function (message, from, msgid){
		console.log("New packet from messaging");
		console.log("Response to " + from);
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

						this.requesterMapping[myObject.fromObjectRef] = from;

						this.objRefCachTable[myObject.fromObjectRef] = {'from':from, msgId: msgid};

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
									that.executeRPC(res, undefined, undefined, from, msgid);
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
									that.executeRPC(res, undefined, undefined, from, msgid);
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
									that.executeRPC(res, undefined, undefined, from, msgid);

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
									that.executeRPC(res, undefined, undefined, from, msgid);
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
	RPCHandler.prototype.executeRPC = function (rpc, callback, errorCB, from, msgid) {
		//service invocation case
		if (typeof rpc.serviceAddress !== 'undefined') {
			// this only happens in the web browser
			webinos.session.message_send(rpc, rpc.serviceAddress);// TODO move the whole mmessage_send function here?
			
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
					from = this.objRefCachTable[objectRef].from;

				}
				console.log('RPC MESSAGE' + " to " + from + " for callback " + objectRef);
			}

		}
		else if (rpc.method && rpc.method.indexOf('@') === -1) {
			var objectRef = rpc.method.split('.')[0];
			if (typeof this.objRefCachTable[objectRef] !== 'undefined') {
				from = this.objRefCachTable[objectRef].from;

			}
			console.log('RPC MESSAGE' + " to " + from + " for callback " + objectRef);
		}

		//TODO check if rpc is request on a specific object (objectref) and get mapped from / destination session

		this.write(rpc, from, msgid);
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
	
	RPCHandler.prototype.request = function (service, method, objectRef, successCallback, errorCallback) {
		var self = this; // TODO Bind returned function to "this", i.e., an instance of RPCHandler?
		
		return function () {
			var params = Array.prototype.slice.call(arguments);
			var message = self.createRPC(service, method, params);

			if (objectRef)
				message.fromObjectRef = objectRef;

			self.executeRPC(message, utils.callback(successCallback, this), utils.callback(errorCallback, this));
		};
	};

	RPCHandler.prototype.notify = function (service, method, objectRef) {
		var self = this; // TODO Bind returned function to "this", i.e., an instance of RPCHandler?
		
		return function () {
			var params = Array.prototype.slice.call(arguments);
			var message = self.createRPC(service, method, params);

			if (objectRef)
				message.fromObjectRef = objectRef;

			self.executeRPC(message);
		};
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
			
			// add address where this service is available, namely this pzp/pzh sessionid
			for (var i=0; i<results.length; i++) {
				results[i].serviceAddress = sessionId; // This is source addres, it is used by messaging for returning back
			}

			// add other services reported from the pzh
			function filterServiceType(el) {
				return el.api === serviceType.api ? true : false;
			}
			results = results.concat(this.serviceObjectsFromPzh.filter(filterServiceType));
			
			return results;
		}
	};
	
	RPCHandler.prototype.setServicesFromPzh = function(services) {
		console.log("setServicesFromPzh: found " + services.length + " services.");
		this.serviceObjectsFromPzh = services;
	}
	
	/**
	 * Return an array of all registered Service objects. 
	 */
	RPCHandler.prototype.getRegisteredServices = function() {
		// FIXME this shouldn't be a public method i guess
		var results = [];
		
		function getServiceInfo(el) {
			el = el.getInformation();
			el.serviceAddress = sessionId;
			return el;
		}

		for (var service in this.objects) {
			results = results.concat(this.objects[service]);
		}
		return results.map(getServiceInfo);
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
	
	this.RPCWebinosService.prototype.getInformation = function () {
		return {
			id: this.id,
			api: this.api,
			displayName: this.displayName,
			description: this.description,
			serviceAddress: this.serviceAddress
		};
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

	RPCHandler.prototype.loadModules = function(modules) {
		if (typeof module === 'undefined') return;
		
		var path = require('path');
		var moduleRoot = require(path.resolve(__dirname, '../dependencies.json'));
		var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
		//We need to add the trailing / or add it later on
		var webinosRoot = path.resolve(__dirname, '../' + moduleRoot.root.location)+'/';
		//sessionPzp = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_pzp.js'));
		if (contextEnabled) {
		  require(webinosRoot + dependencies.manager.context_manager.location); 
			//modules.push(webinosRoot + dependencies.manager.context_manager.location);
		}

		var mods = modules.list;
		
		for (var i = 0; i < mods.length; i++){
			try{
				var Service = require(webinosRoot + dependencies.api[mods[i]].location).Service;
				this.registerObject(new Service(this));
			}
			catch (error){
				console.log(error);
				console.log("Could not load module " + mods[i] + " with message: " + error );
			}
		}
	};
	
	function SetSessionId (id) {
		sessionId = id;
	}
	/**
	 * Export definitions for node.js
	 */
	if (typeof module !== 'undefined'){
		exports.RPCHandler = RPCHandler;
		exports.RPCWebinosService = RPCWebinosService;
		exports.ServiceType = ServiceType;
		exports.SetSessionId = SetSessionId;
		// none webinos modules
		var md5 = require('../contrib/md5.js');

	}
})();
