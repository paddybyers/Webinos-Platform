/*
* PLEASE NOTE THIS CODE CURRENTLY DOES NOT CONTAIN ACCESS TO ACTUAL VEHICLE DATA DUE TO COPYRIGHT ISSUES.
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

function ClimateControlEvent(zone, desiredTemperature, acStatus, ventLevel, ventMode){
	this.zone = zone;
	this.desiredTemperature = desiredTemperature;
	this.acstatus = acstatus;
	this.ventLevel = ventLevel;
	this.ventMode = ventMode;
}

function LightControlEvent(controlId, active){
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
		vehicleDataHandler(generateGearEvent());
	  break;
	case "tripcomputer":
		vehicleDataHandler(generateTripComputerEvent());
	  break;
	case "parksensors-front":
		vehicleDataHandler(generateParkSensorsEvent(vehicleDataId[0]));
		break;
	case "parksensors-rear":
		vehicleDataHandler(generateParkSensorsEvent(vehicleDataId[0]));
		break;	
	case "destination-reached":
		vehicleDataHandler(generateNavigationEvent(vehicleDataId[0]));
	  break;
	case "destination-changed":
		vehicleDataHandler(generateNavigation1Event(vehicleDataId[0]));
	  break;
    case "destination-cancelled":
		vehicleDataHandler(generateNavigation2Event(vehicleDataId[0]));
	  break;
    case "climate-all":
		vehicleDataHandler(generateClimateControlEvent(vehicleDataId[0]));
		break;
	case "climate-driver":
		vehicleDataHandler(generateClimateControl1Event(vehicleDataId[0]));
		break;		 
    case "climate-passenger-front":
		vehicleDataHandler(generateClimateControl2Event(vehicleDataId[0]));
		break;
	case "climate-passenger-rear-left":
		vehicleDataHandler(generateClimateControl3Event(vehicleDataId[0]));
		break;
    case "climate-passenger-rear-right":
		vehicleDataHandler(generateClimateControl4Event(vehicleDataId[0]));
		break;	
    case "lights-fog-front":
		vehicleDataHandler(generateLightControlEvent(vehicleDataId[0]));
		break;
    case "lights-fog-rear":
		vehicleDataHandler(generateLightControlEvent(vehicleDataId[0]));
		break;	
    case "lights-signal-left":
		vehicleDataHandler(generateLightControlEvent(vehicleDataId[0]));
		break;		
    case "lights-signal-right":
		vehicleDataHandler(generateLightControlEvent(vehicleDataId[0]));
		break;
	case "lights-signal-warn":
		vehicleDataHandler(generateLightControlEvent(vehicleDataId[0]));
		break;
	case "lights-parking":
		vehicleDataHandler(generateLightControlEvent(vehicleDataId[0]));
		break;
	case "lights-hibeam":
		vehicleDataHandler(generateLightControlEvent(vehicleDataId[0]));
		break;
	case "lights-head":
		vehicleDataHandler(generateLightControlEvent(vehicleDataId[0]));
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

/*AddEventListener*/

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
			case "parksensors-front":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToParkSensorsFront){
					listeningToParkSensorsFront = true;
					handleParkSensorsEvents(vehicleDataId);	
				}
				break;
			case "parksensors-rear":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToParkSensorsRear){
					listeningToParkSensorsRear = true;
					handleParkSensorsEvents(vehicleDataId);	
				}
				break;
            case "destination-reached":
				objectRefs.push([objectRef, 'destination-reached']);
				if(!listeningToDestinationReached){
					listeningToDestinationReached = true;
					handleNavigationEvents(vehicleDataId);	
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
					handleLightsControlEvents(vehicleDataId);	
				}
				break;
			case "lights-fog-rear":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToLightsFogRear){
					listeningToLightsFogRear = true;
					handleLightsControlEvents(vehicleDataId);	
				}
				break;
			case "lights-signal-left":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToLightsSignalLeft){
					listeningToLightsSignalLeft = true;
					handleLightsControlEvents(vehicleDataId);	
				}
				break;
			case "lights-signal-right":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToLightsSignalRight){
					listeningToLightsSignalRight = true;
					handleLightsControlEvents(vehicleDataId);	
				}
				break;
			case "lights-signal-warn":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToLightsSignalWarn){
					listeningToLightsSignalWarn = true;
					handleLightsControlEvents(vehicleDataId);	
				}
				break;
			case "lights-parking":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToLightsParking){
					listeningToLightsParking = true;
					handleLightsControlEvents(vehicleDataId);	
				}
				break;
			case "lights-hibeam":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToLightsHibeam){
					listeningToLightsHibeam = true;
					handleLightsControlEvents(vehicleDataId);	
				}
				break;
			case "lights-head":
				objectRefs.push([objectRef, vehicleDataId]);
				if(!listeningToLightsHead){
					listeningToLightsHead = true;
					handleLightsControlEvents(vehicleDataId);	
				}
				break;
			default:
				console.log('nothing to do: Errors...');
			
			}	
}


