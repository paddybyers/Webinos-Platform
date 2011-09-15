if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('./rpc.js');

function get42 (params, successCB, errorCB, objectRef){
	successCB(42);
}

testAttr = "Hello Attribute";

testModule = {};
testModule.get42 = get42;
testModule.testAttr = testAttr;
webinos.rpc.registerObject("Test", testModule);
