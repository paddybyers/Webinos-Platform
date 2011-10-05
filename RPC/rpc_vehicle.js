/*
* PLEASE NOTE THIS CODE CURRENTLY DOES NOT CONTAIN ACCESS TO ACTUAL VEHICLE DATA DUE TO COPYRIGTH ISSUES.
* Simon Isenberg
*/


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
}


var objectRefs = new Array();
var listeningToGear = false;

function addEventListener(vehicleDataId, successHandler, errorHandler, objectRef){
	
	console.log("vehicleDataId " + vehicleDataId);	
	
	//Currently specific for ShiftEvents
	objectRefs.push(objectRef);
	
		
	if(objectRefs.length == 1){
		switch(vehicleDataId){
			case "shift":
				if(!listeningToGear){ //Listener for gears not yet registered
					listeningToGear = true;
					handleShiftEvents();		
				}			
				break;		
			default:
				
			
			}
		
		

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
		listeningToGear = false;
		console.log('disabling event generation');
	}
}

function handleShiftEvents(){
    var shiftE = generateGearEvent();
        var randomTime = Math.floor(Math.random()*1000*10);
        console.log("firing Event to # of handlers:" + objectRefs.length);
        console.log("random Gear:" + shiftE.gear);
        console.log("random Time:" + randomTime);
        var json = null;
        for(i = 0; i < objectRefs.length; i++){
                json = webinos.rpc.createRPC(objectRefs[i], "onEvent", shiftE);
                 webinos.rpc.executeRPC(json);
        }
        if(listeningToGear){
                setTimeout(function(){ handleShiftEvents(); }, randomTime);        
        }
}

function generateGearEvent(){
    var randomGear = Math.floor(Math.random()*7);
    return new ShiftEvent(randomGear);        
}




Vehicle = {};
Vehicle.get = get;
Vehicle.addEventListener = addEventListener;
Vehicle.removeEventListener = removeEventListener;
webinos.rpc.registerObject("Vehicle", Vehicle);
