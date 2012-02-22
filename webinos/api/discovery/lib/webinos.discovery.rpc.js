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
	}

	BluetoothManager.prototype = new RPCWebinosService;

	BluetoothManager.prototype.findHRM = function(data, successCallback){

			discoverymodule.HRMfindservice(
				data, successCallback); 
			
	}
	
	exports.Service = BluetoothManager;
	
})();



