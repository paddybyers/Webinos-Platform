if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('./rpc.js');

function geolocation (params, successCB, errorCB, objectRef){
	successCB(1);
}

testModule = {};
testModule.geolocation = geolocation;
webinos.rpc.registerObject("Test", testModule);
