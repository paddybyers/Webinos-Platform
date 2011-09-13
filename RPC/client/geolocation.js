(function() {

	TestModuleGeo = function (){
		
	};
	
	TestModuleGeo.prototype.geolocation = function (successCB) {
		var rpc = webinos.rpc.createRPC("TestGeo", "geolocation", arguments);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);
	}
	
}());