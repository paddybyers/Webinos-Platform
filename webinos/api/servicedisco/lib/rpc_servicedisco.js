(function () {

	/**
	 * Webinos Service constructor.
	 * @param rpcHandler A handler for functions that use RPC to deliver their result.  
	 */
	function ServiceDiscoModule (rpcHandler) {
		// inherit from RPCWebinosService
		this.base = RPCWebinosService;
		this.base({
			api: 'ServiceDiscovery',
			displayName: 'ServiceDiscovery',
			description: 'Webinos ServiceDiscovery'
		});

		this.findServices = function (params, successCB, errorCB, objectRef) {
			var responseTo, msgid, serviceType = params[0];
			if (params[1] !== null)
				responseTo = params[1];
			if (params[2] !== null)
				msgid = params[2];

			var services = rpcHandler.findServices(serviceType) || [];
			
			function stripFuncs(el) {
				return typeof el.getInformation === 'function' ? el.getInformation() : el; 
			}
			services = services.map(stripFuncs);

			for ( var i = 0; i < services.length; i++) {
				console.log('rpc.findService: calling found callback for ' + services[i].id);
				var rpc = rpcHandler.createRPC(objectRef, 'onservicefound', services[i]);
				rpcHandler.executeRPC(rpc, undefined, undefined, responseTo, msgid);
			}
		};
	}

	ServiceDiscoModule.prototype = new RPCWebinosService;

	exports.Service = ServiceDiscoModule;

})();