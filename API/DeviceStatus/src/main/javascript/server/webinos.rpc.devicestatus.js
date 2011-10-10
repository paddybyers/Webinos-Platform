(function () {
	"use strict";
	var devicestatusmodule = require('./webinos.devicestatus.js').devicestatus,
	rpc = require('../../../../../../RPC/rpc.js'),
	RemoteDeviceStatusManager = {};

	RemoteDeviceStatusManager.getPropertyValue = 
		function (params, successCallback, errorCallback) {
			devicestatusmodule.devicestatus.getPropertyValue(
				function (prop) {
					successCallback(prop);
				},
				function () {},
				params[0]
			);
		};
	
	rpc.registerObject("DeviceStatusManager", RemoteDeviceStatusManager);

}());
