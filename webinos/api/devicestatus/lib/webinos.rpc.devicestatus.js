(function () {
	"use strict";

	var rpc = require('../../../common/rpc/lib/rpc.js'),
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
				function (err) {
					errorCallback(err);
				},
				params[2]
			);
		};
	
	rpc.registerObject(RemoteDeviceStatusManager);

}());
