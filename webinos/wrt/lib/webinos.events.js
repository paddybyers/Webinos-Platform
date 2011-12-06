(function() {

	//Event Module Functionality
	
	var registeredListeners = {};
	var registeredDispatchListeners = {};
	
	var temporaryRandomAppID = "MyRandomApplicationID" +  Math.floor(Math.random()*1001);
	
	var eventService = null;
	
	EventsModule = function(obj) {
		this.base = WebinosService;
		this.base(obj);
		eventService = this;
	};
	
	EventsModule.prototype = new WebinosService;
	
	EventsModule.prototype.bind = function(success) {

		var rpc = webinos.rpc.createRPC(this, "registerApplication",  temporaryRandomAppID);
		rpc.fromObjectRef =  Math.floor(Math.random()*1001);
		
		var callback = new RPCWebinosService({api:rpc.fromObjectRef});
		callback.handleEvent = function (event) {
			console.log("Received a new WebinosEvent");
			
			//search in registered listeners for interested listeners based on eventType etc
			
			if (typeof registeredListeners[event.listenerID] !== undefined){
				registeredListeners[event.listenerID](event.webinosevent);
			}
			
			
			
			
		};
		webinos.rpc.registerCallbackObject(callback);
		
		webinos.rpc.executeRPC(rpc, function () {
			success();
		});
	}
	
	
	
	
	EventsModule.prototype.createWebinosEvent = function (type, addressing, payload, inResponseTo, withTimeStamp, expiryTimeStamp, addressingSensitive){

		var anEvent = new WebinosEvent();
		anEvent.type = type;
		anEvent.addressing = addressing;
		anEvent.payload = payload;
		anEvent.inResponseTo = inResponseTo;
		anEvent.timeStamp = new Date().getTime();
		anEvent.expiryTimeStamp = expiryTimeStamp;
		anEvent.addressingSensitive = addressingSensitive;
		
		
		return anEvent;
		/*
		var rpc = webinos.rpc.createRPC(this, "createWebinosEvent",  arguments);
		webinos.rpc.executeRPC(rpc,
				function (params){
					successCB(params);
				},
				function (error){}
		);*/	
		
		//	returns WebinosEvent
        //  raises(WebinosEventException);
	}
     
	EventsModule.prototype.addWebinosEventListener = function(listener, type, source, destination){

		var listenerID =  new Date().getTime();
		
		registeredListeners[listenerID] = listener;
		
		var req = {};
		req.type = type;
		req.source = source;
		
		//temporary random app ID as source
		req.source = temporaryRandomAppID;
		
		
		req.destination = destination;
		req.listenerID = listenerID;
		
		var rpc = webinos.rpc.createRPC(this, "addWebinosEventListener",  req);
		webinos.rpc.executeRPC(rpc,
				function (params){
					console.log("New WebinosEvent listener registered");
				},
				function (error){
					console.log("Error while registering new WebinosEvent listener");
				}
		);
		
		// returns DOMString id
		// raises(WebinosEventException);
		
		return listenerID;
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
	
	
	// WebinosEvent functionalities
	
	WebinosEvent = function() {
		this.id =  Math.floor(Math.random()*1001);  //DOMString
		this.type = null;					//DOMString
		this.addressing = null;  			//WebinosEventAddressing
		this.inResponseTo = null;			//WebinosEvent
		this.timeStamp = null;				//DOMTimeStamp
		this.expiryTimeStamp = null;		//DOMTimeStamp
		this.addressingSensitive = null;	//bool
		this.forwarding = null;			//WebinosEventAddressing
		this.forwardingTimeStamp = null;	//DOMTimeStamp
		this.payload = null;				//DOMString
	};
	


	WebinosEvent.prototype.dispatchWebinosEvent = function(callbacks, referenceTimeout, sync){

		var params = {};
		params.webinosevent = this;
		params.referenceTimeout = referenceTimeout;
		params.sync = sync;
		
		
		registeredDispatchListeners[this.id] = callbacks;
		
		
		var rpc = webinos.rpc.createRPC(eventService, "WebinosEvent.dispatchWebinosEvent",  params);
		webinos.rpc.executeRPC(rpc,
				function (params){
					console.log("Event dispatched");
				},
				function (error){
					console.log("Error while dispatching");
				}
		);
		
		
    	//returns void
    	//raises(WebinosEventException);
         
    }
    
	WebinosEvent.prototype.forwardWebinosEvent = function(forwarding, withTimeStamp, callbacks, referenceTimeout, sync){
    	
    	//returns void
    	//raises(WebinosEventException);
    }
	
	
}());