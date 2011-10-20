(function() {

	UserProfileIntModule = function (){
			this.objectRef = Math.floor(Math.random()*101);
	};	
	
	UserProfileIntModule.prototype.findProf = function (successCB) {
		var rpc = webinos.rpc.createRPC("UserProfileInt", "findProf", arguments);
	
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);
	};
	
	UserProfileIntModule.prototype.createProf = function (successCB) {
		var rpc = webinos.rpc.createRPC("UserProfileInt", "createProf", arguments);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);
	};

	UserProfileIntModule.prototype.replaceProf = function (successCB) {
		var rpc = webinos.rpc.createRPC("UserProfileInt", "replaceProf", arguments);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);
	};

	UserProfileIntModule.prototype.deleteProf = function (successCB) {
		var rpc = webinos.rpc.createRPC("UserProfileInt", "deleteProf", arguments);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);
	}	;
}());