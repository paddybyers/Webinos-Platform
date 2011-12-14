(function() {

function GeolocationModule(rpcHandler) {
	// figure out which impl to use
	try{
		var vehicleSystem = require('../../vehicle/contrib/vb-con/vc.js');
		var vehicleBusAvailable = vehicleSystem.available;
		var car = vehicleSystem.most;
	}catch(e){
		var vehicleBusAvailable = false;
		var car = null;
	}
	
	var implFile = vehicleBusAvailable ? 'vehicle' : 'geoip';
	var implModule = require('./webinos.geolocation.' + implFile + '.js');

	implModule.setRPCHandler(rpcHandler);
	implModule.setRequired(car);
	
	// inherit from RPCWebinosService
	this.base = RPCWebinosService;
	this.base(implModule.serviceDesc);
	
	this.getCurrentPosition = function(params, successCB, errorCB, objectRef) {
		implModule.getCurrentPosition(params, successCB, errorCB, objectRef);
	};
	
	this.watchPosition = function(args, successCB, errorCB, objectRef) {
		implModule.watchPosition(args, successCB, errorCB, objectRef);
	};
	
	this.clearWatch = function(params, successCB, errorCB, objectRef) {
		implModule.clearWatch(params, successCB, errorCB, objectRef);
	};
    }

    GeolocationModule.prototype = new RPCWebinosService;
    exports.Service = GeolocationModule;

})();
