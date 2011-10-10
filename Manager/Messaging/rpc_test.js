if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('./rpc.js');

function get42 (params, successCB, errorCB, objectRef){
	console.log("get42 was invoked");
	successCB(42);
}

function echo (params, successCB, errorCB, objectRef){
	console.log("echo was invoked");
	successCB("Hello " + params[0]);
}

testAttr = "Hello Attribute";

echoAttr = {};
echoAttr.echo = echo;

testModule = {};
testModule.get42 = get42;
testModule.testAttr = testAttr;
testModule.echoAttr = echoAttr;
webinos.rpc.registerObject("Test", testModule);
