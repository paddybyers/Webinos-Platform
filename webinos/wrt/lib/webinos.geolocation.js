(function() {
	
WebinosGeolocation = function (obj) {
	this.base = WebinosService;
	this.base(obj);
};

WebinosGeolocation.prototype = new WebinosService;

WebinosGeolocation.prototype.bindService = function (bindCB, serviceId) {
	// actually there should be an auth check here or whatever, but we just always bind
	this.getCurrentPosition = getCurrentPosition;
	this.watchPosition = watchPosition;
	this.clearWatch = clearWatch;
	
	if (typeof bindCB.onBind === 'function') {
		bindCB.onBind(this);
	};
}

function getCurrentPosition(PositionCB, PositionErrorCB, PositionOptions) { 
	var rpc = webinos.rpc.createRPC(this, "getCurrentPosition", PositionOptions); // RPC service name, function, position options
	webinos.rpc.executeRPC(rpc, function (position) {
		PositionCB(position); 
	},
	function (error) {
		PositionErrorCB(error);
	});
};

function watchPosition(PositionCB, PositionErrorCB, PositionOptions) {
	var watchIdKey = Math.floor(Math.random()*101);

	var rpc = webinos.rpc.createRPC(this, "watchPosition", [PositionOptions, watchIdKey]);
	rpc.fromObjectRef = Math.floor(Math.random()*101); //random object ID	

	var callback = new RPCWebinosService({api:rpc.fromObjectRef});
	callback.onEvent = function (position) {
		PositionCB(position); 
	};
	webinos.rpc.registerCallbackObject(callback);

	webinos.rpc.executeRPC(rpc);

	return watchIdKey;
};

function clearWatch(watchId) {
	var rpc = webinos.rpc.createRPC(this, "clearWatch", [watchId]); 
	webinos.rpc.executeRPC(rpc, function() {}, function() {});
};

})();