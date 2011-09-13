if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('./rpc.js');

function getCurrentPosition (params, successCB, errorCB, objectRef){
	
	// see http://nodejs.org/docs/v0.5.4/api/child_processes.html

	
	
	
	successCB("CurrentPosition");
}

function watchPosition (params, successCB, errorCB, objectRef){	
	successCB("watching position");
}

function clearWatch (params, successCB, errorCB, objectRef){	
	successCB("cleared watch");
}

GeolocationModule = {};
GeolocationModule.getCurrentPosition = getCurrentPosition;
GeolocationModule.watchPosition = watchPosition;
GeolocationModule.clearWatch = clearWatch;
webinos.rpc.registerObject("Geolocation", GeolocationModule);  // RPC name
