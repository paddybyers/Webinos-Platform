(function() {

	UserProfileIntModule = function(obj) {
		this.base = WebinosService;
		this.base(obj);
		
		this.objectRef = Math.floor(Math.random()*101);
	};
	UserProfileIntModule.prototype = new WebinosService;
	
	UserProfileIntModule.prototype.findProf = function (successCB) {
		var rpc = webinos.rpc.createRPC(this, "findProf", arguments);
	
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);
	};
	
	UserProfileIntModule.prototype.createProf = function (successCB) {
		var rpc = webinos.rpc.createRPC(this, "createProf", arguments);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);
	};

	UserProfileIntModule.prototype.replaceProf = function (successCB) {
		var rpc = webinos.rpc.createRPC(this, "replaceProf", arguments);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);
	};

	UserProfileIntModule.prototype.deleteProf = function (successCB) {
		var rpc = webinos.rpc.createRPC(this, "deleteProf", arguments);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);
	}	;
}());