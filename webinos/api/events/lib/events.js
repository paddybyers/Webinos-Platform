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
	this.WebinosEvent.dispatchWebinosEvent = function (params, successCB, errorCB, objectRef){
		//callbacks, referenceTimeout, sync
		console.log("dispatchWebinosEvent was invoked: Payload: " + params.webinosevent.payload);
		
		var useCB = false;
		if (typeof objectRef !== "undefined"){
			useCB = true;
			console.log("Delivery callback defined");
		}
		else{
			console.log("No delivery callback defined");
		}
		
		var outCBParams = {};
		
		var i;
		var j;
		for (i = 0; i < registeredListener.length; i++){
			
			console.log("Listener@" + registeredListener[i].source);
			
			for (j = 0; j < connectedApps.length; j++){
				console.log("Listener@" + registeredListener[i].source + " vs. connected app " + connectedApps[j].params);
				
				if (registeredListener[i].source == connectedApps[j].params){
	            	params.listenerID = registeredListener[i].listenerID;

	            	if (useCB){
	            		var current = connectedApps[j];
	            		outCBParams.event = params.webinosevent;
	            		outCBParams.recipient = current;
	            		var cbjson = rpcHandler.createRPC(objectRef, "onSending", outCBParams);
	            		rpcHandler.executeRPC(cbjson);
					}
	            	
	            	console.log("Sending event to connected app " + connectedApps[j].objectRef);
	            	var json = rpcHandler.createRPC(connectedApps[j].objectRef, "handleEvent", params);
	             	
					rpcHandler.executeRPC(json, function () {
	             		//delivered
						console.log("Delivered Event successfully");
						if (useCB){
							var cbjson = rpcHandler.createRPC(objectRef, "onDelivery", outCBParams);
	             			rpcHandler.executeRPC(cbjson);
	             		}
	             	},
	             	function () {
	             		//error
	             		console.log("Delivering Event not successful");
	             		if (useCB){
	             			outCBParams.error = "Some ERROR";
	             			var cbjson = rpcHandler.createRPC(objectRef, "onError", outCBParams);
	             			rpcHandler.executeRPC(cbjson);
	             		}
	             	});
				}
			}
		}
	};

};

WebinosEventsModule.prototype = new RPCWebinosService;

var registeredListener = [];

var connectedApps = [];

WebinosEventsModule.prototype.registerApplication = function (params, successCB, errorCB, objectRef){
	console.log("registerApplication was invoked: " + params);
	
	var app = {};
	app.params = params;
	app.objectRef = objectRef;
	connectedApps.push(app);
	
	successCB();
}

WebinosEventsModule.prototype.createWebinosEvent = function (params, successCB, errorCB, objectRef){
	console.log("createWebinosEvent was invoked");
};

WebinosEventsModule.prototype.addWebinosEventListener = function (params, successCB, errorCB, objectRef){
	console.log("addWebinosEventListener was invoked with params " + params.type + " " + params.listenerID);
	/*
	 * params attributes
	req.type = type;
	req.source = source;
	req.destination = destination;
	req.listenerID = listenerID;*/
	
	registeredListener.push(params);
}

WebinosEventsModule.prototype.removeWebinosEventListener = function (params, successCB, errorCB, objectRef){
	console.log("removeWebinosEventListener was invoked");
}

exports.Service = WebinosEventsModule;

})();
