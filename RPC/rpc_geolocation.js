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
		}
		child = exec('echo this is your location', childCB); 	// see http://nodejs.org/docs/v0.5.4/api/child_processes.html	
		
	} else { 

		var result={};
		var http = require('http');
		var freegeoip = http.createClient(80, 'freegeoip.net');
		var request = freegeoip.request('GET', '/json/',
		  {'host': 'freegeoip.net'});
		request.end();
		request.on('response', function (response) {
		  // console.log('STATUS: ' + response.statusCode);
		  // console.log('HEADERS: ' + JSON.stringify(response.headers));
		  response.setEncoding('utf8');
		  response.on('data', function (chunk) {
		    // console.log('BODY: ' + chunk);
		    result = JSON.parse(chunk);
			location = 'Latitude = ' + result['latitude'] + ', longitude = ' + result['longitude'];
			successCB(location);
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

var GeolocationModule = new RPCWebinosService({
	api:'http://www.w3.org/ns/api-perms/geolocation',
	displayName:'Geolocation',
	description:'The W3C Geolocation API'
});
GeolocationModule.getCurrentPosition = getCurrentPosition;
GeolocationModule.watchPosition = watchPosition;
GeolocationModule.clearWatch = clearWatch;
webinos.rpc.registerObject(GeolocationModule);  // RPC name
