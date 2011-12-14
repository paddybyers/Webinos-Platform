(function() {

/**
 * Webinos Service constructor.
 * @param rpcHandler A handler for functions that use RPC to deliver their result.  
 */
var TestModule = function(rpcHandler) {
	// inherit from RPCWebinosService
	this.base = RPCWebinosService;
	this.base({
		api:'http://webinos.org/api/test',
		displayName:'Test',
		description:'Test Module with the life answer squared.'
	});
	
	// member attribute
	this.testAttr = "Bonjour Attribute";

	// member attribute 
	this.listenAttr = {};
	
	// member function attached to listenAttr
	this.listenAttr.listenFor42 = function(params, successCB, errorCB, objectRef){
		console.log("listenerFor42 was invoked");
		
		// call the registered listener twice, delivering an object
		for (var i=0; i<2; i++) {
			// use RPC to deliver result
			var rpc = rpcHandler.createRPC(objectRef, 'onEvent', {msg:i + " 42"});
			rpcHandler.executeRPC(rpc);
		}
	};
}

TestModule.prototype = new RPCWebinosService;

// another member function
TestModule.prototype.get42 = function(params, successCB, errorCB, objectRef){
	console.log("get42 was invoked");
	
	var er = {};
	er.code = 1234;
	er.message = "Just a Test Error";
	
	errorCB(er);
}

// export our object
exports.Service = TestModule;

})();