/*RemoveEventListener*/

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
				console.log('disabling tripcomputer event generation');
				break;
			case "parksensors-front":
				listeningToParkSensorsFront = false;
				console.log('disabling ps front event generation');
				break;
			case "parksensors-rear":
				listeningToParkSensorsFront = false;
				console.log('disabling ps rear event generation');
				break;	
            case "destination-reached":
				listeningToDestinationReached = false;
				console.log('disabling Navigation Event - Destination reached generation');				
				break;
			case "destination-changed":
				listeningToDestinationChanged = false;
				console.log('disabling Navigation Event - Destination Changed generation');				
				break;
            case "destination-cancelled":
				listeningToDestinationCancelled = false;
				console.log('disabling Navigation Event - Destination Cancelled generation');				
				break;
			case "climate-all":
				listeningToClimateControlAll = false;
				console.log('disabling Climate All event generation');				
				break;
			case "climate-driver":
				listeningToClimateControlDriver = false;
				console.log('disabling Climate Driver event generation');				
				break;
			case "climate-passenger-front":
				listeningToClimateControlPassFront = false;
				console.log('disabling Climate Passenger Front event generation');				
				break;	
            case "climate-passenger-rear-left":
				listeningToClimateControlPassRearLeft = false;
				console.log('disabling Climate Passenger rear left event generation');				
				break;	
            case "climate-passenger-rear-right":
				listeningToClimateControlPassRearRight = false;
				console.log('disabling Climate Passenger rear right event generation');				
				break;		
            case "lights-fog-front":
				listeningToLightsFogFront = false;
				console.log('disabling Lights Fog Front event generation');				
				break;
			case "lights-fog-rear":
				listeningToLightsFogRear = false;
				console.log('disabling Lights Fog Rear event generation');				
				break;
			case "lights-signal-left":
				listeningToLightsSignalLeft = false;
				console.log('disabling Signal Left event generation');				
				break;	
			case "lights-signal-right":
				listeningToLightsSignalRight = false;
				console.log('disabling Signal Right event generation');				
				break;	
            case "lights-signal-warn":
				listeningToLightsSignalWarn = false;
				console.log('disabling Lights Signal Warn left event generation');				
				break;	
            case "lights-parking":
				listeningToLightsParking = false;
				console.log('disabling Lights Parking event generation');				
				break;
			case "lights-hibeam":
				listeningToLightsHibeam = false;
				console.log('disabling Lights Hibeam event generation');				
				break;
            case "lights-head":
				listeningToLightsHead = false;
				console.log('disabling Lights Head event generation');				
				break;					
			default:
				console.log("nothing found");
		
		}
	}
}


/*handleShiftEvents*/
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



/*handleTripComputerEvents*/
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

/*handleParkSensorsEvent*/
function handleParkSensorsEvents(position){
	var randomTime = Math.floor(Math.random()*1000*10);
	for(i = 0; i < objectRefs.length; i++){
			if(objectRefs[i][1] == "parksensors-front"){
                	var psEvent = generateParkSensorsEvent(position);
					json = webinos.rpc.createRPC(objectRefs[i][0], "onEvent", psEvent);
                 	webinos.rpc.executeRPC(json);
			}
			if(objectRefs[i][1] == "parksensors-rear"){
                	var psEvent = generateParkSensorsEvent(position);
					json = webinos.rpc.createRPC(objectRefs[i][0], "onEvent", psEvent);
                 	webinos.rpc.executeRPC(json);
			}
    }
	if(listeningToParkSensorsFront || listeningToParkSensorsRear){
		setTimeout(function(){ handleParkSensorsEvents(position); }, randomTime);  
	}
}


