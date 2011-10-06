(function() {

	DeviceStatusModule = function (){
	};
	
	DeviceStatusModule.prototype = WebinosService.prototype;
	
	DeviceStatusModule.prototype.getPropertyValue = function (successCB, errorCB, prop) {
		arguments[0] = prop;
		var rpc = webinos.rpc.createRPC("DeviceStatus", "getPropertyValue",  arguments);
		webinos.rpc.executeRPC(rpc,
				function (result){ successCB(result); },
				function (error) {}
		);
	}

}());
