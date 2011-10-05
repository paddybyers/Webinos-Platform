/*
* PLEASE NOTE THIS CODE CURRENTLY DOES NOT CONTAIN ACCESS TO ACTUAL VEHICLE DATA DUE TO COPYRIGTH ISSUES.
* Simon Isenberg
*/


if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('./rpc.js');


function ShiftEvent(value){
	this.gear = value;
}

function TripComputerEvent(avgCon1, avgCon2, avgSpeed1, avgSpeed2, tripDistance, mileage, range){
	this.averageConsumption1 = avgCon1;
	this.averageConsumption2 = avgCon2;
	this.averageSpeed1 = avgSpeed1;
	this.averageSpeed2 = avgSpeed2;
	this.tripDistance = tripDistance;
	this.mileage = mileage;
	this.range = range;
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
	vehicleDataHandler(generateTripComputerEvent());
	  break;
	case "parksensonrs-front":
		console.log("Parksensors in the front");
		break;
	case "parksensors-rear":
		console.log("Parksensors in the rear");
		break;	
	default:
	  errorCB(new VehicleError(vehicleDataId[0] + 'not found'));
	}
}

//Objects references for handling EventListeners
var objectRefs = new Array();


//BOOLs for handling listeners (are there active listeners)
var listeningToGear = false;
var listeningToTripComputer = false;

function addEventListener(vehicleDataId, successHandler, errorHandler, objectRef){
	
	console.log("vehicleDataId " + vehicleDataId);	
		switch(vehicleDataId){
			case "shift":
				objectRefs.push([objectRef, 'shift']);
				if(!listeningToGear){ //Listener for gears not yet registered
					listeningToGear = true;
					handleShiftEvents();		
				}			
				break;
			case "tripcomputer":
				objectRefs.push([objectRef, 'tripcomputer']);
				if(!listeningToTripComputer){
					listeningToTripComputer = true;
					handleTripComputerEvents();	
					
				}
				break;	
			default:
				console.log('nothing to do: Errors...');
			
			}	
}


function removeEventListener(arguments){
	
	// arguments[1] = objectReference, arguments[1] = vehicleDataId
	
	console.log('Removing object# from listener ' + arguments[0] + " vehicleDataId: " + arguments[1]);
	var registeredListeners = 0;
	for(i = 0; i < objectRefs.length; i++ ){
		if(objectRefs[i][1] == arguments[1]){
			registeredListeners++;
		}
		if(objectRefs[i][0] == arguments[0]){
			objectRefs.splice(i,1);
			console.log('object# ' + arguments[1] + " removed.");
		}

	}
	
	console.log(registeredListeners);
	if(registeredListeners  <= 1){
		switch(arguments[1]){
			case "shift":
				listeningToGear = false;
				console.log('disabling shift - event generation');
				break;
			case "tripcomputer":
				listeningToTripComputer = false;
				console.log('disabling tripcomputer event generation')
				break;
			default:
				console.log("nothing found");
		
		}
	}
}

function handleShiftEvents(){
  		 var shiftE = generateGearEvent();
        var randomTime = Math.floor(Math.random()*1000*10);
        console.log("random Gear:" + shiftE.gear);
        console.log("random Time:" + randomTime);
        var json = null;
        for(i = 0; i < objectRefs.length; i++){
			
				if(objectRefs[i][1] == "shift"){
                	json = webinos.rpc.createRPC(objectRefs[i][0], "onEvent", shiftE);
                 	webinos.rpc.executeRPC(json);
				}
        }
        if(listeningToGear){
                setTimeout(function(){ handleShiftEvents(); }, randomTime);        
        }
}


function handleTripComputerEvents(){
		var tcEvent = generateTripComputerEvent();
	    var randomTime = Math.floor(Math.random()*1000*10);
		console.log("random tcData:" + tcEvent);
        console.log("random Time:" + randomTime);

        var json = null;
        for(i = 0; i < objectRefs.length; i++){
			
				if(objectRefs[i][1] == "tripcomputer"){
                	json = webinos.rpc.createRPC(objectRefs[i][0], "onEvent", tcEvent);
                 	webinos.rpc.executeRPC(json);
				}
        }
        if(listeningToTripComputer){
                setTimeout(function(){ handleTripComputerEvents(); }, randomTime);        
        }
	
}

function generateGearEvent(){
    var randomGear = Math.floor(Math.random()*7);
    return new ShiftEvent(randomGear);        
}



var mileage = 50123;
var range = 233;	

function generateTripComputerEvent(){
	mileage++;
	range--
	//avgCon1, avgCon2, avgSpeed1, avgSpeed2, tripdistance, mileage, range
	return new TripComputerEvent(5.9, 5.6, 100.5, 122.2, 234.5, mileage, range);
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
