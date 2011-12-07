(function() {

	Sensor = function(obj) {
       this.base = WebinosService;
       this.base(obj);
	};
	Sensor.prototype = new WebinosService;
	
	Sensor.prototype.bindService = function(success) {
		 	
		var self = this;
		
		var rpc = webinos.rpc.createRPC(this, "getStaticData", []);
		
		webinos.rpc.executeRPC(rpc,
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
						var rpc = webinos.rpc.createRPC(this, "configureSensor", arguments[0]);
						webinos.rpc.executeRPC(rpc,
								function (){
							successCB();
	    					},
	    					function (error){
	    						errorCB();
	    					}
						);
					};
	    	
					self.addEventListener = function(eventType, eventHandler, capture) {
	
							var rpc = webinos.rpc.createRPC(this, "addEventListener", eventType);
							rpc.fromObjectRef = Math.floor(Math.random()*101); //random object ID	
							
							_referenceMapping.push([rpc.fromObjectRef, eventHandler]);
							console.log('# of references' + _referenceMapping.length);
							
							var callback = new RPCWebinosService({api:rpc.fromObjectRef});
							callback.onEvent = function (vehicleEvent) {
								eventHandler(vehicleEvent);
							};
							webinos.rpc.registerCallbackObject(callback);
							
							webinos.rpc.executeRPC(rpc);
	
					};
	    	
					success();
				},
				function (error){
					
				}
		);
	};
	
}());