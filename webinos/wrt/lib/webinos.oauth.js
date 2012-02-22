(function() {

	oAuthModule = function(obj) {
		this.base = WebinosService;
		this.base(obj);
	};
	
	oAuthModule.prototype = new WebinosService;
	
	oAuthModule.prototype.init = function(requestTokenUrl,consumer_key,consumer_secret,callbackUrl, successCB, errorCB){
			var params = [];
			params.push(requestTokenUrl);
			params.push(consumer_key);
			params.push(consumer_secret);
			params.push(callbackUrl);
			var rpc = webinos.rpcHandler.createRPC(this, "init", [params]);
			webinos.rpcHandler.executeRPC(rpc,
				function (pars){
					successCB(pars);
				},
				function (error){
					errorCB(error);
				}
			);
		};
	oAuthModule.prototype.get = function(requestUrl,access_token,access_token_secret, successCB, errorCB){
			var params = [];
			params.push(requestUrl);
			params.push(access_token);
			params.push(access_token_secret);
			var rpc = webinos.rpcHandler.createRPC(this, "get", params);
			webinos.rpcHandler.executeRPC(rpc,
				function (pars){
					successCB(pars);
				},
				function (error){
					errorCB(error);
				}
			);
		};

}());