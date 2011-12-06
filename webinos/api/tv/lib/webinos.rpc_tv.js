//RPC layer for tv module
(function() {
	"use strict";
	var _TV_MODULE_IMPLEMENTATION_ = 'mock'; //coolstream, ce4100

	//get the reference to RPC object
	var root = require("../dependencies.json").root.location;
	var dependencies = require(root + "/dependencies.json");
	var rpc = require(root + dependencies.rpc.location + "/lib/rpc.js");	
	
	//get the reference to a certain tv module implementation
	var tvmodule = require('./webinos.service_tv.'+_TV_MODULE_IMPLEMENTATION_+'.js').tv;
	var RemoteTVManager = new rpc.RPCWebinosService({
		api:'http://webinos.org/api/tv',
		displayName:'TV ('+_TV_MODULE_IMPLEMENTATION_+' service)',
		description:'TV control and managment.'
	});
	
	//API: tv module implementation 
	RemoteTVManager.tuner = {};
	RemoteTVManager.display = {};
	
	RemoteTVManager.display.setChannel = function ( params,  successCallback,  errorCallback) {
		tvmodule.tv.display.setChannel(params[0],function(channel){
			successCallback(channel);
		},function(){
			
		});
	};
	
	RemoteTVManager.display.addEventListener = function ( params,  successCallback,  errorCallback, objectRef) {
		
		if(params[0]==='channelchange'){
			var useCapture = params[2];
		
		tvmodule.tv.display.addEventListener('channelchange',function(channel){
			var json = rpc.createRPC(objectRef, "onchannelchangeeventhandler", channel);
			rpc.executeRPC(json);
		},useCapture);
		
		}
	};
	
	RemoteTVManager.tuner.getTVSources = function ( params,  successCallback,  errorCallback) {
		tvmodule.tv.tuner.getTVSources(function(sources){
			successCallback(sources);
		},function(){
			
		});
	};

	rpc.registerObject(RemoteTVManager);

}());