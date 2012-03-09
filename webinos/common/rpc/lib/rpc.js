/*******************************************************************************
*  Code contributed to the webinos project
* 
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*  
*     http://www.apache.org/licenses/LICENSE-2.0
*  
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
* 
* Copyright 2011 Alexander Futasz, Fraunhofer FOKUS
******************************************************************************/

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
//	var contextEnabled = false;
//	if (typeof module !== 'undefined'){
//    var path = require('path');
//    var moduleRoot = require(path.resolve(__dirname, '../dependencies.json'));
//    var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
//    var webinosRoot = path.resolve(__dirname, '../' + moduleRoot.root.location)+'/';
//    contextEnabled = require(webinosRoot + dependencies.manager.context_manager.location + 'data/contextSettings.json').contextEnabled;
//  }   


	function logObj(obj, name){
		for (var myKey in obj){
			console.log('INFO: [RPC]'+name + "["+myKey +"] = "+obj[myKey]);
			if (typeof obj[myKey] == 'object') logObj(obj[myKey], name + "." + myKey);
		}
	}
	
	
	/**
	 * RPCHandler constructor
	 *  @constructor
	 *  @param parent The PZP object or optional else.
	 */
	_RPCHandler = function(parent) {
		/**
		 * Parent is the PZP. The parameter is not used/optional on PZH and the
		 * web browser.
		 */
		this.parent = parent;
		
		/**
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
		 * Holds other Service objects, not registered here. Only used on the
		 * PZH.
		 */
		this.remoteServiceObjects = [];
		
		/**
		 * Holds callbacks for findServices callbacks from the PZH
		 */
		this.remoteServicesFoundCallbacks = {};
		
		if (typeof this.parent !== 'undefined') {
			var that = this;
			
			// add listener to pzp object, to be called when remote services
			// are returned by the pzh
			this.parent.addRemoteServiceListener(function (payload) {
				var callback = that.remoteServicesFoundCallbacks[payload.id];
				console.log(payload);
				if (!callback) {
					console.log("ServiceDiscovery: no findServices callback found for id: " + payload.id);
					return;
				}
				
				delete that.remoteServicesFoundCallbacks[payload.id];
				callback(payload.message);
			});
		}
		
		this.requesterMapping = [];
		
		this.messageHandler = null;
	}
	
	/**
	 * Sets the writer that should be used to write the stringified JSON RPC request.
	 * @param messageHandler Message handler manager.
	 */
	_RPCHandler.prototype.setMessageHandler = function (messageHandler){
		this.messageHandler = messageHandler;
	};

	/**
	 * Handles a new JSON RPC message (as string)
	 * @param message The RPC message coming in.
	 * @param from The sender.
	 * @param msgid An id.
	 */
	_RPCHandler.prototype.handleMessage = function (message, from, msgid){
		console.log('INFO: [RPC] '+"New packet from messaging");
		console.log('INFO: [RPC] '+"Response to " + from);
		var myObject = message;
		//logObj(myObject, "rpc");

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
				console.log('INFO: [RPC] '+"Got message to invoke " + method + " on " + service + (serviceId ? "@" + serviceId : "") +" with params: " + myObject.params );

				var receiverObjs = this.objects[service];
				if (!receiverObjs)
					receiverObjs = [];
				var filteredRO = receiverObjs.filter(function(el, idx, array) {
					return el.id === serviceId;
				});
				var includingObject = filteredRO[0]; 
				if (typeof includingObject === 'undefined') includingObject = receiverObjs[0]; 

				if (typeof includingObject === 'undefined'){
					console.log('INFO: [RPC] '+"No service found with id/type " + service);
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
//									if (contextEnabled){
//										webinos.context.logContext(myObject,res);
//									}
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
//									if (contextEnabled){
//										webinos.context.logContext(myObject,res);
//									}
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

			console.log('INFO: [RPC] '+"Received a response that is registered for " + myObject.id);

			//invoking linked error / success callback
			if (typeof this.awaitingResponse[myObject.id] !== 'undefined'){
				if (this.awaitingResponse[myObject.id] != null){

					if (typeof this.awaitingResponse[myObject.id].onResult !== 'undefined' && typeof myObject.result !== 'undefined'){

						this.awaitingResponse[myObject.id].onResult(myObject.result);
						console.log('INFO: [RPC] '+"called SCB");
					}

					if (typeof this.awaitingResponse[myObject.id].onError !== 'undefined' && typeof myObject.error !== 'undefined'){
						if (typeof myObject.error.data !== 'undefined'){
							console.log('INFO: [RPC] '+"Propagating error to application");
							this.awaitingResponse[myObject.id].onError(myObject.error.data);
						}
						else this.awaitingResponse[myObject.id].onError();
					}

					//this.awaitingResponse[myObject.id] == null;
					//this.awaitingResponse.splice(myObject.id,1);
					//delete this.awaitingResponse[myObject.id];
				}
			}
		}

	};

	/**
	 * Executes the given RPC request and registers an optional callback that
	 * is invoked if an RPC response with same id was received.
	 * @param rpc An RPC object create with createRPC.
	 * @param callback Success callback.
	 * @param errorCB Error callback.
	 * @param from Sender.
	 * @param msgid An id.
	 */
	_RPCHandler.prototype.executeRPC = function (rpc, callback, errorCB, from, msgid) {
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
				console.log('INFO: [RPC] '+'RPC MESSAGE' + " to " + from + " for callback " + objectRef);
			}

		}
		else if (rpc.method && rpc.method.indexOf('@') === -1) {
			var objectRef = rpc.method.split('.')[0];
			if (typeof this.objRefCachTable[objectRef] !== 'undefined') {
				from = this.objRefCachTable[objectRef].from;

			}
			console.log('INFO: [RPC] '+'RPC MESSAGE' + " to " + from + " for callback " + objectRef);
		}

		//TODO check if rpc is request on a specific object (objectref) and get mapped from / destination session

		this.messageHandler.write(rpc, from, msgid);
	};

	/**
	 * Creates a JSON RPC 2.0 compliant object.
	 * @param service The service (e.g., the file reader or the
	 * 	      camera service) as RPCWebinosService object instance.
	 * @param method The method that should be invoked on the service.
	 * @param params An optional array of parameters to be used.
	 */
	_RPCHandler.prototype.createRPC = function (service, method, params) {

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
	 * Utility method that combines createRPC and executeRPC.
	 * @param service The service (e.g., the file reader or the
	 * 	      camera service) as RPCWebinosService object instance.
	 * @param method The method that should be invoked on the service.
	 * @param objectRef RPC object reference.
	 * @param successCallback Success callback.
	 * @param errorCallback Error callback.
	 * @returns Function which when called does the rpc.
	 */
	_RPCHandler.prototype.request = function (service, method, objectRef, successCallback, errorCallback) {
		var self = this; // TODO Bind returned function to "this", i.e., an instance of RPCHandler?
		
		return function () {
			var params = Array.prototype.slice.call(arguments);
			var message = self.createRPC(service, method, params);

			if (objectRef)
				message.fromObjectRef = objectRef;

			self.executeRPC(message, utils.callback(successCallback, this), utils.callback(errorCallback, this));
		};
	};

	/**
	 * Utility method that combines createRPC and executeRPC.
	 * 
	 * For notification only, doesn't support success or error callbacks.
	 * @param service The service (e.g., the file reader or the
	 * 	      camera service) as RPCWebinosService object instance.
	 * @param method The method that should be invoked on the service.
	 * @param objectRef RPC object reference.
	 * @returns Function which when called does the rpc.
	 */
	_RPCHandler.prototype.notify = function (service, method, objectRef) {
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
	 * @param callback The callback object that contains the methods available via RPC.
	 */
	_RPCHandler.prototype.registerObject = function (callback) {
		if (typeof callback !== 'undefined') {
			console.log('INFO: [RPC] '+"Adding handler: " + callback.api);

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
	 * @param callback The callback object that contains the methods available via RPC.
	 */
	_RPCHandler.prototype.registerCallbackObject = function (callback) {
		if (typeof callback !== 'undefined') {
			console.log('INFO: [RPC] '+"Adding handler: " + callback.api);

			var receiverObjs = this.objects[callback.api];
			if (!receiverObjs)
				receiverObjs = [];

			receiverObjs.push(callback);
			this.objects[callback.api] = receiverObjs;
		}
	};

	/**
	 * Unregisters an object, so it can no longer receives requests.
	 * @param callback The callback object to unregister.
	 */
	_RPCHandler.prototype.unregisterObject = function (callback) {
		if (typeof callback !== 'undefined' && callback != null){
			console.log('INFO: [RPC] '+"Removing handler: " + callback.api);
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
	 * Used by the ServiceDiscovery to search for registered services.
	 * @param serviceType ServiceType object to search for.
	 * @param callback Callback to call with results.
	 * @private
	 */
	_RPCHandler.prototype.findServices = function (serviceType, callback) {
		console.log('INFO: [RPC] '+"findService: searching for ServiceType: " + serviceType.api);
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
			callback(results);

		}
		else {
			for (var i in this.objects) {
				if (i === serviceType.api) {
					console.log('INFO: [RPC] '+"findService: found matching service(s) for ServiceType: " + serviceType.api);
					results = this.objects[i];
				}
			} 
			
			// add address where this service is available, namely this pzp/pzh sessionid
			for (var i=0; i<results.length; i++) {
				results[i].serviceAddress = sessionId; // This is source addres, it is used by messaging for returning back
			}
			
			// no connection to a PZH it seems, don't ask for remote services
			if (!this.parent.pzhId) {
				callback(results);
				return;
			}
			
			// store callback in map for lookup on returned remote results
			var callbackId = Math.floor(Math.random()*101);
			console.log(callbackId);
			this.remoteServicesFoundCallbacks[callbackId] = (function(res) {
				return function(remoteServices) {
					
					function isServiceType(el) {
						return el.api === serviceType.api ? true : false;
					}
					res = res.concat(remoteServices.filter(isServiceType));
					
					callback(res);
				}
			})(results);
			
			// ask for remote service objects
			this.parent.prepMsg(this.parent.sessionId, this.parent.pzhId, 'findServices', {id: callbackId});
		}
	};
	
	/**
	 * Add services to internal array. Used by PZH.
	 * @param services Array of services to be added.
	 */
	_RPCHandler.prototype.addRemoteServiceObjects = function(services) {
		console.log('INFO: [RPC] '+"addRemoteServiceObjects: found " + (services && services.length) || 0 + " services.");
		this.remoteServiceObjects = this.remoteServiceObjects.concat(services);
	};
	
	/**
	 * Remove services from internal array. Used by PZH.
	 * @param address Remove all services for this address.
	 */
	_RPCHandler.prototype.removeRemoteServiceObjects = function(address) {
		var oldCount = this.remoteServiceObjects.length;
		
		function isNotServiceFromAddress(element) {
			return address !== element.serviceAddress;
		}
		
		this.remoteServiceObjects = this.remoteServiceObjects.filter(isNotServiceFromAddress);
		
		var removedCount = oldCount - this.remoteServiceObjects.length;
		console.log("removeRemoteServiceObjects: removed " + removedCount + " services from: " + address);
	};
	
	/**
	 * Get an array of all known services, including local and remote
	 * services. Used by PZH.
	 * @param exceptAddress Address of services that match will be excluded from
	 * results.
	 * @returns Array with known services.
	 */
	_RPCHandler.prototype.getAllServices = function(exceptAddress) {
		var results = [];
		
		function isNotExceptAddress(el) {
			return (el.serviceAddress !== exceptAddress) ? true : false;
		}
		results = this.remoteServiceObjects.filter(isNotExceptAddress);
		
		results = results.concat(this.getRegisteredServices());
		
		return results;
	};
	
	/**
	 * Get an array of all registered Service objects. 
	 * @returns Array with said objects.
	 */
	_RPCHandler.prototype.getRegisteredServices = function() {
		// FIXME this shouldn't be a public method i guess
		var results = [];
		
		for (var service in this.objects) {
			results = results.concat(this.objects[service]);
		}
		
		function getServiceInfo(el) {
			el = el.getInformation();
			el.serviceAddress = sessionId;
			return el;
		}
		return results.map(getServiceInfo);
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
	 * @constructor
	 * @param obj Object with fields describing the service.
	 */
	this.RPCWebinosService = function (obj) {
		if (!obj) {
			this.id = '';
			this.api = '';
			this.displayName = '';
			this.description = '';
			this.serviceAddress = '';
		} else {
			this.id = obj.id || '';
			this.api = obj.api || '';
			this.displayName = obj.displayName || '';
			this.description = obj.description || '';
			this.serviceAddress = obj.serviceAddress || '';
		}
	};
	
	/**
	 * Get an information object from the service.
	 * @returns Object including id, api, displayName, serviceAddress.
	 */
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
	 * @constructor
	 * @param api String with API URI.
	 */
	this.ServiceType = function(api) {
		if (!api)
			throw new Error('ServiceType: missing argument: api');

		this.api = api; 
	};

	/**
	 * Used to load and register webinos services.
	 * @private
	 * @param modules An array of services, must be valid node add-ons exporting a Service constructor.
	 */
	_RPCHandler.prototype.loadModules = function(modules) {
		if (typeof module === 'undefined') return;
		
		var path = require('path');
		var moduleRoot = require(path.resolve(__dirname, '../dependencies.json'));
		var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
		//We need to add the trailing / or add it later on
		var webinosRoot = path.resolve(__dirname, '../' + moduleRoot.root.location)+'/';
		//sessionPzp = require(path.join(webinosRoot, dependencies.pzp.location, 'lib/session_pzp.js'));
//		if (contextEnabled) {
//		if (require(webinosRoot + dependencies.manager.context_manager.location + 'data/contextSettings.json').contextEnabled){
		  require(webinosRoot + dependencies.manager.context_manager.location); 
			//modules.push(webinosRoot + dependencies.manager.context_manager.location);
//		}
		
		var _modules;
		if (!modules){
			_modules = [];
		} else {
			_modules = modules.slice(0); // copy array
		}
		
		// add ServiceDiscovery, which should always be present
		_modules.unshift({name: "service_discovery", param: {}});

		for (var i = 0; i < _modules.length; i++){
			try{
				var Service = require(webinosRoot + dependencies.api[_modules[i].name].location).Service;
				this.registerObject(new Service(this, _modules[i].params));
			}
			catch (error){
				console.log('INFO: [RPC] '+error);
				console.log('INFO: [RPC] '+"Could not load module " + _modules[i].name + " with message: " + error );
			}
		}		
	};
	
	/**
	 * Set session id.
	 * @param id Session id.
	 */
 	_RPCHandler.prototype.setSessionId = function(id) {
		sessionId = id;
	};
	
	/**
	 * Export definitions for node.js
	 */
	if (typeof module !== 'undefined'){
		exports.RPCHandler = _RPCHandler;
		exports.RPCWebinosService = RPCWebinosService;
		exports.ServiceType = ServiceType;
		//exports.setSessionId = setSessionId;
		// none webinos modules
		var md5 = require('../contrib/md5.js');

	} else {
		// export for web browser
		this.RPCHandler = _RPCHandler;
	}
})();
