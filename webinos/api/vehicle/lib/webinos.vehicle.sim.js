/*
* PLEASE NOTE THIS CODE CURRENTLY DOES NOT CONTAIN ACCESS TO ACTUAL VEHICLE DATA DUE TO COPYRIGHT ISSUES.
* First Author: Simon Isenberg, Second Author: Krishna Bangalore
*/

(function() {

// rpcHandler set be setRPCHandler
var rpcHandler = null;
var vs;



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

//Navigation Event - Destination Reached, Destination Changed, Destination Cancelled
function NavigationEvent(type, address){
    this.type = type;
	this.address = address;
	
}

function Address(contry, region, county, city, street, streetNumber, premises, addtionalInformation, postalCode){
	this.country = country;
	this.region = region;
	this.county = county;
	this.city = city;
	this.street = street;
	this.streetNumber = streetNumber;
	this.premises = premises;
	this.additionalInformation = additionalInformation;
	this.postalCode = postalCode;
}

function ParkSensorEvent(position, left, midLeft, midRight, right){
	this.position = position;
	this.left = left;
	this.midLeft = midLeft;
	this.midRight = midRight;
	this.right = right;
}

function ClimateControlEvent(zone, desiredTemperature, acstatus, ventLevel, ventMode){
	this.zone = zone;
	this.desiredTemperature = desiredTemperature;
	this.acstatus = acstatus;
	this.ventLevel = ventLevel;
	this.ventMode = ventMode;
}

function ControlEvent(controlId, active){
	this.controlId = controlId;
	this.active = active;
}

function VehicleError(message){
	this.message = message;
}



function get(vehicleDataId, vehicleDataHandler, errorCB){
	switch(vehicleDataId[0])
	{
    case "shift":
      vehicleDataHandler(vs.get('gear'));
	  break;
	case "tripcomputer":
		vehicleDataHandler(vs.get('tripcomputer'));
	  break;
	case "parksensors-front":
		vehicleDataHandler(vs.get('parksensors-front'));
		break;
	case "parksensors-rear":
		vehicleDataHandler(vs.get('parksensors-rear'));
		break;	
	case "destination-reached":
		vehicleDataHandler(generateNavigationReachedEvent(vehicleDataId[0]));
	  break;
	case "destination-changed":
		vehicleDataHandler(generateNavigationChangedEvent(vehicleDataId[0]));
	  break;
    case "destination-cancelled":
		vehicleDataHandler(generateNavigationCancelledEvent(vehicleDataId[0]));
	  break;
    case "climate-all":
		vehicleDataHandler(generateClimateControlallEvent(vehicleDataId[0]));
		break;
	case "climate-driver":
		vehicleDataHandler(generateClimateControldriverEvent(vehicleDataId[0]));
		break;		 
    case "climate-passenger-front":
		vehicleDataHandler(generateClimateControlfrontEvent(vehicleDataId[0]));
		break;
	case "climate-passenger-rear-left":
		vehicleDataHandler(generateClimateControlrearleftEvent(vehicleDataId[0]));
		break;
    case "climate-passenger-rear-right":
		vehicleDataHandler(generateClimateControlrearrightEvent(vehicleDataId[0]));
		break;	
    case "lights-fog-front":
		vehicleDataHandler(generateControlEvent(vehicleDataId[0]));
		break;
    case "lights-fog-rear":
		vehicleDataHandler(generateControlEvent(vehicleDataId[0]));
		break;	
    case "lights-signal-left":
		vehicleDataHandler(generateControlEvent(vehicleDataId[0]));
		break;		
    case "lights-signal-right":
		vehicleDataHandler(generateControlEvent(vehicleDataId[0]));
		break;
	case "lights-signal-warn":
		vehicleDataHandler(generateControlEvent(vehicleDataId[0]));
		break;
	case "lights-parking":
		vehicleDataHandler(generateControlEvent(vehicleDataId[0]));
		break;
	case "lights-hibeam":
		vehicleDataHandler(generateControlEvent(vehicleDataId[0]));
		break;
	case "lights-head":
		vehicleDataHandler(generateControlEvent(vehicleDataId[0]));
		break;
    case "wiper-front-wash":
		vehicleDataHandler(generateControlEvent(vehicleDataId[0]));
		break;
    case "wiper-rear-wash":
		vehicleDataHandler(generateControlEvent(vehicleDataId[0]));
		break;	
    case "wiper-automatic":
		vehicleDataHandler(generateControlEvent(vehicleDataId[0]));
		break;		
    case "wiper-front-once":
		vehicleDataHandler(generateControlEvent(vehicleDataId[0]));
		break;
	case "wiper-rear-once":
		vehicleDataHandler(generateControlEvent(vehicleDataId[0]));
		break;
	case "wiper-front-level1":
		vehicleDataHandler(generateControlEvent(vehicleDataId[0]));
		break;
	case "wiper-front-level2":
		vehicleDataHandler(generateControlEvent(vehicleDataId[0]));
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
var listeningToParkSensorsFront = false;
var listeningToParkSensorsRear = false;
var listeningToDestinationReached = false;
var listeningToDestinationChanged = false;
var listeningToDestinationCancelled = false;
var listeningToClimateControlAll = false;
var listeningToClimateControlDriver = false;
var listeningToClimateControlPassFront = false;
var listeningToClimateControlPassRearLeft = false;
var listeningToClimateControlPassRearRight = false;

var listeningToLightsFogFront = false;
var listeningToLightsFogRear = false;
var listeningToLightsSignalLeft = false;
var listeningToLightsSignalRight = false;
var listeningToLightsSignalWarn = false;
var listeningToLightsParking = false;
var listeningToLightsHibeam = false;
var listeningToLightsHead = false;

var listeningToWiperFront = false;
var listeningToWiperRear = false;
var listeningToWiperAutomatic = false;
var listeningToWiperFrontOnce = false;
var listeningToWiperFrontOnce = false;
var listeningToWiperFrontLevel1 = false;
var listeningToWiperFrontLevel2 = false;

/*AddEventListener*/
addEventListener = function (vehicleDataId, successHandler, errorHandler, objectRef){
	
	console.log("vehicleDataId " + vehicleDataId);	
		switch(vehicleDataId){
			case "shift":
				objectRefs.push([objectRef, 'shift']);
				if(!listeningToGear){ //Listener for gears not yet registered
					listeningToGear = true;
				}			
				break;
			case "tripcomputer":
				objectRefs.push([objectRef, 'tripcomputer']);
				if(!listeningToTripComputer){
					listeningToTripComputer = true;
				}
				break;
			case "parksensors-front":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToParkSensorsFront){
					listeningToParkSensorsFront = true;
				}
				break;
			case "parksensors-rear":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToParkSensorsRear){
					listeningToParkSensorsRear = true;
				}
				break;
            case "destination-reached":
				objectRefs.push([objectRef, 'destination-reached']);
				if(!listeningToDestinationReached){
					listeningToDestinationReached = true;
				}
				break;
			case "destination-changed":
				objectRefs.push([objectRef, 'destination-changed']);
				if(!listeningToDestinationChanged){
					listeningToDestinationChanged = true;
					handleNavigationEvents(vehicleDataId);	
				}
				break;
			case "destination-cancelled":
				objectRefs.push([objectRef, 'destination-cancelled']);
				if(!listeningToDestinationCancelled){
					listeningToDestinationCancelled = true;
					handleNavigationEvents(vehicleDataId);	
				}
				break;	
			case "climate-all":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToClimateControlAll){
					listeningToClimateControlAll = true;
					handleClimateControlEvents(vehicleDataId);	
				}
				break;
			case "climate-driver":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToClimateControlDriver){
					listeningToClimateControlDriver = true;
					handleClimateControlEvents(vehicleDataId);	
				}
				break;
			case "climate-passenger-front":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToClimateControlPassFront){
					listeningToClimateControlPassFront = true;
					handleClimateControlEvents(vehicleDataId);	
				}
				break;
			case "climate-passenger-rear-left":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToClimateControlPassRearLeft){
					listeningToClimateControlPassRearLeft = true;
					handleClimateControlEvents(vehicleDataId);	
				}
				break;
			case "climate-passenger-rear-right":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToClimateControlPassRearRight){
					listeningToClimateControlPassRearRight = true;
					handleClimateControlEvents(vehicleDataId);	
				}
				break;
			case "lights-fog-front":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToLightsFogFront){
					listeningToLightsFogRear = true;
					handleLightsWiperControlEvents(vehicleDataId);	
				}
				break;
			case "lights-fog-rear":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToLightsFogRear){
					listeningToLightsFogRear = true;
					handleLightsWiperControlEvents(vehicleDataId);	
				}
				break;
			case "lights-signal-left":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToLightsSignalLeft){
					listeningToLightsSignalLeft = true;
					handleLightsWiperControlEvents(vehicleDataId);	
				}
				break;
			case "lights-signal-right":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToLightsSignalRight){
					listeningToLightsSignalRight = true;
					handleLightsWiperControlEvents(vehicleDataId);	
				}
				break;
			case "lights-signal-warn":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToLightsSignalWarn){
					listeningToLightsSignalWarn = true;
					handleLightsWiperControlEvents(vehicleDataId);	
				}
				break;
			case "lights-parking":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToLightsParking){
					listeningToLightsParking = true;
					handleLightsWiperControlEvents(vehicleDataId);	
				}
				break;
			case "lights-hibeam":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToLightsHibeam){
					listeningToLightsHibeam = true;
					handleLightsWiperControlEvents(vehicleDataId);	
				}
				break;
			case "lights-head":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToLightsHead){
					listeningToLightsHead = true;
					handleLightsWiperControlEvents(vehicleDataId);	
				}
				break;
			case "wiper-front-wash":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToWiperFront){
					listeningToWiperFront = true;
					handleLightsWiperControlEvents(vehicleDataId);	
				}
				break;
			case "wiper-rear-wash":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToWiperRear){
					listeningToWiperRear = true;
					handleLightsWiperControlEvents(vehicleDataId);	
				}
				break;
			case "wiper-automatic":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToWiperAutomatic){
					listeningToWiperAutomatic = true;
					handleLightsWiperControlEvents(vehicleDataId);	
				}
				break;
			case "wiper-front-once":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToWiperFrontOnce){
					listeningToWiperFrontOnce = true;
					handleLightsWiperControlEvents(vehicleDataId);	
				}
				break;
			case "wiper-rear-once":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToWiperRearOnce){
					listeningToWiperRearOnce = true;
					handleLightsWiperControlEvents(vehicleDataId);	
				}
				break;
			case "wiper-front-level1":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToWiperFrontLevel1){
					listeningToWiperFrontLevel1 = true;
					handleLightsWiperControlEvents(vehicleDataId);	
				}
				break;
			case "wiper-front-level2":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToWiperFrontLevel2){
					listeningToWiperFrontLevel2 = true;
					handleLightsWiperControlEvents(vehicleDataId);	
				}
				break;
			default:
				console.log('nothing to do: Errors...');
			
			}	
}


