if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('./rpc.js');

function getCurrentPosition (params, successCB, errorCB, objectRef){
  	if (params['method'] == "native") {	
		var util = require('util');
	    var exec = require('child_process').exec;
	    var child;
		var location = null;

		childCB = function (error, stdout, stderr) {
		    location = stdout;
			successCB(location);
		    if (error !== null) {
		    	console.log('exec error: ' + error);
		    }
		};
		child = exec('echo this is your location', childCB); 	// see http://nodejs.org/docs/v0.5.4/api/child_processes.html	
	} else { 
		var result={};
		var http = require('http');
		var freegeoip = http.createClient(80, 'freegeoip.net');
		var request = freegeoip.request('GET', '/json/', {'host': 'freegeoip.net'});
		request.end();
		request.on('response', function (response) {
		  // console.log('STATUS: ' + response.statusCode);
		  // console.log('HEADERS: ' + JSON.stringify(response.headers));
		  response.setEncoding('utf8');
		  response.on('data', function (chunk) {
		    console.log('chunk: ' + chunk);
		    result = JSON.parse(chunk);
			var coords = new Object;
			coords.latitude = result['latitude'];
			coords.longitude = result['longitude'];
			coords["accuracy"] = null;			
			coords["altitude"] = null;
			coords["altitudeAccuracy"] = null;
			coords["heading"] = null;
			coords["speed"] = null;
			var position = new Object;
			position.coords=coords;
		    position.timestamp = new Date().getTime();
			successCB(position);
		  });
		});		
	}
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
webinos.rpc.registerObject("Geolocation", GeolocationModule);  // RPC name for the service: Geolocation