/*generateParkSensorsEvent*/
function generateParkSensorsEvent(position){
	return new ParkSensorEvent(position, Math.floor(Math.random()*255), Math.floor(Math.random()*255), Math.floor(Math.random()*255), Math.floor(Math.random()*255));
}

/*generateGearEvent*/
function generateGearEvent(){
    var randomGear = Math.floor(Math.random()*7);
    return new ShiftEvent(randomGear);        
}

/*generateTripComputerEvent*/

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

/*Navigation Events - Destination Reached, Changed and Cancelled*/
function handleNavigationEvents(destinationId){
	    var randomTime = Math.floor(Math.random()*1000*10);
	//	console.log("random drData1:" + drEvent);
        console.log("random Time:" + randomTime);
     //   var json = null;
        for(i = 0; i < objectRefs.length; i++){
				if(objectRefs[i][1] == "destination-reached"){
					var drEvent = generateNavigationEvent(destinationId);
                	
					if(drEvent != null){
						json = webinos.rpc.createRPC(objectRefs[i][0], "onEvent", drEvent);
						console.log("random drData:" + drEvent.name);
						webinos.rpc.executeRPC(json);	
					}
				}
				if(objectRefs[i][1] == "destination-changed"){
				var drEvent = generateNavigation1Event(destinationId);
                	json = webinos.rpc.createRPC(objectRefs[i][0], "onEvent", drEvent);
					console.log("random drData:" + drEvent.name);
                 	webinos.rpc.executeRPC(json);
				}
				if(objectRefs[i][1] == "destination-cancelled"){	
				destinationid = "destination-cancelled";
				var drEvent = generateNavigation2Event(destinationId);
                	json = webinos.rpc.createRPC(objectRefs[i][0], "onEvent", drEvent);
					console.log("random drData:" + drEvent);		
                 	webinos.rpc.executeRPC(json);
				}
        }
        if(listeningToDestinationReached || listeningToDestinationChanged || listeningToDestinationCancelled){
                setTimeout(function(){ handleNavigationEvents(destinationId); }, randomTime);        
        } 
}

//webinos.vehicle.findDestination(destinationCB, errorCB,"BMW AG");
//webinos.vehicle.findDestination(destinationCB, errorCB,destinations[0].name);

//setting the target destination
var destinations =new Array();
destinations.push({name:"BMW AG", address : {country: "DE", region: "Bayern", county: "Bayern", city: "Munich", street: "Petuelring", streetNumber: "130", premises: "Carparking", additionalInformation: "near to OEZ", postalCode: "80788"}});
destinations.push({name:"BMW Forschung und Technik", address : {country: "DE", region: "Bayern", county: "Bayern", city: "Munich", street: "Hanauer Strasse", streetNumber: "46", premises: "Carparking", additionalInformation: "near to OEZ", postalCode: "80992"}});
destinations.push({name:"BMW", address : {country: "DE", region: "Bayern", county: "Bayern", city: "Munich", street: "Petuelring", streetNumber: "130", premises: "Carparking", additionalInformation: "near to OEZ", postalCode: "80788"}});
destinations.push({name:"BMW AG", address : {country: "DE", region: "Bayern", county: "Bayern", city: "Munich", street: "Petuelring", streetNumber: "130", premises: "Carparking", additionalInformation: "near to OEZ", postalCode: "80788"}});

//list of destinations assigned - for the moment 2 destinations listed
var destination =new Array();
destination.push({name:"BMW AG", address : {country: "DE", region: "Bayern", county: "Bayern", city: "Munich", street: "Petuelring", streetNumber: "130", premises: "Carparking", additionalInformation: "near to OEZ", postalCode: "80788"}});
destination.push({name:"BMW Forschung und Technik", address : {country: "DE", region: "Bayern", county: "Bayern", city: "Munich", street: "Hanauer Strasse", streetNumber: "46", premises: "Carparking", additionalInformation: "near to OEZ", postalCode: "80992"}});
	
