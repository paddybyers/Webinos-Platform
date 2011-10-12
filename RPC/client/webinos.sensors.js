(function() {

	Sensor = function(obj) {
       this.base = WebinosService;
       this.base(obj);
	};
	Sensor.prototype = new WebinosService;
	
	Sensor.prototype.bind = function(success) {
		 	
		var self = this;
		
		var rpc = webinos.rpc.createRPC(this, "getStaticData", []);
		
		webinos.rpc.executeRPC(rpc,
				function (result){
			
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
	    	
					self.addEventListener = function (eventType, callback) {
						//TODO register callback for RPC
					};
	    	
					success();
				},
				function (error){
					
				}
		);
	};
	
}());