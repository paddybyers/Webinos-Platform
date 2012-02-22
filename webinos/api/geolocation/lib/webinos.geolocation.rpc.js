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

	
	if(vehicleBusAvailable){
        implFile = 'vehicle';
        console.log('connecting to vehicle');
    }else if(vehicleSimulatorAvailable){
        implFile = 'sim';
        console.log('connecting to simulator');
        console.log('simulator available at http://localhost:9898/simulator/vehicle.html');
    }else{
        implFile = 'geoip';
		console.log('using geo ip');
    }
    
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
