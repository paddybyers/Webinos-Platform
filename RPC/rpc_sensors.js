if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('./rpc.js');

function configureSensor (params, successCB, errorCB, objectRef){
	successCB();
}


var module = new RPCWebinosService({
	api:'http://webinos.org/api/sensors',
	displayName:'Sensor',
	description:'A Webinos sensor.'
});
module.configureSensor = configureSensor;
webinos.rpc.registerObject(module);
