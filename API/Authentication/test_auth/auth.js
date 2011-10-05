(function() {

	authenticationAPIsModule = function (){
	};

	var authData;
	
	authenticationAPIsModule.prototype = WebinosService.prototype;

	authenticationAPIsModule.prototype.authenticate = function (username, successCB, errorCB) {
		arguments[0] = username;
		var rpc = webinos.rpc.createRPC("AuthenticationAPIs", "authenticate", arguments);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){
					errorCB(error);
				}
		);
	};

	authenticationAPIsModule.prototype.isAuthenticated = function (username, successCB, errorCB) {
		arguments[0] = username;
		var rpc = webinos.rpc.createRPC("AuthenticationAPIs", "isAuthenticated", arguments);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){
					errorCB(error);
				}
		);
	};
	
	authenticationAPIsModule.prototype.getAuthenticationStatus = function (username, successCB, errorCB) {
		arguments[0] = username;
		var rpc = webinos.rpc.createRPC("AuthenticationAPIs", "getAuthenticationStatus", arguments);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){
					errorCB(error);
				}
		);
	};
	
}());
