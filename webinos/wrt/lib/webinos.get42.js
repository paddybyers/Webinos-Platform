(function() {

	TestModule = function(obj) {
		this.base = WebinosService;
		this.base(obj);
		
		this._testAttr = "HelloWorld";
		this.__defineGetter__("testAttr", function (){
			return this._testAttr + " Success";
		});
	};
	
	TestModule.prototype = new WebinosService;
	
	TestModule.prototype.bindService = function (bindCB, serviceId) {
		// actually there should be an auth check here or whatever, but we just always bind
		this.get42 = get42;
		this.echoAttr = {};
		this.echoAttr.echo = echo.bind(this);
		
		if (typeof bindCB.onBind === 'function') {
			bindCB.onBind(this);
		};
	}
	
	function get42(successCB) {
		console.log(this.id);
		var rpc = webinos.rpc.createRPC(this, "get42",  []);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);
	}
	
	function echo(attr, successCB) {
		var rpc = webinos.rpc.createRPC(this, "echoAttr.echo", [attr]);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);
	}
	
}());