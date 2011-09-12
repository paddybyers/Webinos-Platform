(function() {

	TestModule = function (){
		
	};
	
	TestModule.prototype.geolocation = function (successCB) {
		var rpc = webinos.rpc.createRPC("Test", "geolocation", arguments);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);
	}
	
}());