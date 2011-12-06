if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('../../../common/rpc/lib/rpc.js');

// store running timer objects in this table under given key from caller
var watchIdTable = {};

var counter = 0; // var used for debugging only;

function getCurrentPosition (params, successCB, errorCB, objectRef){
	var error = {};
	var geoip = null;
	var http = require('http');
	var freegeoip = http.createClient(80, 'freegeoip.net');
	var request = freegeoip.request('GET', '/json/', {'host': 'freegeoip.net'});
	request.end();
	request.on('response', function (response) {
		// console.log('STATUS: ' + response.statusCode);
		// console.log('HEADERS: ' + JSON.stringify(response.headers));
		response.setEncoding('utf8');
		response.on('data', function (chunk) {
			console.log('geoip chunk: ' + chunk);
			try { 
				geoip = JSON.parse(chunk);
			}
			catch(err) {
				error.code = 2; 
				error.message = "failed getting IP address based geolocation";
				console.log("error: " + JSON.stringify(error));
				errorCB(error);
				return;
			}

			var coords = new Object;
			if (params) {
				if (params.enableHighAccuracy) coords.accuracy = 1; else coords.accuracy = null; // simply reflect input for debugging
			}
			coords.altitude = counter++;
			coords.altitudeAccuracy = null;
			coords.heading = null;
			coords.speed = Math.floor(Math.random()*1000)/10;
		
			if (geoip) {
				if (geoip.latitude) coords.latitude = geoip.latitude; else coords.latitude = null; 
				if (geoip.longitude) coords.longitude = geoip.longitude; else coords.longitude = null; 
			}	
			var position = new Object;
			position.coords=coords;
			position.timestamp = new Date().getTime();
			
			if ((position.coords.latitude) && (position.coords.longitude)) {
				successCB(position);
				return;
			}
			else {
				error.code = 2; 
				error.message = "failed getting IP address based geolocation";
				console.log("error: " + JSON.stringify(error));
				errorCB(error);
				return;
			}
	
		});	 
	});			
	
}

function watchPosition (args, successCB, errorCB, objectRef) {
	var tint = 2000;
	var params = args[0];
	if (params.maximumAge) tint = params.maximumAge;
	
	function getPos() {
		// call getCurrentPosition and pass back the position
		getCurrentPosition(params, function(e) {
			var rpc = webinos.rpc.createRPC(objectRef, 'onEvent', e);
			webinos.rpc.executeRPC(rpc);
		}, errorCB, objectRef);
	}
	
	// initial position
	getPos();

	var watchId = setInterval(function() {
		// periodically position
		getPos();

	}, tint);
	
	var watchIdKey = args[1];
	watchIdTable[watchIdKey] = watchId;
}

function clearWatch (params, successCB, errorCB, objectRef) {
	var watchIdKey = params[0];
	var watchId = watchIdTable[watchIdKey];
	delete watchIdTable[watchIdKey];
	
	clearInterval(watchId);
}

var GeolocationModule = new RPCWebinosService({
	api:'http://www.w3.org/ns/api-perms/geolocation',
	displayName:'Geolocation',
	description:'The W3C Geolocation API'
});
GeolocationModule.getCurrentPosition = getCurrentPosition;
GeolocationModule.watchPosition = watchPosition;
GeolocationModule.clearWatch = clearWatch;
webinos.rpc.registerObject(GeolocationModule);  // RPC name
