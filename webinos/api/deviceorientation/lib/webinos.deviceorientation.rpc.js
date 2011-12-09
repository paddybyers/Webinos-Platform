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

WDomEvent = function(type, target, currentTarget, eventPhase, bubbles, cancelable, timestamp){
	this.initEvent(type, target, currentTarget, eventPhase, bubbles, cancelable, timestamp);
}

WDomEvent.prototype.initEvent = function(type, target, currentTarget, eventPhase, bubbles, cancelable, timestamp){
    this.type = type;
    this.target = target;
    this.currentTarget = currentTarget;
    this.eventPhase = eventPhase;
    this.bubbles = bubbles;
    this.cancelable  = cancelable;
    this.timestamp = timestamp; 
}


DeviceOrientationEvent = function(alpha, beta, gamma){
	this.initDeviceOrientationEvent(alpha, beta, gamma);
}

DeviceOrientationEvent.prototype = new WDomEvent();
DeviceOrientationEvent.prototype.constructor = DeviceOrientationEvent;
DeviceOrientationEvent.parent = WDomEvent.prototype; // our "super" property

DeviceOrientationEvent.prototype.initDeviceOrientationEvent = function(alpha, beta, gamma){
	this.alpha = alpha;
	this.beta = beta;
	this.gamma = gamma;
    
    var d = new Date();
    var stamp = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
    var stamp = stamp + d.getUTCMilliseconds();
    
	DeviceOrientationEvent.parent.initEvent.call(this,'deviceorientation', null, null, null, false, false, stamp);
}
Acceleration = function(x,y,z){
	this.x = x;
	this.y = y;
	this.z = z;
}
RotationRate = function(alpha, beta, gamma){
	this.alpha = alpha;
	this.beta = beta;
	this.gamma = gamma;
}
DeviceMotionEvent = function(acceleration, accelerationIncludingGravity, rotationRate, interval){
	this.initDeviceMotionEvent(acceleration, accelerationIncludingGravity, rotationRate, interval);
}
DeviceMotionEvent.prototype = new WDomEvent();
DeviceMotionEvent.prototype.constructor = DeviceOrientationEvent;
DeviceMotionEvent.parent = WDomEvent.prototype; // our "super" property

DeviceMotionEvent.prototype.initDeviceMotionEvent = function(acceleration, accelerationIncludingGravity, rotationRate, interval){
	this.acceleration = acceleration;
	this.accelerationIncludingGravity = accelerationIncludingGravity;
	this.rotationRate = rotationRate;
	this.interval = interval;
    var d = new Date();
    var stamp = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
    var stamp = stamp + d.getUTCMilliseconds();
	DeviceOrientationEvent.parent.initEvent.call(this,'devicemotion', null, null, null, false, false, stamp);
}

function addEventListenerDO(params, successCB, errorCB, objectRef){
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
}



function simulateDeviceMotion(){

    dme = new DeviceMotionEvent(new Acceleration(1,2,3), new Acceleration(2,4,6), new RotationRate(10,20,30), 2000);

    var randomTime = Math.floor(Math.random()*1000*10);
    console.log("Milliseconds until next DeviceMotionEvent: " + randomTime);
    
    var json = null;
    for(i = 0; i < objectRefsDo.length; i++){
			
        if(objectRefsDo[i][1] == "devicemotion"){
            console.log('Firing back to' + objectRefsDo[i][0]);
            json = webinos.rpc.createRPC(objectRefsDo[i][0], "onEvent", dme);
            webinos.rpc.executeRPC(json);
        }
    }
    if(listeningToDeviceMotion){
            setTimeout(function(){ simulateDeviceMotion(); }, randomTime);        
    }
}

function simulateCompassNeedsCalibration(){

    var d = new Date();
    var stamp = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
    var stamp = stamp + d.getUTCMilliseconds();
    
    cnce = new WDomEvent('compassneedscalibration', null, null, null, false, true, stamp);
    
    var randomTime = Math.floor(Math.random()*1000*10);
    console.log("Milliseconds until next CompassNeedsCalibrationEvent: " + randomTime);
    
    var json = null;
    for(i = 0; i < objectRefsDo.length; i++){
			
        if(objectRefsDo[i][1] == "compassneedscalibration"){
            console.log('Firing back to' + objectRefsDo[i][0]);
            json = webinos.rpc.createRPC(objectRefsDo[i][0], "onEvent", cnce);
            webinos.rpc.executeRPC(json);
        }
    }
    if(listeningToCompassNeedsCalibration){
            setTimeout(function(){ simulateCompassNeedsCalibration(); }, randomTime);        
    }


}

function simulateDeviceOrientation(){
    
    doe = new DeviceOrientationEvent(Math.floor(Math.random()*360), Math.floor(Math.random()*360), Math.floor(Math.random()*360));
    
    var randomTime = Math.floor(Math.random()*1000*10);
    console.log("Milliseconds until next DeviceOrientationEvent: " + randomTime);
    
    var json = null;
    for(i = 0; i < objectRefsDo.length; i++){
			
        if(objectRefsDo[i][1] == "deviceorientation"){
            
            try{
                console.log('Firing back to' + objectRefsDo[i][0]);
                json = webinos.rpc.createRPC(objectRefsDo[i][0], "onEvent", doe);
                webinos.rpc.executeRPC(json);
            }catch(e){
                console.log('HIER FEHLER. NEED TO UNBIND. RECEPIENT NOT AVAILABLE ANYMORE');
            
            }
        }
    }
    if(listeningToDeviceOrientation){
            setTimeout(function(){ simulateDeviceOrientation(); }, randomTime);        
    }
    
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
