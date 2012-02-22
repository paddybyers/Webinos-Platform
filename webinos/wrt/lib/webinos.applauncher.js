/*******************************************************************************
*  Code contributed to the webinos project
* 
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*  
*     http://www.apache.org/licenses/LICENSE-2.0
*  
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
* 
* Copyright 2012 André Paul, Fraunhofer FOKUS
******************************************************************************/
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