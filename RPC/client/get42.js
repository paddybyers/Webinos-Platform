(function() {

	TestModule = function (){
		this._testAttr = "HelloWorld";
		this.__defineGetter__("testAttr", function (){
			return this._testAttr + " Success";
		});
		
		
	};
	
	TestModule.prototype = WebinosService.prototype;
	
	TestModule.prototype.get42 = function (successCB) {
		var rpc = webinos.rpc.createRPC("Test", "get42", []);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);
	}
	
	
}());