function generateNavigationEvent(destinationId){
		
		random1 = Math.floor(Math.random()*destinations.length);
		random2 = Math.floor(Math.random()*destinations.length);
		
		if (destinations[random1].name == destinations[random2].name) {
              console.log("Reached the Desired Destination");
			  return new NavigationEvent(destinationId, destinations[random1].address);
		}else{
			return null;
		}
		/*if (destinations[0].name == destination[0].name) {
              console.log("Reached the BMW HQ");
			  return new NavigationEvent(destination[0].name,destination[0].address.country,destination[0].address.region,destination[0].address.county,destination[0].address.city,destination[0].address.street,destination[0].address.streetNumber,destination[0].address.premises,destination[0].address.additionalInformation,destination[0].address.postalCode);
            } else if (destinations[1].name == destination[1].name) {
                console.log("Reached the BMW Research Center");
			  return new NavigationEvent(destination[1].name,destination[1].address.country,destination[1].address.region,destination[1].address.county,destination[1].address.city,destination[1].address.street,destination[1].address.streetNumber,destination[1].address.premises,destination[1].address.additionalInformation,destination[1].address.postalCode);
            }
		  else {
                console.log("Destination is Cancelled or Not Found");
        } */
}

function generateNavigation1Event(destinationId){
		 for (var j=0; j<destinations.length; j++){
         var i=1;		 
		 if (destinations[j].name == destination[i].name) {
              console.log("Destination Changed");
			  return new NavigationEvent(destinationId,destination[i].name,destination[i].address.country,destination[i].address.region,destination[i].address.county,destination[i].address.city,destination[i].address.street,destination[i].address.streetNumber,destination[i].address.premises,destination[i].address.additionalInformation,destination[i].address.postalCode);
        }
		}
		/*if (destinations[0].name == destination[1].name) {
              console.log("Reached the BMW HQ");
			   return new NavigationEvent(destination[0].name,destination[0].address.country,destination[0].address.region,destination[0].address.county,destination[0].address.city,destination[0].address.street,destination[0].address.streetNumber,destination[0].address.premises,destination[0].address.additionalInformation,destination[0].address.postalCode);
         } else if (destinations[1].name == destination[1].name) {
                console.log("Destination Changed to BMW Research Center");
			  return new NavigationEvent(destination[1].name,destination[1].address.country,destination[1].address.region,destination[1].address.county,destination[1].address.city,destination[1].address.street,destination[1].address.streetNumber,destination[1].address.premises,destination[1].address.additionalInformation,destination[1].address.postalCode);
          }
		  else {
                console.log("Destination is Cancelled or Not Found");
        } 	*/
}		
	
function generateNavigation2Event(destinationId){
		var j=0;
        var i=1;		 
		 if (destinations[j].name == destination[i].name) {
              console.log("Destination Cancelled");
			  return new NavigationEvent(destinationId,destination[i].name,destination[i].address.country,destination[i].address.region,destination[i].address.county,destination[i].address.city,destination[i].address.street,destination[i].address.streetNumber,destination[i].address.premises,destination[i].address.additionalInformation,destination[i].address.postalCode);
        }	  
		else {
                console.log("Destination is Cancelled or Not Found");
				return new NavigationEvent(destinationId);
        }
		
	/*	if (destinations[0].name == destination[1].name) {
              console.log("Reached the BMW HQ");
			  return new NavigationEvent(destination[0].name,destination[0].address.country,destination[0].address.region,destination[0].address.county,destination[0].address.city,destination[0].address.street,destination[0].address.streetNumber,destination[0].address.premises,destination[0].address.additionalInformation,destination[0].address.postalCode);
         } else if (destinations[0].name == destination[1].name) {
                console.log("Reached the BMW Research Center");
			  return new NavigationEvent(destination[1].name,destination[1].address.country,destination[1].address.region,destination[1].address.county,destination[1].address.city,destination[1].address.street,destination[1].address.streetNumber,destination[1].address.premises,destination[1].address.additionalInformation,destination[1].address.postalCode);
          }
		  else {
                console.log("Destination is Cancelled or Not Found");
        } */
}

