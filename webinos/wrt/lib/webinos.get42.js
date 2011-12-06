(function() {

	TestModule = function(obj) {
		this.base = WebinosService;
		this.base(obj);
		
		var that = this;
		
		this._testAttr = "HelloWorld";
		this.__defineGetter__("testAttr", function (){
			return that._testAttr + " Success";
		});
		
		this.echoAttr = {};

		this.echoAttr.echo = function (attr, successCB) {
			var rpc = webinos.rpc.createRPC(that, "echoAttr.echo", [ attr]);
			webinos.rpc.executeRPC(rpc,
					function (params){
						successCB(params);
					},
					function (error){}
			);
		};

	};
	
	TestModule.prototype = new WebinosService;
	
	TestModule.prototype.get42 = function (successCB) {
		console.log(this.id);
		var rpc = webinos.rpc.createRPC(this, "get42",  []);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);
	}
	
}());