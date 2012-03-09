(function() {
	
	"use strict";
	
	var discoverymodule = require('./webinos.discovery.server.js');
	
	var BluetoothManager = function(rpcHandler) {
			this.base = RPCWebinosService;
			this.base({
				api:'http://webinos.org/api/discovery',
				displayName:'Bluetooth discovery manager',
				description:'A simple bluetooth discovery manager'
			});

	// member attribute
	//this.testAttr = "Hello Attribute";

	// member attribute 
	this.listenAttr = {};
	
	// custom get42 attribute
	//this.blaa = typeof params !== 'undefined' ? params[0] : 42;
	
	// member function attached to listenAttr
	this.listenAttr.listenForHRM = function(params, successCB, errorCB, objectRef){
		console.log("listenerForHRM was invoked");
		
		// call the registered listener twice, delivering an object
		for (var i=0; i<2; i++) {
			// use RPC to deliver result
			var rpc = rpcHandler.createRPC(objectRef, 'onEvent', {msg:i + " HRM"});
			rpcHandler.executeRPC(rpc);
		}
	  };

	}

	BluetoothManager.prototype = new RPCWebinosService;

	BluetoothManager.prototype.findHRM = function(data, successCallback){

			discoverymodule.HRMfindservice(
				data, successCallback); 
			
	}
	
	exports.Service = BluetoothManager;
	
})();



