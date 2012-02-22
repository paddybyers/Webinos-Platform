/*******************************************************************************
*  Code contributed to the webinos project
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
* 
*     http://www.apache.org/licenses/LICENSE-2.0
* 
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
* Copyright 2012 BMW AG
******************************************************************************/

(function() {

function VehicleModule(rpcHandler) {
	
    var vehicleBusAvailable = false;
    var vehicleSimulatorAvailable = false;
    var car = null;
    
    // figure out which impl to use
	try{
		var vehicleSystem = require('../../vehicle/contrib/vb-con/vc.js');
		vehicleBusAvailable = vehicleSystem.available;
		car = vehicleSystem.most;
	}catch(e){
        console.log(e);
    }
    if(!vehicleBusAvailable){
    	try{
            //try to getSimulator
            car = require('../../vehicle/contrib/vb-sim/vs.js');
            vehicleSimulatorAvailable = true;
        }catch(e){
            vehicleSimulatorAvailable = false;
            console.log(e);
        }
    }

	var implFile;
    
    if(vehicleBusAvailable){
        implFile = 'most';
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
