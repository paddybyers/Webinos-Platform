(function() {

	AuthenticationModule = function (obj) {
		this.base = WebinosService;
		this.base(obj);
	};

	if (typeof webinos === "undefined") { webinos = {}; }
	if (!webinos.authentication) { webinos.authentication = new AuthenticationModule(); }


	AuthenticationModule.prototype = WebinosService.prototype;

	AuthenticationModule.prototype.authenticate = function (username, successCB, errorCB) {
		arguments[0] = username;
		var rpc = webinos.rpc.createRPC(this, "authenticate", arguments);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){
					errorCB(error);
				}
		);
	};

	AuthenticationModule.prototype.isAuthenticated = function (username, successCB, errorCB) {
		arguments[0] = username;
		var rpc = webinos.rpc.createRPC(this, "isAuthenticated", arguments);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){
					errorCB(error);
				}
		);
	};
	
	AuthenticationModule.prototype.getAuthenticationStatus = function (username, successCB, errorCB) {
		arguments[0] = username;
		var rpc = webinos.rpc.createRPC(this, "getAuthenticationStatus", arguments);
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