// Climate All, Climate Driver, Climate Passenger Front, Climate Passenger Rear Left, Climate Passenger Rear Right

function handleClimateControlEvents(zone){
	var randomTime = Math.floor(Math.random()*1000*10);
        console.log("random Time:" + randomTime);
	for(i = 0; i < objectRefs.length; i++){
			if(objectRefs[i][1] == "climate-all"){
                	var ccEvent = generateClimateControlEvent(zone);
					json = webinos.rpc.createRPC(objectRefs[i][0], "onEvent", ccEvent);
					console.log("random ccData:" + ccEvent.ventLevel);
                 	webinos.rpc.executeRPC(json);
			}
			if(objectRefs[i][1] == "climate-driver"){
                	var cc1Event = generateClimateControl1Event(zone);
					json = webinos.rpc.createRPC(objectRefs[i][0], "onEvent", cc1Event);
					console.log("random ccData:" + cc1Event.ventLevel);
                 	webinos.rpc.executeRPC(json);
			}
			if(objectRefs[i][1] == "climate-passenger-front"){
                	var cc2Event = generateClimateControl2Event(zone);
					json = webinos.rpc.createRPC(objectRefs[i][0], "onEvent", cc2Event);
					console.log("random ccData:" + cc2Event.ventLevel);
                 	webinos.rpc.executeRPC(json);
			}
			if(objectRefs[i][1] == "climate-passenger-rear-left"){
                	var cc3Event = generateClimateControl3Event(zone);
					json = webinos.rpc.createRPC(objectRefs[i][0], "onEvent", cc3Event);
					console.log("random ccData:" + cc3Event.ventLevel);
                 	webinos.rpc.executeRPC(json);
			}
			if(objectRefs[i][1] == "climate-passenger-rear-right"){
                	var cc4Event = generateClimateControl4Event(zone);
					json = webinos.rpc.createRPC(objectRefs[i][0], "onEvent", cc4Event);
					console.log("random ccData:" + cc4Event.ventLevel);
                 	webinos.rpc.executeRPC(json);
			}
    }
	if(listeningToClimateControlAll || listeningToClimateControlDriver || listeningToClimateControlPassFront || listeningToClimateControlPassRearLeft || listeningToClimateControlPassRearRight){
		setTimeout(function(){ handleClimateControlEvents(zone); }, randomTime);  
	}
}
    var desiredTemperaturedriver = 20;
	var desiredTemperatureall = 22;
	var desiredTemperaturefront = 21;
	var desiredTemperaturerearleft = 23;
	var desiredTemperaturerearright = 24;
	var acstatus = true; 
	var ventMode = true;
	
 function generateClimateControlEvent(zone){
                var ventLevel = Math.floor(Math.random()*10);
                console.log(zone + " desired temperature is " + desiredTemperatureall);   
                return new ClimateControlEvent(zone, desiredTemperatureall, acstatus, ventLevel, ventMode);				
        } 
		
 function generateClimateControl1Event(zone){
                var ventLevel = Math.floor(Math.random()*10);
                console.log(zone + " desired temperature is " + desiredTemperaturedriver);   
                return new ClimateControlEvent(zone, desiredTemperaturedriver, acstatus, ventLevel, ventMode);				
        } 

function generateClimateControl2Event(zone){
                var ventLevel = Math.floor(Math.random()*10);
                console.log(zone + " desired temperature is " + desiredTemperaturefront);   
                return new ClimateControlEvent(zone, desiredTemperaturefront, acstatus, ventLevel, ventMode);				
        } 

function generateClimateControl3Event(zone){
                var ventLevel = Math.floor(Math.random()*10);
                console.log(zone + " desired temperature is " + desiredTemperaturerearleft);   
                return new ClimateControlEvent(zone, desiredTemperaturerearleft, acstatus, ventLevel, ventMode);				
        } 

function generateClimateControl4Event(zone){
                var ventLevel = Math.floor(Math.random()*10);
                console.log(zone + " desired temperature is " + desiredTemperaturerearright);   
                return new ClimateControlEvent(zone, desiredTemperaturerearright, acstatus, ventLevel, ventMode);				
        } 