/*RemoveEventListener*/
removeEventListener = function(arguments){
	
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
        console.log('disabling listening to ' + arguments[1] + " Events");
		switch(arguments[1]){
			case "shift":
				listeningToGear = false;
								break;
			case "tripcomputer":
				listeningToTripComputer = false;
				break;
			case "parksensors-front":
				listeningToParkSensorsFront = false;
				break;
			case "parksensors-rear":
				listeningToParkSensorsFront = false;
				break;	
            case "destination-reached":
				listeningToDestinationReached = false;
				break;
			case "destination-changed":
				listeningToDestinationChanged = false;
				break;
            case "destination-cancelled":
				listeningToDestinationCancelled = false;
				break;
			case "climate-all":
				listeningToClimateControlAll = false;
				break;
			case "climate-driver":
				listeningToClimateControlDriver = false;
				break;
			case "climate-passenger-front":
				listeningToClimateControlPassFront = false;
				break;	
            case "climate-passenger-rear-left":
				listeningToClimateControlPassRearLeft = false;
				break;	
            case "climate-passenger-rear-right":
				listeningToClimateControlPassRearRight = false;
				break;		
            case "lights-fog-front":
				listeningToLightsFogFront = false;
				break;
			case "lights-fog-rear":
				listeningToLightsFogRear = false;
				break;
			case "lights-signal-left":
				listeningToLightsSignalLeft = false;
				break;	
			case "lights-signal-right":
				listeningToLightsSignalRight = false;
				break;	
            case "lights-signal-warn":
				listeningToLightsSignalWarn = false;
				break;	
            case "lights-parking":
				listeningToLightsParking = false;
				break;
			case "lights-hibeam":
				listeningToLightsHibeam = false;
				break;
            case "lights-head":
				listeningToLightsHead = false;
				break;
            case "wiper-front-wash":
				listeningToWiperFront = false;
				break;
			case "wiper-rear-wash":
				listeningToWiperRear = false;
				break;
			case "wiper-automatic":
				listeningToWiperAutomatic = false;
				break;	
			case "wiper-front-once":
				listeningToWiperFront = false;
				break;	
            case "wiper-rear-once":
				listeningToWiperRear = false;
				break;	
            case "wiper-front-level1":
				listeningToWiperFrontLevel1 = false;
				break;
			case "wiper-front-level2":
				listeningToWiperFrontLevel2 = false;
				break;				
			default:
				console.log("nothing found");
		
		}
	}
}


