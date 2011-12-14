// specific implemenation for $CAR
(function() {

// rpcHandler set be setRPCHandler
var rpcHandler = null;

// car info
var car = null;

function getCurrentPosition (params, successCB, errorCB, objectRef){
	var position = new Object();
	var d = new Date();
	var stamp = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
	var stamp = stamp + d.getUTCMilliseconds();
	position.timestamp = stamp;
	position.coords = new Object();
	position.coords.latitude = Math.floor((car.position.latitude.get() / Math.pow(2,32) * 360) * 10000)/10000; 
	position.coords.longitude = Math.floor((car.position.longitude.get() / Math.pow(2,32) * 360) * 10000)/10000;
	position.coords.accuracy = 99;
	position.coords.heading = car.heading.get();
	position.coords.speed = Math.floor(((car.speed.get() / 10) / 3600) * 1000 *1000) / 1000 ; // meters per second 
	returnPosition(position, successCB, errorCB, objectRef);
	return;
}

function watchPosition (args, successCB, errorCB, objectRef) {
	listeners.push([successCB, errorCB, objectRef, args[1]]);	
	if(!listeningToPosition){
		car.position.bind(vehicleBusHandler);
		listeningToPosition = true;
	}
	console.log(listeners.length + " listener(s) watching");
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
		returnPosition(position, function(position) {var rpc = rpcHandler.createRPC(listeners[i][2], 'onEvent', position); rpcHandler.executeRPC(rpc);}, listeners[i][1], listeners[i][2]);
	}
}

function clearWatch(params, successCB, errorCB, objectRef) {
	var watchIdKey = params[0];

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
}

function setRPCHandler(rpcHdlr) {
	rpcHandler = rpcHdlr;
}

function setRequired(obj) {
	car = obj;
}

exports.getCurrentPosition = getCurrentPosition;
exports.watchPosition = watchPosition;
exports.clearWatch = clearWatch;
exports.setRPCHandler = setRPCHandler;
exports.setRequired = setRequired;
exports.serviceDesc = {
		api:'http://www.w3.org/ns/api-perms/geolocation',
		displayName:'Geolocation (by car input)',
		description:'Provides geolocation based on car location.'
};

})(module.exports);
