(function() {

	TestModuleGeo = function (){
		
	};
	
	TestModuleGeo.prototype.getCurrentPosition = function (successCB) {
		var rpc = webinos.rpc.createRPC("Geolocation", "getCurrentPosition", arguments); // RPCservicename, function
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);
	};

	TestModuleGeo.prototype.watchPosition = function (successCB) {
		var rpc = webinos.rpc.createRPC("Geolocation", "watchPosition", arguments); // RPCservicename, function
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);
	};

	TestModuleGeo.prototype.clearWatch = function (successCB) {
		var rpc = webinos.rpc.createRPC("Geolocation", "clearWatch", arguments); // RPCservicename, function
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);
	};
	
}());