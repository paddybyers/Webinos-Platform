(function () {
	"use strict";

	rpcfilePath = '../webinos/common/rpc/lib/';
	var rpc = require('../../../../../RPC/'+rpcfilePath +'rpc.js'),
	devicestatusmodule = require('./webinos.devicestatus.js').devicestatus,
	RemoteDeviceStatusManager = new rpc.RPCWebinosService({
		api: 'http://wacapps.net/api/devicestatus',
		displayName: 'DeviceStatus',
		description: 'Get information about the device status.'
	});
	
	RemoteDeviceStatusManager.getPropertyValue = 
		function (params, successCallback, errorCallback) {
			devicestatusmodule.devicestatus.getPropertyValue(
				function (prop) {
					successCallback(prop);
				},
				function (err) {errorCallback(err)},
				params[0]
			);
		};
	
	rpc.registerObject(RemoteDeviceStatusManager);

}());
