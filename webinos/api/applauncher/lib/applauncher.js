(function() {

	/**
	 * Webinos Service constructor.
	 * @param rpcHandler A handler for functions that use RPC to deliver their result.  
	 */
	var WebinosAppLauncherModule = function(rpcHandler) {
		// inherit from RPCWebinosService
		this.base = RPCWebinosService;
		this.base({
			api:'http://webinos.org/api/applauncher',
			displayName:'AppLauncher API',
			description:'The AppLauncher API for starting applications.'
		});
	};
	
	

	WebinosAppLauncherModule.prototype = new RPCWebinosService;

	WebinosAppLauncherModule.prototype.launchApplication = function (params, successCB, errorCB, objectRef){
		console.log("launchApplication was invoked. AppID: " +  params.applicationID + " Parameters: " + params.params);
		
		var startUpLine = params.applicationID;
		
		var i;
		if (typeof params.params !== 'undefined'){
			for (i = 0; i < params.params.length; i++){
				startUpLine = startUpLine + " " + params.params[i];
			}
		}
		
		console.log("AppLauncher trying to launch: " + startUpLine);
		
		var exec = require('child_process').exec;
		exec(startUpLine, function callback(error, stdout, stderr){
		    console.log("Result: " + error + " " + stdout + " " + stderr);
		    
		    if (error != null){
		    	errorCB();
		    }
		    else {
		    	successCB();
		    } 
		    	
		});
		
	};

	
	WebinosAppLauncherModule.prototype.appInstalled = function (params, successCB, errorCB, objectRef){
		console.log("appInstalled was invoked");
	};


	exports.Service = WebinosAppLauncherModule;

})();
