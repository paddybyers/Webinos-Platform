 	if (typeof webinos === "undefined") { webinos = {}; }
	if (!webinos.discovery) { webinos.discovery = {}; }

	//android
	
	var disc = require('bridge').load('org.webinos.impl.DiscoveryImpl', this);
	
	HRMfindservice = function(serviceType,onFound){
	
		try 
		{
			disc.findServices(serviceType, function(service){onFound(service);}, null, null);
			console.log("discoveryTests - END");
		}
		catch(e) {
			console.log("discoveryTests - error: "+e.message);
		}
	};
	
	exports.HRMfindservice = HRMfindservice;
