if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('../../../common/rpc/lib/rpc.js');

var registeredListener = [];

var connectedApps = [];

function registerApplication(params, successCB, errorCB, objectRef){
	console.log("registerApplication was invoked: " + params);
	
	var app = {};
	app.params = params;
	app.objectRef = objectRef;
	connectedApps.push(app);
	
	successCB();
}

function createWebinosEvent (params, successCB, errorCB, objectRef){
	console.log("createWebinosEvent was invoked");
}

function addWebinosEventListener (params, successCB, errorCB, objectRef){
	console.log("addWebinosEventListener was invoked with params " + params.type + " " + params.listenerID);
	/*
	 * params attributes
	req.type = type;
	req.source = source;
	req.destination = destination;
	req.listenerID = listenerID;*/
	
	
	
	registeredListener.push(params);
}

function removeWebinosEventListener (params, successCB, errorCB, objectRef){
	console.log("removeWebinosEventListener was invoked");
}

function removeWebinosEventListener (params, successCB, errorCB, objectRef){
	console.log("removeWebinosEventListener was invoked");
}

function dispatchWebinosEvent(params, successCB, errorCB, objectRef){
	//callbacks, referenceTimeout, sync
	console.log("dispatchWebinosEvent was invoked: Payload: " + params.webinosevent.payload);
	
	
	for (var i = 0; i < registeredListener.length; i++){
		
		console.log("Listener@" + registeredListener[i].source);
		
		for (var j = 0; j < connectedApps.length; j++){
			
			console.log("Listener@" + registeredListener[i].source + " vs. connected app " + connectedApps[j].params);
			
			if (registeredListener[i].source == connectedApps[j].params){
				
            	params.listenerID = registeredListener[i].listenerID;
				json = webinos.rpc.createRPC(connectedApps[j].objectRef, "handleEvent", params);
             	webinos.rpc.executeRPC(json);
				
			}
			
		}
		
	}
	
}

var events = new RPCWebinosService({
	api:'http://webinos.org/api/events',
	displayName:'Events API',
	description:'The events API for exchanging simple events between applications running on multiple or the same device.'
});

events.WebinosEvent = {};
events.WebinosEvent.dispatchWebinosEvent = dispatchWebinosEvent;
events.registerApplication = registerApplication;
events.createWebinosEvent = createWebinosEvent;
events.addWebinosEventListener = addWebinosEventListener;
events.removeWebinosEventListener = removeWebinosEventListener;
webinos.rpc.registerObject(events);
