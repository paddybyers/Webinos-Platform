//RPC layer for tv module
(function() {
	"use strict";
	
	var _TV_MODULE_IMPLEMENTATION_ = 'mock'; //coolstream, ce4100

	//get the reference to a certain tv module implementation
	var tvmodule = require('./webinos.service_tv.'+_TV_MODULE_IMPLEMENTATION_+'.js').tv;
	
	var RemoteTVManager = function(rpcHandler) {
		// inherit from RPCWebinosService
		this.base = RPCWebinosService;
		this.base({
			api:'http://webinos.org/api/tv',
			displayName:'TV ('+_TV_MODULE_IMPLEMENTATION_+' service)',
			description:'TV control and managment.'
		});
		
		this.display.addEventListener = function ( params,  successCallback,  errorCallback, objectRef) {
			if(params[0]==='channelchange'){
				var useCapture = params[2];
			
			tvmodule.tv.display.addEventListener('channelchange',function(channel){
				var json = rpcHandler.createRPC(objectRef, "onchannelchangeeventhandler", channel);
				rpcHandler.executeRPC(json);
			},useCapture);
			
			}
		};
	};
	
	RemoteTVManager.prototype = new RPCWebinosService;
	
	//API: tv module implementation 
	RemoteTVManager.prototype.tuner = {};
	RemoteTVManager.prototype.display = {};
	
	RemoteTVManager.prototype.display.setChannel = function ( params,  successCallback,  errorCallback) {
		tvmodule.tv.display.setChannel(params[0],function(channel){
			successCallback(channel);
		},function(){
			
		});
	};
	
	RemoteTVManager.prototype.tuner.getTVSources = function ( params,  successCallback,  errorCallback) {
		tvmodule.tv.tuner.getTVSources(function(sources){
			successCallback(sources);
		},function(){
			
		});
	};

	// export our object
	exports.Service = RemoteTVManager;

}());