/*handleShiftEvents*/
function handleShiftEvents(shiftE){
        if(listeningToGear){
        for(i = 0; i < objectRefs.length; i++){
				if(objectRefs[i][1] == "shift"){
                	json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", shiftE);
                 	rpcHandler.executeRPC(json);
				}
        }
        }
 
}



/*handleTripComputerEvents*/
function handleTripComputerEvents(tcEvent){
    if(listeningToTripComputer){
        for(i = 0; i < objectRefs.length; i++){
				if(objectRefs[i][1] == "tripcomputer"){
                	json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", tcEvent);
                 	rpcHandler.executeRPC(json);
				}
        }
    }
}

/*handleParkSensorsEvent*/
function handleParkSensorsEvents(psEvent){
	if(listeningToParkSensorsFront || listeningToParkSensorsRear){
        for(i = 0; i < objectRefs.length; i++){
			if(objectRefs[i][1] == "parksensors-front"){
   				json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", psEvent);
                rpcHandler.executeRPC(json);
			}
			if(objectRefs[i][1] == "parksensors-rear"){
                    json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", psEvent);
                 	rpcHandler.executeRPC(json);
			}
        }
	}
}


/*handleParkSensorsEvent*/
function handleDestinationReached(psEvent){
	if(listeningToDestinationReached){
        for(i = 0; i < objectRefs.length; i++){
			if(objectRefs[i][1] == "destination-reached"){
   				json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", psEvent);
                rpcHandler.executeRPC(json);
			}

        }
	}
}


