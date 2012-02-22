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
* Copyright 2011 Alexander Futasz, Fraunhofer FOKUS
******************************************************************************/
(function() {

	Sensor = function(obj) {
       this.base = WebinosService;
       this.base(obj);
	};
	Sensor.prototype = new WebinosService;
	
	Sensor.prototype.bindService = function(success) {
		 	
		var self = this;
		
		var rpc = webinos.rpcHandler.createRPC(this, "getStaticData", []);
		
		webinos.rpcHandler.executeRPC(rpc,
				function (result){
			
					var _referenceMapping = new Array();
					
					self.maximumRange = result.maximumRange;
					self.minDelay = result.minDelay;
					self.power = result.power;
					self.resolution = result.resolution;
					self.vendor = result.vendor;  
					self.version = result.version; 
	        
					self.configureSensor = function (options, successCB, errorCB){
						//thows (SensorException);
						var rpc = webinos.rpcHandler.createRPC(this, "configureSensor", arguments[0]);
						webinos.rpcHandler.executeRPC(rpc,
								function (){
							successCB();
	    					},
	    					function (error){
	    						errorCB();
	    					}
						);
					};
	    	
					self.addEventListener = function(eventType, eventHandler, capture) {
	
							var rpc = webinos.rpcHandler.createRPC(this, "addEventListener", eventType);
							rpc.fromObjectRef = Math.floor(Math.random()*101); //random object ID	
							
							_referenceMapping.push([rpc.fromObjectRef, eventHandler]);
							console.log('# of references' + _referenceMapping.length);
							
							var callback = new RPCWebinosService({api:rpc.fromObjectRef});
							callback.onEvent = function (vehicleEvent) {
								eventHandler(vehicleEvent);
							};
							webinos.rpcHandler.registerCallbackObject(callback);
							
							webinos.rpcHandler.executeRPC(rpc);
	
					};
	    	
					success();
				},
				function (error){
					
				}
		);
	};
	
}());