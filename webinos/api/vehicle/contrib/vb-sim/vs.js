(function() {

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

ShiftEvent = function(gear){
	this.initShiftEvent(gear);
}

ShiftEvent.prototype = new WDomEvent();
ShiftEvent.prototype.constructor = ShiftEvent;
ShiftEvent.parent = WDomEvent.prototype; // our "super" property

ShiftEvent.prototype.initShiftEvent = function(gear){
	this.gear = gear;
    var d = new Date();
    var stamp = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
    var stamp = stamp + d.getUTCMilliseconds();
	ShiftEvent.parent.initEvent.call(this, 'gear', null, null, null, false, false, stamp);
}

/*
* RELEVAT OBJECTS FOR TRIPCOMPUTER EVENTS
*
*/
TripComputerEvent = function(tcData){
	this.initTripComputerEvent(tcData);
}

TripComputerEvent.prototype = new WDomEvent();
TripComputerEvent.prototype.constructor = ShiftEvent;
TripComputerEvent.parent = WDomEvent.prototype; // our "super" property

TripComputerEvent.prototype.initTripComputerEvent = function(tcData){
    this.averageConsumption1 = tcData.c1;
    this.averageConsumption2 = tcData.c2;
    this.averageSpeed1 = tcData.s1;
    this.averageSpeed2 = tcData.s2;
    this.tripDistance = tcData.d;
    this.mileage = tcData.m;
    this.range = tcData.r;
    var d = new Date();
    var stamp = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
    var stamp = stamp + d.getUTCMilliseconds();

	ShiftEvent.parent.initEvent.call(this, 'tripcomputer', null, null, null, false, false, stamp);
}


ParkSensorEvent = function(position, psData){
	this.initParkSensorEvent(position, psData);
}

ParkSensorEvent.prototype = new WDomEvent();
ParkSensorEvent.prototype.constructor = ParkSensorEvent;
ParkSensorEvent.parent = WDomEvent.prototype; // our "super" property

ParkSensorEvent.prototype.initParkSensorEvent = function(position, psData){
    this.position = position;
    this.left = psData.l;
    this.midLeft = psData.ml;
    this.midRight = psData.mr;
    this.right = psData.r;
    
    var d = new Date();
    var stamp = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
    var stamp = stamp + d.getUTCMilliseconds();

	ParkSensorEvent.parent.initEvent.call(this, 'parksensor', null, null, null, false, false, stamp);
}



var fs = require('fs'), url = require('url'), path = require('path');

		function getContentType(uri) {
			var contentType = {"Content-Type": "text/plain"};
			switch (uri.substr(uri.lastIndexOf('.'))) {
			case '.js':
				contentType = {"Content-Type": "application/x-javascript"};
				break;
			case '.html':
				contentType = {"Content-Type": "text/html"};
				break;
			case '.css':
				contentType = {"Content-Type": "text/css"};
				break;
			case '.jpg':
				contentType = {"Content-Type": "image/jpeg"};
				break;
			case '.png':
				contentType = {"Content-Type": "image/png"};
				break;
			case '.gif':
				contentType = {"Content-Type": "image/gif"};
				break;
		    }
		    return contentType;
		}



var httpServer = require('http').createServer(function(request, response) {  
			var uri = url.parse(request.url).pathname;  
			var filename = path.join(__dirname, uri);  
            path.exists(filename, function(exists) {  
				if(!exists) {  
					response.writeHead(404, {"Content-Type": "text/plain"});
					response.write("404 Not Found\n");
					response.end();
					return;
				}  
				fs.readFile(filename, "binary", function(err, file) {  
					if(err) {  
						response.writeHead(500, {"Content-Type": "text/plain"});  
						response.write(err + "\n");  
						response.end();  
						return;  
					}
					response.writeHead(200, getContentType(filename));  
					response.write(file, "binary");  
					response.end();
				});
			});  
		});
        

try{
    httpServer.listen(9898);
    var nowjs = require('now');
    var everyone = nowjs.initialize(httpServer);
    var _listeners = new Object();

}catch(e){
    console.log('The Vehicle Simulator requires the node-module now. You can install it by the following command: npm install now.');
}
var gear = null;
var tcData = new Object();
var psrData = new Object();
var psfData = new Object();

    everyone.now.setGear = function(val){
        gear = val;
        console.log(gear);
        if(typeof _listeners.gear != 'undefined'){
            _listeners.gear(new ShiftEvent(val));
        }
    }
    everyone.now.setTripComputer = function(data){
        tcData = data;
        console.log(data);
        if(typeof _listeners.tripcomputer != 'undefined'){
            _listeners.tripcomputer(new TripComputerEvent(tcData));
        }
    }
    
    everyone.now.setPsFront = function(data){
        psfData = data;
        console.log(data);
        if(typeof _listeners.parksensorsFront != 'undefined'){
            _listeners.parksensorsFront(new ParkSensorEvent('parksensors-front',psfData));
        }
    }

    everyone.now.setPsRear = function(data){
        psrData = data;
        console.log(data);
        if(typeof _listeners.parksensorsRear != 'undefined'){
            _listeners.parksensorsRear(new ParkSensorEvent('parksensors-rear',psrData));
        }
    }    
    
    function get(type){
        switch(type){
            case 'gear': 
                return new ShiftEvent(gear);
                break;
            case 'tripcomputer':
                return new TripComputerEvent(tcData);
                break;
            case 'parksensors-front':
                return new ParkSensorEvent(type, psfData);
                break;
            case 'parksensors-rear':
                return new ParkSensorEvent(type, psrData);
                break;
            default:
                console.log('nothing found...');
            
        }
    }   
    function addListener(type, listener){
       console.log('registering listener ' + type);
        switch(type){
            case 'gear':
                _listeners.gear = listener;
                break;
            case 'tripcomputer':
                _listeners.tripcomputer = listener;
                break;
            case 'parksensors-front':
                _listeners.parksensorsFront = listener;
                break;
            case 'parksensors-rear':
                _listeners.parksensorsRear = listener;
                break;    
            default:
                console.log('type ' + type + ' undefined.');
        }
    }
    exports.get = get;
    exports.addListener = addListener;
})(module.exports);