// Climate All, Climate Driver, Climate Passenger Front, Climate Passenger Rear Left, Climate Passenger Rear Right

function handleClimateControlEvents(zone){
	var randomTime = Math.floor(Math.random()*1000*10);
        console.log("random Time:" + randomTime);
	for(i = 0; i < objectRefs.length; i++){
			if(objectRefs[i][1] == "climate-all"){
                	var ccEvent = generateClimateControlallEvent(zone);
					json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", ccEvent);
					console.log("random ccData:" + ccEvent.ventLevel);
                 	rpcHandler.executeRPC(json);
			}
			if(objectRefs[i][1] == "climate-driver"){
                	var cc1Event = generateClimateControldriverEvent(zone);
					json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", cc1Event);
					console.log("random ccData:" + cc1Event.ventLevel);
                 	rpcHandler.executeRPC(json);
			}
			if(objectRefs[i][1] == "climate-passenger-front"){
                	var cc2Event = generateClimateControlfrontEvent(zone);
					json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", cc2Event);
					console.log("random ccData:" + cc2Event.ventLevel);
                 	rpcHandler.executeRPC(json);
			}
			if(objectRefs[i][1] == "climate-passenger-rear-left"){
                	var cc3Event = generateClimateControlrearleftEvent(zone);
					json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", cc3Event);
					console.log("random ccData:" + cc3Event.ventLevel);
                 	rpcHandler.executeRPC(json);
			}
			if(objectRefs[i][1] == "climate-passenger-rear-right"){
                	var cc4Event = generateClimateControlrearrightEvent(zone);
					json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", cc4Event);
					console.log("random ccData:" + cc4Event.ventLevel);
                 	rpcHandler.executeRPC(json);
			}
    }
	if(listeningToClimateControlAll || listeningToClimateControlDriver || listeningToClimateControlPassFront || listeningToClimateControlPassRearLeft || listeningToClimateControlPassRearRight){
		setTimeout(function(){ handleClimateControlEvents(zone); }, randomTime);  
	}
}
	
 function generateClimateControlallEvent(zone){
                var desiredTemperatureall = Math.floor(Math.random()*22);
				var acstatus = Math.round(Math.random()*true); 
	            var ventMode = Math.round(Math.random()*true);   
                var ventLevel = Math.floor(Math.random()*10);
				if (desiredTemperatureall > 16 && acstatus == 0 && ventMode == 0){
                console.log(zone + " desired temperature is " + desiredTemperatureall);   
                return new ClimateControlEvent(zone, desiredTemperatureall, acstatus, ventLevel, ventMode);
                }else{
		        var ControlEvent = "Not a desired setting";
			    console.log("Not a desired setting");
			    return new ClimateControlEvent(ControlEvent, desiredTemperatureall, acstatus, ventLevel, ventMode);
		}				
        } 
		
 function generateClimateControldriverEvent(zone){
                var desiredTemperaturedriver =  Math.floor(Math.random()*20);
				var acstatus = Math.round(Math.random()*true); 
	            var ventMode = Math.round(Math.random()*true);   
                var ventLevel = Math.floor(Math.random()*10);
                if (desiredTemperaturedriver > 16 && acstatus == 0 && ventMode == 0){
                console.log(zone + " desired temperature is " + desiredTemperaturedriver);   
                return new ClimateControlEvent(zone, desiredTemperaturedriver, acstatus, ventLevel, ventMode);
                }else{
		        var ControlEvent = "Not a desired setting";
			    console.log("Not a desired setting");
			    return new ClimateControlEvent(ControlEvent, desiredTemperaturedriver, acstatus, ventLevel, ventMode);
		}							
        } 

