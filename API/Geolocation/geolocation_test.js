if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('./rpc.js');

function getgeo (params, successCB, errorCB, objectRef){

	if (navigator.geolocation) {
	  navigator.geolocation.getCurrentPosition(success, error);
	} else {
	  error('not supported');
	}

	successCB(success);
}

testModule = {};
testModule.getgeo = getgeo;
webinos.rpc.registerObject("Test", testModule);
