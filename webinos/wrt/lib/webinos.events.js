(function() {

	EventsModule = function(obj) {
		this.base = WebinosService;
		this.base(obj);

	};
	
	EventsModule.prototype = new WebinosService;
	
	
	EventsModule.prototype.createWebinosEvent = function (type, addressing, payload, inResponseTo, withTimeStamp, expiryTimeStamp, addressingSensitive){

		var rpc = webinos.rpc.createRPC(this, "createWebinosEvent",  arguments);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);	
		
		//	returns WebinosEvent
        //  raises(WebinosEventException);
	}
     
	EventsModule.prototype.addWebinosEventListener = function(listener, type, source, destination){

		var rpc = webinos.rpc.createRPC(this, "addWebinosEventListener",  arguments);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);
		
		// returns DOMString id
		// raises(WebinosEventException);
	}
                         
     
	EventsModule.prototype.removeWebinosEventListener = function(listenerId){
	 
		var rpc = webinos.rpc.createRPC(this, "removeWebinosEventListener",  arguments);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);
	 
		// raises(WebinosEventException);
		// returns void
	}
}());