function generateClimateControlfrontEvent(zone){
				var desiredTemperaturefront =  Math.floor(Math.random()*21);
				var acstatus = Math.round(Math.random()*true); 
	            var ventMode = Math.round(Math.random()*true);   
                var ventLevel = Math.floor(Math.random()*10);
                if (desiredTemperaturefront > 16 && acstatus == 0 && ventMode == 0){
                console.log(zone + " desired temperature is " + desiredTemperaturefront);   
                return new ClimateControlEvent(zone, desiredTemperaturefront, acstatus, ventLevel, ventMode);
                }else{
		        var ControlEvent = "Not a desired setting";
			    console.log("Not a desired setting");
			    return new ClimateControlEvent(ControlEvent, desiredTemperaturefront, acstatus, ventLevel, ventMode);
		}							
        } 

function generateClimateControlrearleftEvent(zone){
                var desiredTemperaturerearleft =  Math.floor(Math.random()*23);
				var acstatus = Math.round(Math.random()*true); 
	            var ventMode = Math.round(Math.random()*true);   
                var ventLevel = Math.floor(Math.random()*10);
                if (desiredTemperaturerearleft > 16 && acstatus == 0 && ventMode == 0){
                console.log(zone + " desired temperature is " + desiredTemperaturerearleft);   
                return new ClimateControlEvent(zone, desiredTemperaturefront, acstatus, ventLevel, ventMode);
                }else{
		        var ControlEvent = "Not a desired setting";
			    console.log("Not a desired setting");
			    return new ClimateControlEvent(ControlEvent, desiredTemperaturerearleft, acstatus, ventLevel, ventMode);
		}								
        } 

