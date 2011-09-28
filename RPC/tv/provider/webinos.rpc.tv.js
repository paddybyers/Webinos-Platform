//rpc for tv module
(function () {
	var tvmodule = require('./webinos.server.tv.js').tv;
	var rpc = require('../../rpc.js');

	var RemoteTVManager={
			tuner:{},
			display:{}
	};
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
			var json = webinos.rpc.createRPC(objectRef, "onchannelchangeeventhandler", channel);
			webinos.rpc.executeRPC(json);
		},useCapture);
		
		}
	};
	
	RemoteTVManager.tuner.getTVSources = function ( params,  successCallback,  errorCallback) {
		tvmodule.tv.tuner.getTVSources(function(sources){
			successCallback(sources);
		},function(){
			
		});
	};

	rpc.registerObject("TVManager", RemoteTVManager);

})();