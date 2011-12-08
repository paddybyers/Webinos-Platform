(function() {

	Context = function(obj) {
		this.base = WebinosService;
		this.base(obj);
	};
	
	Context.prototype = new WebinosService;
	
	Context.prototype.bindService = function (bindCB, serviceId) {
		// actually there should be an auth check here or whatever, but we just always bind
		this.find = find;
		this.executeQuery = executeQuery;
		
		if (typeof bindCB.onBind === 'function') {
			bindCB.onBind(this);
		};
	}
	
	function find(params, successCB,errorCB) {
		var rpc = webinos.rpc.createRPC(this, "find",  params);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){
					errorCB(error);
				}
		);
	}
	 function executeQuery(query, successCB,errorCB) {
	    var rpc = webinos.rpc.createRPC(this, "executeQuery",  query);
	    webinos.rpc.executeRPC(rpc,
	        function (params){
	          successCB(params);
	        },
	        function (error){
	          errorCB(error);
	        }
	    );
	  }
})();