(function() {

	//AppLauncher Module Functionality
	
	
	AppLauncherModule = function(obj) {
		this.base = WebinosService;
		this.base(obj);
	};
	
	AppLauncherModule.prototype = new WebinosService();

	AppLauncherModule.prototype.bind = function(success) {
		success();
	};
	
	
	AppLauncherModule.prototype.launchApplication = function (successCallback, errorCallback, applicationID, params){
		//returns pendingOp
		
		var reqParams = {};
		reqParams.applicationID = applicationID;
		reqParams.params = params;
		
		var rpc = webinos.rpcHandler.createRPC(this, "launchApplication", reqParams);
		webinos.rpcHandler.executeRPC(rpc,
				function (params){
					successCallback(params);
				},
				function (error){
					errorCallback(error);
				}
		);

	};
     
	AppLauncherModule.prototype.appInstalled = function(applicationID){

		//returns bool
	};
	
	
}());