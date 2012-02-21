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
* Copyright 2012 Torsec -Computer and network security group-
* Politecnico di Torino
******************************************************************************/

(function() {
	
	AuthenticationModule = function (obj) {
		"use strict";
		this.base = WebinosService;
		this.base(obj);
	};

	AuthenticationModule.prototype = new WebinosService();

	function authenticate(username, successCB, errorCB) {
		"use strict";
		var rpc = webinos.rpcHandler.createRPC(this, "authenticate", [username]);
		webinos.rpcHandler.executeRPC(rpc,
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
		var rpc = webinos.rpcHandler.createRPC(this, "isAuthenticated", [username]);
		webinos.rpcHandler.executeRPC(rpc,
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
		var rpc = webinos.rpcHandler.createRPC(this, "getAuthenticationStatus", [username]);
		webinos.rpcHandler.executeRPC(rpc,
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

})();
