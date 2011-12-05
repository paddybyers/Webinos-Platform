if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('../../../common/rpc/lib/rpc.js');



function createWebinosEvent (params, successCB, errorCB, objectRef){
	console.log("createWebinosEvent was invoked");
}

function addWebinosEventListener (params, successCB, errorCB, objectRef){
	console.log("addWebinosEventListener was invoked");
}

function removeWebinosEventListener (params, successCB, errorCB, objectRef){
	console.log("removeWebinosEventListener was invoked");
}

var events = new RPCWebinosService({
	api:'http://webinos.org/api/events',
	displayName:'Events API',
	description:'The events API for exchanging simple events between applications running on multiple or the same device.'
});
events.createWebinosEvent = createWebinosEvent;
events.addWebinosEventListener = addWebinosEventListener;
events.removeWebinosEventListener = removeWebinosEventListener;
webinos.rpc.registerObject(events);
