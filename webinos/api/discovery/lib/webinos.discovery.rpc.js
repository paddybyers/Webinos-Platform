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
	
	BluetoothManager.prototype.findservices = function(srvtype, successCallback){
		
		console.log("BT Discovery called on rpc receiver");
		//discoverymodule.findservices(
		discoverymodule.BTfindservice(
				srvtype,
				function (srv) {
					successCallback(srv);
				}
			);
	  return;
	}
	
	BluetoothManager.prototype.bindservice = function(data, successCallback){
		
		discoverymodule.BTbinddservice(
				data,
				function(dev) {
					successCallback(dev);
				}
			);
	  return;
	}
	
	BluetoothManager.prototype.listfile = function(data, successCallback){
		
		discoverymodule.BTlistfile(
		
				data,
				function(list) {
					successCallback(list);
				}
			);
	  return;

	}
	
	BluetoothManager.prototype.transferfile = function(data, successCallback){

		discoverymodule.BTtransferfile(
				data,
				function(file) {
					successCallback(file);
				}
			);
	return;
	} 
	exports.Service = BluetoothManager;
	
})();
