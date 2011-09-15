//rpc for tv module
(function () {
	var tvmodule = require('./webinos.server.tv.js').tv;
	var rpc = require('../../rpc.js');

	var RemoteTVDisplayManager={};
	RemoteTVDisplayManager.setChannel = function ( params,  successCallback,  errorCallback) {
		tvmodule.tv.display.setChannel(params[0],function(channel){
			successCallback(channel);
		},function(){
			
		});
	};
	
	RemoteTVDisplayManager.addEventListener = function ( params,  successCallback,  errorCallback, objectRef) {
		
		if(params[0]==='channelchange'){
		
		tvmodule.tv.display.addEventListener(params[0],function(channel){
			var json = webinos.rpc.createRPC(objectRef, "onchannelchangeeventhandler", channel);
			webinos.rpc.executeRPC(json);
		},params[2]);
		
		}
	};
	
	var RemoteTVTunerManager={};
	RemoteTVTunerManager.getTVSources = function ( params,  successCallback,  errorCallback) {
		tvmodule.tv.tuner.getTVSources(function(sources){
			successCallback(sources);
		},function(){
			
		});
	};

	rpc.registerObject("TVTunerManager", RemoteTVTunerManager);
	rpc.registerObject("TVDisplayManager", RemoteTVDisplayManager);

})();