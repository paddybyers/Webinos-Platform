(function() {

	TestModule = function(obj) {
		this.base = WebinosService;
		this.base(obj);
		
		this._testAttr = "HelloWorld";
		this.__defineGetter__("testAttr", function (){
			return this._testAttr + " Success";
		});
		
		this.echoAttr = {};

		var that = this;
		this.echoAttr.echo = function (attr, successCB) {
			var payload = webinos.rpc.createRPC(that, "echoAttr.echo", [ attr]);				
			webinos.message_send(webinos.findServiceBindAddress(), payload, successCB);
		};

	};
	
	TestModule.prototype = new WebinosService;
	
	TestModule.prototype.get42 = function (successCB) {
		var payload = webinos.rpc.createRPC(this, "get42",  []);
		webinos.message_send(webinos.findServiceBindAddress(), payload, successCB);
	}
	
}());
