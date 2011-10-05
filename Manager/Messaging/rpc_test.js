if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('./rpc.js');

function get42 (params, successCB, errorCB, objectRef){
	console.log("get42 invoked");
	successCB(42);
	
}

testModule = {};
testModule.get42 = get42;
webinos.rpc.registerObject("Test", testModule);
