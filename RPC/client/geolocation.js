(function() {

	TestModuleGeo = function(obj) {
		this.base = WebinosService;
		this.base(obj);
	};
	
	TestModuleGeo.prototype = new WebinosService;
	
	TestModuleGeo.prototype.getCurrentPosition = function (successCB) {
		var rpc = webinos.rpc.createRPC(this, "getCurrentPosition", arguments); // RPCservicename, function
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);
	};
	
}());