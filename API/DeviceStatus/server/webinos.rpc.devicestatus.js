if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('../../../RPC/rpc.js');

function getComponents(aspect){
	console.log("getComponents was invoked");
	successCB("getComponents");
}

function isSupported(aspect, property){
	console.log("isSupported was invoked");
	successCB("isSupported");
}

function getPropertyValue (successCB, errorCB, prop){
	console.log("getPropertyValue was invoked");
	successCB("getPropertyValue");
}

function watchPropertyChange(successCB, errorCB, prop, options){
	console.log("watchPropertyChange was invoked");
	successCB("watchPropertyChange");
}

function clearPropertyChange(watchHandler){
	console.log("clearPropertyChange was invoked");
	successCB("clearPropertyChange");
}

deviceStatusModule = {};
deviceStatusModule.getComponents = getComponents;
deviceStatusModule.isSupported = isSupported;
deviceStatusModule.getPropertyValue = getPropertyValue;
deviceStatusModule.watchPropertyChange = watchPropertyChange;
deviceStatusModule.clearPropertyChange = clearPropertyChange;

webinos.rpc.registerObject("DeviceStatus", deviceStatusModule);
