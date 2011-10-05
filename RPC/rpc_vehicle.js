if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('./rpc.js');

	
function ShiftEvent(value){
	this.gear = value;
}

function VehicleError(message){
	this.message = message;
}

function get(vehicleDataId, vehicleDataHandler, errorCB){
	
	switch(vehicleDataId[0])
	{
	case "shift":
	  vehicleDataHandler(generateGearEvent());
	  break;
	case "tripcomputer":
	  errorCB(new VehicleError(vehicleDataId[0] + 'not found'));
	  break;
	default:
	  errorCB(new VehicleError(vehicleDataId[0] + 'not found'));
	}
	
	if(vehicleDataId[0] == "shift"){
		
	}else{
		
	}
	
}


//var fHandler = null;
//var eventHandlers = new Array();
var objectRefs = new Array();





var generatingEvents = false;

function addEventListener(vehicleDataId, successHandler, errorHandler, objectRef){
	
	console.log("vehicleDataId " + vehicleDataId);
//	console.log("handler " + successHandler);
//	console.log("capture " + errorHandler);
//	console.log("objectRef " + objectRef);
	
	objectRefs.push(objectRef);	
	if(objectRefs.length == 1){
		generatingEvents = true;
		fireShiftEvents();
	}
	
}


function removeEventListener(objectRefId){
	console.log('Removing object# from listener ' + objectRefId);
	for(i = 0; i < objectRefs.length; i++ ){
		if(objectRefs[i] == objectRefId){
			objectRefs.splice(i,1);
			console.log('object# ' + objectRefId + " removed.");
			break;
		}
	}
	
	if(objectRefs.length  == 0){
		generatingEvents = false;
		console.log('disabling event generation');
	}
}

function fireShiftEvents(){
	var shiftE = generateGearEvent();
	var randomTime = Math.floor(Math.random()*1000*10);
	
	console.log("firing Event to # of handlers:" + objectRefs.length);
	console.log("random Gear:" + shiftE.gear);
	console.log("random Time:" + randomTime);
	
	
	
	
	/*
	for(i = 0; i < eventHandlers.length; i++){
		eventHandlers[i](shiftE);
	}
	*/
	var json = null;
	for(i = 0; i < objectRefs.length; i++){
		json = webinos.rpc.createRPC(objectRefs[i], "onEvent", shiftE);
 		webinos.rpc.executeRPC(json);
	}
	if(generatingEvents){
		setTimeout(function(){ fireShiftEvents(); }, randomTime);	
	}
}


function generateGearEvent(){
	var randomGear = Math.floor(Math.random()*7);
	return new ShiftEvent(randomGear);	
}




var module = new RPCWebinosService({
	api:'http://webinos.org/api/vehicle',
	displayName:'Vehicle',
	description:'Webinos simulated vehicle.'
});
module.get = get;
module.addEventListener = addEventListener;
module.removeEventListener = removeEventListener;
webinos.rpc.registerObject(module);
