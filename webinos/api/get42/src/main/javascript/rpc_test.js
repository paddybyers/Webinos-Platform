if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('../../../../../common/rpc/src/main/javascript/rpc.js');

function get42 (params, successCB, errorCB, objectRef){
	console.log("get42 was invoked");
	successCB(42);
}

function echo (params, successCB, errorCB, objectRef){
	console.log("echo was invoked");
	successCB("Hello " + params[0]);
}

var testAttr = "Hello Attribute";

var echoAttr = {};
echoAttr.echo = echo;

var testModule = new RPCWebinosService({
	api:'http://webinos.org/api/test',
	displayName:'Test',
	description:'Test Module with the life answer.'
});
testModule.get42 = get42;
testModule.testAttr = testAttr;
testModule.echoAttr = echoAttr;
webinos.rpc.registerObject(testModule);
