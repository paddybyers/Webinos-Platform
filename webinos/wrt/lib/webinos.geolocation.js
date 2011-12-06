
var WebinosGeolocation = function (obj) {
	this.base = WebinosService;
	this.base(obj);
};

WebinosGeolocation.prototype = new WebinosService;

WebinosGeolocation.prototype.getCurrentPosition = function (PositionCB, PositionErrorCB, PositionOptions) { 
	var rpc = webinos.rpc.createRPC(this, "getCurrentPosition", PositionOptions); // RPC service name, function, position options
	webinos.rpc.executeRPC(rpc, function (position) {
		PositionCB(position); 
	},
	function (error) {
		PositionErrorCB(error);
	});
};

WebinosGeolocation.prototype.watchPosition = function (PositionCB, PositionErrorCB, PositionOptions) {
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

WebinosGeolocation.prototype.clearWatch = function (watchId) {
	var rpc = webinos.rpc.createRPC(this, "clearWatch", [watchId]); 
	webinos.rpc.executeRPC(rpc, function() {}, function() {});
};
