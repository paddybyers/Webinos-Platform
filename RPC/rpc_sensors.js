if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('./rpc.js');

function configureSensor (params, successCB, errorCB, objectRef){
	successCB();
}


sensor = {};
sensor.configureSensor = configureSensor;
webinos.rpc.registerObject("Sensor", sensor);