function generateClimateControlrearrightEvent(zone){
                var desiredTemperaturerearright =  Math.floor(Math.random()*23);
				var acstatus = Math.round(Math.random()*true); 
	            var ventMode = Math.round(Math.random()*true);   
                var ventLevel = Math.floor(Math.random()*10);
                if (desiredTemperaturerearright > 16 && acstatus == 0 && ventMode == 0){
                console.log(zone + " desired temperature is " + desiredTemperaturerearright);   
                return new ClimateControlEvent(zone, desiredTemperaturerearright, acstatus, ventLevel, ventMode);
                }else{
		        var ControlEvent = "Not a desired setting";
			    console.log("Not a desired setting");
			    return new ClimateControlEvent(ControlEvent, desiredTemperaturerearright, acstatus, ventLevel, ventMode);
		}								
        } 

// Lights - Fog Front, Rear, Hibeam, Signal Right, Warn, Head, Wiper - Front wash, Rear wash, Automatic, Front Once, Rear Once, Front Level1, Front Level2 

function handleLightsWiperControlEvents(controlId){
	var randomTime = Math.floor(Math.random()*1000*10);
        console.log("random Time:" + randomTime);
	for(i = 0; i < objectRefs.length; i++){
			if(objectRefs[i][1] == "lights-fog-front"){
                	var lcEvent = generateControlEvent(controlId);
					json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", lcEvent);
					console.log("random lcData:" + lcEvent.active);
                 	rpcHandler.executeRPC(json);
			}
			if(objectRefs[i][1] == "lights-fog-rear"){
                	var lcEvent = generateControlEvent(controlId);
					json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", lcEvent);
					console.log("random lcData:" + lcEvent.active);
                 	rpcHandler.executeRPC(json);
			}
			if(objectRefs[i][1] == "lights-signal-left"){
                	var lcEvent = generateControlEvent(controlId);
					json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", lcEvent);
					console.log("random lcData:" + lcEvent.active);
                 	rpcHandler.executeRPC(json);
			}
			if(objectRefs[i][1] == "lights-signal-right"){
                	var lcEvent = generateControlEvent(controlId);
					json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", lcEvent);
					console.log("random lcData:" + lcEvent.active);
                 	rpcHandler.executeRPC(json);
			}
			if(objectRefs[i][1] == "lights-signal-warn"){
                	var lcEvent = generateControlEvent(controlId);
					json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", lcEvent);
					console.log("random lcData:" + lcEvent.active);
                 	rpcHandler.executeRPC(json);
			}
			if(objectRefs[i][1] == "lights-parking"){
                	var lcEvent = generateControlEvent(controlId);
					json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", lcEvent);
					console.log("random lcData:" + lcEvent.active);
                 	rpcHandler.executeRPC(json);
			}
			if(objectRefs[i][1] == "light-Hibeam"){
                	var lcEvent = generateControlEvent(controlId);
					json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", lcEvent);
					console.log("random lcData:" + lcEvent.active);
                 	rpcHandler.executeRPC(json);
			}
			if(objectRefs[i][1] == "lights-Head"){
                	var lcEvent = generateControlEvent(controlId);
					json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", lcEvent);
					console.log("random lcData:" + lcEvent.active);
                 	rpcHandler.executeRPC(json);
			}
			if(objectRefs[i][1] == "wiper-front-wash"){
                	var wcEvent = generateControlEvent(controlId);
					json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", wcEvent);
					console.log("random wcData:" + wcEvent.active);
                 	rpcHandler.executeRPC(json);
			}
			if(objectRefs[i][1] == "wiper-rear-wash"){
                	var wcEvent = generateControlEvent(controlId);
					json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", wcEvent);
					console.log("random wcData:" + wcEvent.active);
                 	rpcHandler.executeRPC(json);
			}
			if(objectRefs[i][1] == "wiper-automatic"){
                	var wcEvent = generateControlEvent(controlId);
					json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", wcEvent);
					console.log("random wcData:" + wcEvent.active);
                 	rpcHandler.executeRPC(json);
			}
			if(objectRefs[i][1] == "wiper-front-once"){
                	var wcEvent = generateControlEvent(controlId);
					json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", wcEvent);
					console.log("random wcData:" + wcEvent.active);
                 	rpcHandler.executeRPC(json);
			}
			if(objectRefs[i][1] == "wiper-rear-once"){
                	var wcEvent = generateControlEvent(controlId);
					json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", wcEvent);
					console.log("random wcData:" + wcEvent.active);
                 	rpcHandler.executeRPC(json);
			}
			if(objectRefs[i][1] == "wiper-front-level1"){
                	var wcEvent = generateControlEvent(controlId);
					json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", wcEvent);
					console.log("random wcData:" + wcEvent.active);
                 	rpcHandler.executeRPC(json);
			}
			if(objectRefs[i][1] == "wiper-front-level2"){
                	var wcEvent = generateControlEvent(controlId);
					json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", wcEvent);
					console.log("random wcData:" + wcEvent.active);
                 	rpcHandler.executeRPC(json);
			}
    }
	if(listeningToLightsFogFront || listeningToLightsFogRear || listeningToLightsSignalLeft || listeningToLightsSignalRight || listeningToLightsSignalWarn || listeningToLightsParking || listeningToLightsHibeam || listeningToLightsHead || listeningToWiperFront || listeningToWiperRear || listeningToWiperAutomatic || listeningToWiperFrontOnce || listeningToWiperRearOnce || listeningToWiperFrontLeve1 || listeningToWiperRearLevel2){
		setTimeout(function(){ handleLightsWiperControlEvents(controlId); }, randomTime);  
	}
}

