(function() {

	TestModule = function (){
		
	};
	
	TestModule.prototype.get42 = function (successCB) {
		var rpc = webinos.rpc.createRPC("Test", "get42", arguments);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);
	}
	
}());