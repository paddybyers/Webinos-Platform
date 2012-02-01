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
		this.listenAttr = {};
		this.listenerFor42 = listenerFor42.bind(this);
		
		if (typeof bindCB.onBind === 'function') {
			bindCB.onBind(this);
		};
	}
	
	function get42(attr, successCB, errorCB) {
		console.log(this.id);
		var rpc = webinos.rpcHandler.createRPC(this, "get42", [attr]);
		webinos.rpcHandler.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){
					errorCB(error);
				}
		);
	}
	
	function listenerFor42(listener, options) {
		var rpc = webinos.rpcHandler.createRPC(this, "listenAttr.listenFor42", [options]);
		rpc.fromObjectRef = Math.floor(Math.random()*101); //random object ID	

		// create a temporary webinos service on the browser
		var callback = new RPCWebinosService({api:rpc.fromObjectRef});
		callback.onEvent = function (obj) {
			// we were called back, now invoke the given listener
			listener(obj); 
		};
		webinos.rpcHandler.registerCallbackObject(callback);

		webinos.rpcHandler.executeRPC(rpc);
	}
	
}());