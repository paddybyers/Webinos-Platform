(function() {

	TestModule = function (){
		this._testAttr = "HelloWorld";
		this.__defineGetter__("testAttr", function (){
			return this._testAttr + " Success";
		});
		
		this.echoAttr = new EchoObj();
		
	};
	
	TestModule.prototype = WebinosService.prototype;
	
	TestModule.prototype.get42 = function (successCB) {
		var rpc = webinos.rpc.createRPC("Test", "get42",  []);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);
	}
	
	EchoObj = function (){
	
		
	};
	
	EchoObj.prototype.echo = function (attr, successCB) {
		var rpc = webinos.rpc.createRPC("Test", "echoAttr.echo", [ attr]);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);
	}
	
}());