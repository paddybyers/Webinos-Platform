(function() {

	Sensor = function (){
       

	};
	
	
	Sensor.prototype = WebinosService.prototype;
	
	Sensor.prototype.bind = function(success) {
		 	this.maximumRange = 0;
	        this.minDelay = 5;
	        this.power = 10;
	        this.resolution = 50;
	        this.vendor = "FhG";  
	        this.version = 5.0; 
	        
	        this.configureSensor = function (options, successCB, errorCB){
	    		//thows (SensorException);
	    			        	
	    		var rpc = webinos.rpc.createRPC("Sensor", "configureSensor", arguments[0]);
	    		webinos.rpc.executeRPC(rpc,
	    				function (){
	    					successCB();
	    				},
	    				function (error){}
	    		);
	    		
	    	};
	    	
	    	this.addEventListener = function (eventType, callback) {
	    		//TODO register callback for RPC
	    	};
	    	
	    	success();
	};
	
}());