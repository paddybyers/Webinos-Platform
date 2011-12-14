(function() {

function VehicleModule(rpcHandler) {
	// figure out which impl to use
	try{
		var vehicleSystem = require('../../vehicle/contrib/vb-con/vc.js');
		var vehicleBusAvailable = vehicleSystem.available;
		var car = vehicleSystem.most;
	}catch(e){
		var vehicleBusAvailable = false;
		var car = null;
	}
	
	var implFile = vehicleBusAvailable ? 'most' : 'fake';
	var implModule = require('./webinos.vehicle.' + implFile + '.js');

	implModule.setRPCHandler(rpcHandler);
	implModule.setRequired(car);
	
	// inherit from RPCWebinosService
	this.base = RPCWebinosService;
	this.base(implModule.serviceDesc);



    this.get = function (vehicleDataId, vehicleDataHandler, errorCB){
        implModule.get(vehicleDataId, vehicleDataHandler, errorCB);
    };
    
	
	this.addEventListener = function(params, successCB, errorCB, objectRef) {
		implModule.addEventListener(params, successCB, errorCB, objectRef);
	};
	
	this.removeEventListener = function(args) {
		implModule.removeEventListener(args);
	};
	}
    VehicleModule.prototype = new RPCWebinosService;
    exports.Service = VehicleModule;

})();
