(function() {

function VehicleModule(rpcHandler) {
	
    var vehicleBusAvailable = false;
    var vehicleSimulatorAvailable = false;
    var car = null;
    
    // figure out which impl to use
	try{
		var vehicleSystem = require('../../vehicle/contrib/vb-con/vc.js');
		var vehicleBusAvailable = vehicleSystem.available;
		var car = vehicleSystem.most;
	}catch(e){
        try{
        //try to getSimulator
        var car = require('../../vehicle/contrib/vb-sim/vs.js');
		var vehicleSimulatorAvailable = true;
        
        }catch(e){
            console.log(e);
        }
    }
	
	var implFile;
    
    if(vehicleBusAvailable){
        implFile = 'vehicle';
        console.log('connecting to vehicle');
    }else if(vehicleSimulatorAvailable){
        implFile = 'sim';
               console.log('connecting to simulator');
               console.log('simulator available at http://localhost:9898/simulator/vehicle.html');
    }else{
        implFile = 'fake';
               console.log('connecting to fake data generator');
    }
    
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
