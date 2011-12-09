	var AuthenticationModule = function (obj) {
		"use strict";
		this.base = WebinosService;
		this.base(obj);
	};

	AuthenticationModule.prototype = new WebinosService();

	function authenticate(username, successCB, errorCB) {
		"use strict";
		var rpc = webinos.rpc.createRPC(this, "authenticate", [username]);
		webinos.rpc.executeRPC(rpc,
			function (params) {
				console.log("authenticate successCB: ", params);
				successCB(params);
			},
			function (error) {
				console.log("authenticate errorCB: ", error);
				errorCB(error);
			}
		);
	}

	function isAuthenticated(username, successCB, errorCB) {
		"use strict";
		var rpc = webinos.rpc.createRPC(this, "isAuthenticated", [username]);
		webinos.rpc.executeRPC(rpc,
			function (params) {
				console.log("isAuthenticated successCB: ", params);
				successCB(params);
			},
			function (error) {
				console.log("isAuthenticated errorCB: ", error);
				errorCB(error);
			}
		);
	}
	
	function getAuthenticationStatus(username, successCB, errorCB) {
		"use strict";
		var rpc = webinos.rpc.createRPC(this, "getAuthenticationStatus", [username]);
		webinos.rpc.executeRPC(rpc,
			function (params) {
				console.log("getAuthenticatationStatus successCB: ", params);
				successCB(params);
			},
			function (error) {
				console.log("getAuthenticationStatus errorCB: ", error);
				errorCB(error);
			}
		);
	}

	AuthenticationModule.prototype.bindService = function (bindCB, serviceId) {
		"use strict";
		this.authenticate = authenticate;
		this.isAuthenticated = isAuthenticated;
		this.getAuthenticationStatus = getAuthenticationStatus;
		
		if (typeof bindCB.onBind === 'function') {
			bindCB.onBind(this);
		}
	};

