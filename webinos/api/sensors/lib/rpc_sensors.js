(function() {

/**
 * Webinos Service constructor.
 * @param rpcHandler A handler for functions that use RPC to deliver their result.  
 */
var SensorModule = function(rpcHandler) {
	// inherit from RPCWebinosService
	this.base = RPCWebinosService;
	this.base({
		api:'http://webinos.org/api/sensors.temperature',
		displayName:'Sensor',
		description:'A Webinos temperature sensor.'
	});
	
	var simTemp = false;

	this.addEventListener = function (eventType, successHandler, errorHandler, objectRef){
		console.log("eventType " + eventType);	
		switch(eventType){
		case "temperature":
			if(!simTemp){ //Listener for gears not yet registered
				simTemp = true;
				debugger
				simulatateTemp(objectRef);		
			}			
			break;
		default:
			console.log('Requested EventType is ' + eventType + " but i am temprature");

		}	
	};

	function simulatateTemp(objectRef){
		var tempE = generateTempEvent();
		var randomTime = Math.floor(Math.random()*1000*10);
		var json = null;
		debugger

		json = rpcHandler.createRPC(objectRef, "onEvent", tempE);
		rpcHandler.executeRPC(json);
		
		if(simTemp){
			setTimeout(function(){
				simulatateTemp(objectRef);
			}, randomTime);        
		}
	}
};

SensorModule.prototype = new RPCWebinosService;

SensorModule.prototype.configureSensor = function (params, successCB, errorCB, objectRef){
	console.log("configuring temperature sensor");
	
	successCB();
}

SensorModule.prototype.getStaticData = function (params, successCB, errorCB, objectRef){
	var tmp = {};
	tmp.maximumRange = 100;
	tmp.minDelay = 10;
	tmp.power = 50;
	tmp.resolution = 0.05;
	tmp.vendor = "FhG";  
	tmp.version = "0.1"; 
    successCB(tmp);
};

function generateTempEvent(){
    var temp = Math.floor(Math.random()*100);
    return new TempEvent(temp);        
}

function TempEvent(value){
	this.SENSOR_STATUS_ACCURACY_HIGH = 4;
	this.SENSOR_STATUS_ACCURACY_MEDIUM = 3;
	this.SENSOR_STATUS_ACCURACY_LOW = 2;
	this.SENSOR_STATUS_UNRELIABLE = 1;
	this.SENSOR_STATUS_UNAVAILABLE = 0;

	this.sensorType = "temperature";
    this.sensorId = "sensorId (could we use same id as the unique service id here?)";
    this.accuracy = 4;
    this.rate = 2;
    this.interrupt = false;

    this.sensorValues = new Array();
    this.sensorValues[0] = value;
    this.sensorValues[1] = value/100; //because max range is 100
	
}

//export our object
exports.Service = SensorModule;

})();