function generateControlEvent(controlId){
			var active = Math.round(Math.random()*true);
			//var lcEvent; //    if(cEvent.controlId == "lights-hibeam"){
                        if(active == 0){
                            console.log("Turned ON");
							return new ControlEvent(controlId,active);	
                     }else{
                            console.log("Turned OFF");
							return new ControlEvent(controlId,active);	
                     }

}

function requestGuidance(pois,successCb, errorCb){
	if(setDestination(pois[0])){
		successCb();
	}else{
		errorCb(new VehicleError('Destination could not be changed'));
	}
}


function findDestination(search, successCb, errorCb){
	

}


function setRPCHandler(rpcHdlr) {
	rpcHandler = rpcHdlr;
}

function setRequired(obj) {
	vs = obj;
    
    vs.addListener('gear', handleShiftEvents);
    vs.addListener('tripcomputer', handleTripComputerEvents);
    vs.addListener('parksensors-rear', handleParkSensorsEvents);
    vs.addListener('parksensors-front', handleParkSensorsEvents);
    vs.addListener('destination-reached', handleDestinationReached);

}


exports.addEventListener = addEventListener;
exports.removeEventListener = removeEventListener;
exports.get = get;
exports.findDestination = findDestination;
exports.requestGuidance = requestGuidance;
exports.setRPCHandler = setRPCHandler;
exports.setRequired = setRequired;

exports.serviceDesc = {
		api:'http://webinos.org/api/vehicle',
		displayName:'Vehicle API (Simulator)',
		description:'Provides faked vehicle data.'
};

})(module.exports);
