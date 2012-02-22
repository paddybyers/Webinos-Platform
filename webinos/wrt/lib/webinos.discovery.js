(function() {

	BluetoothManager = function(obj) {
		this.base = WebinosService;
		this.base(obj);
	};
	
	BluetoothManager.prototype = new WebinosService;
  
	BluetoothManager.prototype.bindService = function (bindCB, serviceId) {
		// actually there should be an auth check here or whatever, but we just always bind
		this.findHRM = findHRM;
		this.listenAttr = {};
		this.listenerForHRM = listenerForHRM.bind(this);
		
		if (typeof bindCB.onBind === 'function') {
			bindCB.onBind(this);
		};
	}


	function listenerForHRM(listener, options) {
		var rpc = webinos.rpcHandler.createRPC(this, "listenAttr.listenForHRM", [options]);
		rpc.fromObjectRef = Math.floor(Math.random()*101); //random object ID	

		// create a temporary webinos service on the browser
		var callback = new RPCWebinosService({api:rpc.fromObjectRef});
		callback.onEvent = function (obj) {
			// we were called back, now invoke the given listener
			listener(obj); 
		};
		webinos.rpcHandler.registerCallbackObject(callback);

	//	webinos.rpcHandler.executeRPC(rpc);
	 	webinos.rpcHandler.executeRPC(rpc, function(params) {
		success(params);
  	 });
	}

	BluetoothManager.prototype.findHRM = function(data, success){
		console.log("HRM find HRM");
  		var rpc = webinos.rpcHandler.createRPC(this, "findHRM",arguments);
	  	webinos.rpcHandler.executeRPC(rpc, function(params) {
		success(params);
  	 });
	};
 
}());
