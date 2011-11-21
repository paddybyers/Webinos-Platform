(function () {

	AuthenticationModule = function (obj) {
		"use strict";
		this.base = WebinosService;
		this.base(obj);
	};

	if (typeof webinos === "undefined") {
		webinos = {};
	}
	if (!webinos.authentication) {
		webinos.authentication = new AuthenticationModule();
	}

	AuthenticationModule.prototype = WebinosService.prototype;

	AuthenticationModule.prototype.authenticate = function (username, successCB, errorCB) {
		"use strict";
		var rpc = webinos.rpc.createRPC(this, "authenticate", [username]);
		webinos.rpc.executeRPC(rpc,
			function (params) {
				successCB(params);
			},
			function (error) {
				errorCB(error);
			}
		);
	};

	AuthenticationModule.prototype.isAuthenticated = function (username, successCB, errorCB) {
		"use strict";
		var rpc = webinos.rpc.createRPC(this, "isAuthenticated", [username]);
		webinos.rpc.executeRPC(rpc,
			function (params) {
				successCB(params);
			},
			function (error) {
				errorCB(error);
			}
		);
	};
	
	AuthenticationModule.prototype.getAuthenticationStatus = function (username, successCB, errorCB) {
		"use strict";
		var rpc = webinos.rpc.createRPC(this, "getAuthenticationStatus", [username]);
		webinos.rpc.executeRPC(rpc,
			function (params) {
				successCB(params);
			},
			function (error) {
				errorCB(error);
			}
		);
	};
	
}());
