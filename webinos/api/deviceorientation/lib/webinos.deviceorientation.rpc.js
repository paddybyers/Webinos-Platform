(function() {

function DeviceOrientationModule(rpcHandler) {
	// figure out which impl to use
	try{
		var vehicleSystem = require('../../vehicle/contrib/vb-con/vc.js');
		var vehicleBusAvailable = vehicleSystem.available;
		var car = vehicleSystem.most;
	}catch(e){
		var vehicleBusAvailable = false;
		var car = null;
	}
	
	var implFile = vehicleBusAvailable ? 'vehicle' : 'fake';
	var implModule = require('./webinos.deviceorientation.' + implFile + '.js');

	implModule.setRPCHandler(rpcHandler);
	implModule.setRequired(car);
	
	// inherit from RPCWebinosService
	this.base = RPCWebinosService;
	this.base(implModule.serviceDesc);




	
	this.addEventListener = function(params, successCB, errorCB, objectRef) {
		implModule.addEventListener(params, successCB, errorCB, objectRef);
	};
	
	this.removeEventListener = function(args, successCB, errorCB, objectRef) {
		implModule.removeEventListener(args, successCB, errorCB, objectRef);
	};
	}
    
    DeviceOrientationModule.prototype = new RPCWebinosService;
    exports.Service = DeviceOrientationModule;

})();
