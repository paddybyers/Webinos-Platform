if (typeof webinos === 'undefined') var webinos = {};

//var pathclass = require('path');
//webinos.rpc = require(pathclass.resolve(__dirname + '../../../../../common/rpc/lib/rpc.js'));
webinos.rpc = require('../../../../../common/rpc/lib/rpc.js');

function get42 (params, successCB, errorCB, objectRef){
	console.log("get42 was invoked");
	successCB(42*2);
}

function echo (params, successCB, errorCB, objectRef){
	console.log("echo was invoked");
	successCB("Bonjour " + params[0]);
}

var testAttr = "Bonjour Attribute";

var echoAttr = {};
echoAttr.echo = echo;

var testModule = new RPCWebinosService({
	api:'http://webinos.org/api/test',
	displayName:'Test',
	description:'Test Module with the life answer squared.'
});
testModule.get42 = get42;
testModule.testAttr = testAttr;
testModule.echoAttr = echoAttr;
webinos.rpc.registerObject(testModule);
