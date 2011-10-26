if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('./rpc.js');

function findServices (params, successCB, errorCB, objectRef){
	var serviceType = params[0];
	var services = webinos.rpc.findServices(serviceType) || [];
	
	for (var i=0; i<services.length; i++) {
		console.log('rpc.findService: calling found callback for ' + services[i].id);
		var rpc = webinos.rpc.createRPC(objectRef, 'onservicefound', services[i]);
		webinos.rpc.executeRPC(rpc);
	}

}

var serviceDiscoModule = new RPCWebinosService({
	api:'ServiceDiscovery',
	displayName:'ServiceDiscovery',
	description:'Webinos ServiceDiscovery'
});
serviceDiscoModule.findServices = findServices;
webinos.rpc.registerObject(serviceDiscoModule);
