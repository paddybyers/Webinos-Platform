if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('./rpc.js');

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


var module = new RPCWebinosService({
	api:'http://webinos.org/api/sensors.temperature',
	displayName:'Sensor',
	description:'A Webinos temperature sensor.'
});
module.configureSensor = configureSensor;
module.getStaticData = getStaticData; 
webinos.rpc.registerObject(module);
