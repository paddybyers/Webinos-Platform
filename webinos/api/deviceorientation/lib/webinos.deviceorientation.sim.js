// specific implemenation for $CAR
(function() {

// rpcHandler set be setRPCHandler
var rpcHandler = null;

// car info
var vs = null;

var _eventIds = new Array('deviceorientation', 'compassneedscalibration', 'devicemotion');

var listeningToDeviceOrientation = false;
var listeningToCompassNeedsCalibration = false;
var listeningToDeviceMotion = false;

//Objects references for handling EventListeners
var objectRefsDo = new Array();

function addEventListener(params, successCB, errorCB, objectRef){
    switch(params[0]){
        case "devicemotion":
            objectRefsDo.push([objectRef, params[0]]);
            console.log('listening to device motion');
            if(!listeningToDeviceMotion){
                listeningToDeviceMotion = true;
            }
            break;
        case "deviceorientation":
            objectRefsDo.push([objectRef, params[0]]);
            if(!listeningToDeviceOrientation){
                listeningToDeviceOrientation = true;
            }

            break;
            
        case "compassneedscalibration":
            objectRefsDo.push([objectRef, params[0]]);
            if(!listeningToCompassNeedsCalibration){
                listeningToCompassNeedsCalibration = true;
            }
            break;
            
        default:
            console.log('ERROR: not available');
            break;
    }
}

function removeEventListener(params, successCB, errorCB, objectRef){
    //params[0] => objectRef from Listener // params[1] => type of Event [70, 'devicemotion']
    console.log(params);
    console.log(objectRef);
    var registeredListeners = 0;
    for(i = 0; i < objectRefsDo.length; i++ ){
        if(objectRefsDo[i][1] == params[1]){ //CHECK IF THERE ARE OTHER LISTENERS FOR A CERTAIN EVENT TYPE
			registeredListeners++;
		}
		if(objectRefsDo[i][0] == params[0]){ //FIND RELEVANT OBJECTREF AND REMOVE IT FROM THE LISTENER LIST
			objectRefsDo.splice(i,1);
			console.log('object# ' + params[0] + " removed (" +  params[1] + ")");
		}
	}
    
    if(registeredListeners <= 1){
        console.log('disabling event generation for' + params[1]);
        switch(params[1]){
            case "devicemotion":
                listeningToDeviceMotion = false;
                break;
            case "deviceorientation":
                listeningToDeviceOrientation = false;
                break;
            case "compassneedscalibration":
                listeningToCompassNeedsCalibration = false;
                break;
            default:
                console.log('ERROR: not available');
                break;
        }
    }
}

function setRPCHandler(rpcHdlr) {
	rpcHandler = rpcHdlr;
}

function handleDeviceMotion(doData){
	if(listeningToDeviceMotion){
        for(i = 0; i < objectRefsDo.length; i++){
			if(objectRefsDo[i][1] == "devicemotion"){
   				json = rpcHandler.createRPC(objectRefs[i][0], "onEvent", doEvent);
                rpcHandler.executeRPC(json);
			}
		}
	}
}

function handleDeviceOrientation(){

}

function handleCompassNeedsCalibration(){

}


function setRequired(obj) {
	vs = obj;
    vs.addListener('devicemotion', handleDeviceMotion);
    vs.addListener('deviceorientation', handleDeviceOrientation);
    vs.addListener('compassneedscalibration', handleCompassNeedsCalibration);
}



exports.addEventListener = addEventListener;
exports.removeEventListener = removeEventListener;
exports.setRPCHandler = setRPCHandler;
exports.setRequired = setRequired;

exports.serviceDesc = {
		api:'http://webinos.org/api/deviceorientation',
		displayName:'Device Orientation (by simulator)',
		description:'Provides deviceorientation events generated by the vehicle simulator.'
};

})(module.exports);
