/*******************************************************************************
*  Code contributed to the webinos project
* 
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*  
*     http://www.apache.org/licenses/LICENSE-2.0
*  
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
* 
* Copyright 2011 Alexander Futasz, Fraunhofer FOKUS
******************************************************************************/
(function() {

/**
 * Webinos Service constructor.
 * @param rpcHandler A handler for functions that use RPC to deliver their result.  
 */
var TestModule = function(rpcHandler, params) {
	// inherit from RPCWebinosService
	this.base = RPCWebinosService;
	this.base({
		api:'http://webinos.org/api/test',
		displayName:'Test',
		description:'Test Module with the life answer.'
	});
	
	// member attribute
	this.testAttr = "Hello Attribute";

	// member attribute 
	this.listenAttr = {};
	
	// custom get42 attribute
	this.blaa = typeof params !== 'undefined' ? params[0] : 42;
	
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
	successCB(this.blaa + " " + params[0]);
}

// export our object
exports.Service = TestModule;

})();