// Lights Fog Front, Rear, Hibeam, Signal Right, Warn, Head

function handleLightsControlEvents(controlId){
	var randomTime = Math.floor(Math.random()*1000*10);
        console.log("random Time:" + randomTime);
	for(i = 0; i < objectRefs.length; i++){
			if(objectRefs[i][1] == "lights-fog-front"){
                	var lcEvent = generateLightControlEvent(controlId);
					json = webinos.rpc.createRPC(objectRefs[i][0], "onEvent", lcEvent);
					console.log("random ccData:" + lcEvent.active);
                 	webinos.rpc.executeRPC(json);
			}
			if(objectRefs[i][1] == "lights-fog-rear"){
                	var lc1Event = generateLightControl1Event(controlId);
					json = webinos.rpc.createRPC(objectRefs[i][0], "onEvent", lc1Event);
					console.log("random ccData:" + lc1Event.active);
                 	webinos.rpc.executeRPC(json);
			}
			if(objectRefs[i][1] == "lights-signal-left"){
                	var lcEvent = generateLightControlEvent(controlId);
					json = webinos.rpc.createRPC(objectRefs[i][0], "onEvent", lcEvent);
					console.log("random ccData:" + lcEvent.active);
                 	webinos.rpc.executeRPC(json);
			}
			if(objectRefs[i][1] == "lights-signal-right"){
                	var lcEvent = generateLightControlEvent(controlId);
					json = webinos.rpc.createRPC(objectRefs[i][0], "onEvent", lcEvent);
					console.log("random ccData:" + lcEvent.active);
                 	webinos.rpc.executeRPC(json);
			}
			if(objectRefs[i][1] == "lights-signal-warn"){
                	var lcEvent = generateLightControlEvent(controlId);
					json = webinos.rpc.createRPC(objectRefs[i][0], "onEvent", lcEvent);
					console.log("random ccData:" + lcEvent.active);
                 	webinos.rpc.executeRPC(json);
			}
			if(objectRefs[i][1] == "lights-parking"){
                	var lcEvent = generateLightControlEvent(controlId);
					json = webinos.rpc.createRPC(objectRefs[i][0], "onEvent", lcEvent);
					console.log("random ccData:" + lcEvent.active);
                 	webinos.rpc.executeRPC(json);
			}
			if(objectRefs[i][1] == "light-Hibeam"){
                	var lcEvent = generateLightControlEvent(controlId);
					json = webinos.rpc.createRPC(objectRefs[i][0], "onEvent", lcEvent);
					console.log("random ccData:" + lcEvent.active);
                 	webinos.rpc.executeRPC(json);
			}
			if(objectRefs[i][1] == "lights-Head"){
                	var lcEvent = generateLightControlEvent(controlId);
					json = webinos.rpc.createRPC(objectRefs[i][0], "onEvent", lcEvent);
					console.log("random ccData:" + lcEvent.active);
                 	webinos.rpc.executeRPC(json);
			}
    }
	if(listeningToLightsFogFront || listeningToLightsFogRear || listeningToLightsSignalLeft || listeningToLightsSignalRight || listeningToLightsSignalWarn || listeningToLightsParking || listeningToLightsHibeam || listeningToLightsHead){
		setTimeout(function(){ handleLightsControlEvents(controlId); }, randomTime);  
	}
}

function generateLightControlEvent(controlId){
			var active = true;
			//var lcEvent;
            //    if(cEvent.controlId == "lights-hibeam"){
                        if(active == true){
                            console.log("Lights Fog Front is turned on");
							return new LightControlEvent(controlId,active);	
                     }else{
                            console.log("Lights Fog Front is turned off");
							return new LightControlEvent(controlId,active);	
                     }
                }

function generateLightControl1Event(controlId){
			var active = "true";
			//var lcEvent;
            //    if(cEvent.controlId == "lights-hibeam"){
                        if(active == true){
                            console.log("Lights Fog Rear is turned on");
							return new LightControlEvent(controlId,active);	
                     }else{
                            console.log("Lights Fog Rear is turned off");
							return new LightControlEvent(controlId,active);	
                     }
                }
                			
        