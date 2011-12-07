if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('../../../common/rpc/lib/rpc.js');

try{
	var vehicleSystem = require('../../vehicle/contrib/vb-con/vc.js');
	var vehicleBusAvailable = vehicleSystem.available;
	var car = vehicleSystem.most;
}catch(e){
	var vehicleBusAvailable = false;
	var car = null;
	console.log('vehicle bus connection module is not available');
    console.log(e);
}




var _eventIds = new Array('deviceorientation', 'compassneedscalibration', 'devicemotion');

var listeningToDeviceOrientation = false;
var listeningToCompassNeedsCalibration = false;
var listeningToDeviceMotion = false;

//Objects references for handling EventListeners
var objectRefsDo = new Array();

function addEventListenerDO(params, successCB, errorCB, objectRef){
    console.log("params[0]" + params[0]);
    console.log("params[1]" + params[1]);
    console.log("params[2]" + params[2]);
    
    
    switch(params[0]){
        case "devicemotion":
            objectRefsDo.push([objectRef, params[0]]);
            console.log('listening to device motion');
            if(!listeningToDeviceMotion){
                listeningToDeviceMotion = true;
                simulateDeviceMotion();
            }
            break;
        case "deviceorientation":
            objectRefsDo.push([objectRef, params[0]]);
            if(!listeningToDeviceOrientation){
                listeningToDeviceOrientation = true;
                simulateDeviceOrientation();
            }

            break;
            
        case "compassneedscalibration":
            objectRefsDo.push([objectRef, params[0]]);
            if(!listeningToCompassNeedsCalibration){
                listeningToCompassNeedsCalibration = true;
                simulateCompassNeedsCalibration();
            }
            break;
            
        default:
            console.log('ERROR: not available');
            break;
    }
    
    
	console.log('ObjectsRefId ' + objectRef);
    
}

function simulateDeviceMotion(){
    var motionEvent = new Object();
    
    motionEvent.hello = "I am a motion event";
    
    
    var randomTime = Math.floor(Math.random()*1000*10);
    
    
    console.log("random motionevent:" + motionEvent);
    console.log("random Time:" + randomTime);
    
    var json = null;
    for(i = 0; i < objectRefsDo.length; i++){
			
        if(objectRefsDo[i][1] == "devicemotion"){
            console.log('Firing back to' + objectRefsDo[i][0]);
            json = webinos.rpc.createRPC(objectRefsDo[i][0], "onEvent", motionEvent);
            webinos.rpc.executeRPC(json);
        }
    }
    if(listeningToDeviceMotion){
            setTimeout(function(){ simulateDeviceMotion(); }, randomTime);        
    }

}

function simulateCompassNeedsCalibration(){

}

function simulateDeviceOrientation(){

}

function removeEventListenerDO(params, successCB, errorCB, objectRef){
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

var WebinosDeviceOrientation = new RPCWebinosService({
	api:'http://webinos.org/api/deviceorientation',
	displayName:'Deviceorientation',
	description:'The W3C Devicecorientation API'
});
WebinosDeviceOrientation.addEventListener = addEventListenerDO;
WebinosDeviceOrientation.removeEventListener = removeEventListenerDO;
webinos.rpc.registerObject(WebinosDeviceOrientation);  // RPC name
