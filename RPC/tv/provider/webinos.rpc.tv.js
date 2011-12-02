//rpc for tv module
(function () {
	if (typeof webinos === 'undefined') var webinos = {};
	rpcfilePath = '../webinos/common/rpc/lib/';
	webinos.rpc = require('../../' + rpcfilePath +'rpc.js');
	var tvmodule = require('./webinos.server.tv.js').tv;

	var RemoteTVManager = new RPCWebinosService({
		api:'http://webinos.org/api/tv',
		displayName:'TV',
		description:'A TV.'
	});
	
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

	webinos.rpc.registerObject(RemoteTVManager);

})();