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
	
}());