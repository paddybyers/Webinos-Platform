if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('./rpc.js');

var simTemp = false;
var objectRefs = new Array();


function configureSensor (params, successCB, errorCB, objectRef){
	console.log("configuring temperature sensor");
	
	successCB();
}

function getStaticData(params, successCB, errorCB, objectRef){
	var tmp = {};
	tmp.maximumRange = 100;
	tmp.minDelay = 10;
	tmp.power = 50;
	tmp.resolution = 0.05;
	tmp.vendor = "FhG";  
	tmp.version = "0.1"; 
    successCB(tmp);
};

function addEventListener(eventType, successHandler, errorHandler, objectRef){
	
	console.log("eventType " + eventType);	
		switch(eventType){
			case "temperature":
				objectRefs.push([objectRef, 'temperature']);
				if(!simTemp){ //Listener for gears not yet registered
					simTemp = true;
					simulatateTemp();		
				}			
				break;
			default:
				console.log('Requested EventType is ' + eventType + " but i am temprature");
			
			}	
}


function simulatateTemp(){
  		var tempE = generateTempEvent();
        var randomTime = Math.floor(Math.random()*1000*10);
        var json = null;
        for(i = 0; i < objectRefs.length; i++){
			
				if(objectRefs[i][1] == "temperature"){
                	json = webinos.rpc.createRPC(objectRefs[i][0], "onEvent", tempE);
                 	webinos.rpc.executeRPC(json);
				}
        }
        if(simTemp){
                setTimeout(function(){ simulatateTemp(); }, randomTime);        
        }
}

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

var module = new RPCWebinosService({
	api:'http://webinos.org/api/sensors.temperature',
	displayName:'Sensor',
	description:'A Webinos temperature sensor.'
});
module.configureSensor = configureSensor;
module.getStaticData = getStaticData; 
module.addEventListener = addEventListener;
webinos.rpc.registerObject(module);
