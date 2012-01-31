(function() {

	/**
	 * Webinos Service constructor.
	 * @param rpcHandler A handler for functions that use RPC to deliver their result.  
	 */
	var WebinosEventsModule = function(rpcHandler) {
		// inherit from RPCWebinosService
		this.base = RPCWebinosService;
		this.base({
			api:'http://webinos.org/api/events',
			displayName:'Events API',
			description:'The events API for exchanging simple events between applications running on multiple or the same device.'
		});

		this.WebinosEvent = {};
		this.WebinosEvent.dispatchWebinosEvent = function (params, successCB, errorCB, ref){
			//callbacks, referenceTimeout, sync
			console.log("dispatchWebinosEvent was invoked: Payload: " + params.webinosevent.payload);

			var objectRef = ref;
			var useCB = false;

			if (typeof objectRef !== "undefined"){
				useCB = true;
				console.log("Delivery callback was defined.");
			}
			else{
				console.log("No delivery callback defined");
			}

			var i;
			var foundDestination = false;

			console.log("Available Listeners:" + registeredListener.length);
			for (i = 0; i < registeredListener.length; i++){
				console.log("Listener@" + registeredListener[i].source);
			}


			//TODO, check conditions like type etc.
			//going through all registered subscribers and forward event
			for (i = 0; i < registeredListener.length; i++){
			


				console.log("Sending to LISTENER: " + registeredListener[i].source);

				foundDestination = true;

				//if delivery notification is requested (callback is defined) then send onSending notification
				if (useCB){
					var outCBParams = {};
					outCBParams.event = params.webinosevent;
					outCBParams.recipient = registeredListener[i].source;
					var cbjson = rpcHandler.createRPC(objectRef, "onSending", outCBParams);
					rpcHandler.executeRPC(cbjson);
				}

				console.log("Sending event to connected app " + registeredListener[i].objectRef);

				
				var json = rpcHandler.createRPC(registeredListener[i].objectRef, "handleEvent", params);
				
				var outParams = {};
				outParams.event = params.webinosevent;
				outParams.recipient = registeredListener[i].source;
				rpcHandler.executeRPC(json, 
						getSuccessCB(rpcHandler,objectRef, outParams, useCB),
						getErrorCB(rpcHandler,objectRef, outParams, useCB)
				);

			}


			//if delivery notification is requested (callback is defined) and no recipient could be identified then send onError notification
			if (!foundDestination && useCB){
				outCBParams.error = "An ERROR occured: Destination Not Registered";
				var cbjson = rpcHandler.createRPC(objectRef, "onError", outCBParams);
				rpcHandler.executeRPC(cbjson);
			}
		};
	};
	
	function getSuccessCB(rpcHandler, ref, params, useCB) {
		var objectRef = ref;
		var cbParams = params;
		function successCB() {  
			//	event was successfully delivered, so send delivery notification if requested
			console.log("Delivered Event successfully");
			if (useCB){
				console.log("Sending onDelivery to " + objectRef);
				var cbjson = rpcHandler.createRPC(objectRef, "onDelivery", cbParams);
				rpcHandler.executeRPC(cbjson);
			}
		}
		return successCB;  
	}  


	function getErrorCB(rpcHandler, ref, params, useCB) {
		var objectRef = ref;
		var cbParams = params;
		function errorCB() {  
			//event was not successfully delivered, so send error notification if requested
			console.log("Delivering Event not successful");
			if (useCB){
				outCBParams.error = "Some ERROR";
				var cbjson = rpcHandler.createRPC(objectRef, "onError", outCBParams);
				rpcHandler.executeRPC(cbjson);
			}
		}
		return errorCB;  
	}  


	WebinosEventsModule.prototype = new RPCWebinosService;

	var registeredListener = [];


	WebinosEventsModule.prototype.createWebinosEvent = function (params, successCB, errorCB, objectRef){
		console.log("createWebinosEvent was invoked");
	};

	WebinosEventsModule.prototype.addWebinosEventListener = function (params, successCB, errorCB, objectRef){
		console.log("addWebinosEventListener was invoked with params type: " + params.type + " source: " + params.source + " dest: " + params.destination);
		/*
		 * params attributes
	req.type = type;
	req.source = source;
	req.destination = destination;
	req.listenerID = listenerID;*/
		params.objectRef = objectRef;
		registeredListener.push(params);
	};

	WebinosEventsModule.prototype.removeWebinosEventListener = function (params, successCB, errorCB, objectRef){
		console.log("removeWebinosEventListener was invoked");
	};

	exports.Service = WebinosEventsModule;

})();
