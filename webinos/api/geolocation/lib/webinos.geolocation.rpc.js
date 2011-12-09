if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('../../../common/rpc/lib/rpc.js');

// store running timer objects in this table under given key from caller
var watchIdTable = {};

var counter = 0; // var used for debugging only;
try{
	var vehicleSystem = require('../../vehicle/contrib/vb-con/vc.js');
	var vehicleBusAvailable = vehicleSystem.available;
	var car = vehicleSystem.most;
}catch(e){
	var vehicleBusAvailable = false;
	var car = null;
	console.log('vehicle bus connection module is not available');
}
/*
var Position = function(timestamp, coords){
	this.timestamp = timestamp;
	this.coords = coords;
}

var Coordinates = function(latitude, longitude, altitude, accuracy, altitudeAccuracy, heading, speed){
	this.latitude = latitude;
	this.longitude = longitude;
	this.altitude = altitude;
	this.accuracy = accuracy;
	this.altitudeAccuracy = altitudeAccuracy;
	this.heading = heading
	this.speed = speed;	
}
*/

function getCurrentPosition (params, successCB, errorCB, objectRef){
	var error = {};
	
	if(vehicleBusAvailable){
  		var position = new Object();
  		var d = new Date();
        var stamp = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
        var stamp = stamp + d.getUTCMilliseconds();
  		position.timestamp = stamp; //NEEDS BE CONVERTED TO UTC
  		position.coords = new Object();
  		position.coords.latitude = Math.floor((car.position.latitude.get() / Math.pow(2,32) * 360) * 10000)/10000; 
  		position.coords.longitude = Math.floor((car.position.longitude.get() / Math.pow(2,32) * 360) * 10000)/10000;
		position.coords.accuracy = 99;
		position.coords.heading = car.heading.get();
		position.coords.speed = Math.floor(((car.speed.get() / 10) / 3600) * 1000 *1000) / 1000 ; // meters per second 
 		returnPosition(position, successCB, errorCB, objectRef);
		return;
	}else{
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
}

function watchPosition (args, successCB, errorCB, objectRef) {
	 if(vehicleBusAvailable){
		listeners.push([successCB, errorCB, objectRef, args[1]]);	
		if(!listeningToPosition){
			car.position.bind(vehicleBusHandler);
			listeningToPosition = true;
		}
		console.log(listeners.length + " listener(s) watching");
	}else{
   
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

	var watchId = setInterval(function() {getPos(); }, tint);
	
	var watchIdKey = args[1];
	watchIdTable[watchIdKey] = watchId;
    }
}
function returnPosition(position, successCB, errorCB, objectRef){
	if(position === undefined){
		errorCB('Position could not be retrieved');		
	}else{
		successCB(position);
	}
}

var listeners = new Array();
var listeningToPosition = false;

function vehicleBusHandler(data){
	
	var position = new Object();
 
    var d = new Date();
    var stamp = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
    var stamp = stamp + d.getUTCMilliseconds();
    position.timestamp = stamp;
  	position.coords = new Object();
            
  	position.coords.latitude = Math.floor((data.latitude / Math.pow(2,32) * 360) * 10000)/10000;
  	position.coords.longitude = Math.floor((data.longitude / Math.pow(2,32) * 360) * 10000)/10000;
	position.coords.accuracy = 99;
	position.coords.heading = car.heading.get();
	position.coords.speed = Math.floor(((car.speed.get() / 10) / 3600) * 1000 *1000) / 1000 ; // meters per second
	
	
	for(var i = 0; i < listeners.length; i++){
		returnPosition(position, function(position) {var rpc = webinos.rpc.createRPC(listeners[i][2], 'onEvent', position); webinos.rpc.executeRPC(rpc);}, listeners[i][1], listeners[i][2]);
	}
}

function clearWatch (params, successCB, errorCB, objectRef) {
	
	var watchIdKey = params[0];
	
	if(vehicleBusAvailable){
		for(var i = 0; i < listeners.length; i++){
			if(listeners[i][3] == watchIdKey){
				listeners.splice(i,1);
				console.log('object# ' + watchIdKey + " removed.");
				break;
			}
		}
		if(listeners.length == 0){
			car.position.unbind(vehicleBusHandler);
			listeningToPosition = false;
			console.log('disabled geolocation listening');
		}
	}else{
		
		var watchId = watchIdTable[watchIdKey];
		delete watchIdTable[watchIdKey];
	
		clearInterval(watchId);
	}
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

exports.GeolocationModule = GeolocationModule;
