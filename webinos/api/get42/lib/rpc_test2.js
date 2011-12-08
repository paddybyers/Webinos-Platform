if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('../../../common/rpc/lib/rpc.js');

function get42 (params, successCB, errorCB, objectRef){
	console.log("get42 was invoked");
	
	var er = {};
	er.code = 1234;
	er.message = "Just an Test Error";
	
	errorCB(er);
}

function listenFor42 (params, successCB, errorCB, objectRef){
	console.log("listenerFor42 was invoked");
	
	// call the registered listener twice, delivering an object
	for (var i=0; i<2; i++) {
		var rpc = webinos.rpc.createRPC(objectRef, 'onEvent', {msg:i + " 42"});
		webinos.rpc.executeRPC(rpc);
	}
}

var testAttr = "Bonjour Attribute";

var listenAttr = {};
listenAttr.listenFor42 = listenFor42;

var testModule = new RPCWebinosService({
	api:'http://webinos.org/api/test',
	displayName:'Test',
	description:'Test Module with the life answer squared.'
});
testModule.get42 = get42;
testModule.testAttr = testAttr;
testModule.listenAttr = listenAttr;
webinos.rpc.registerObject(testModule);
