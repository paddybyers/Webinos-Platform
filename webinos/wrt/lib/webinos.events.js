(function() {

	//Event Module Functionality
	
	var registeredListeners = {};
	var registeredDispatchListeners = {};
	
	var eventService = null;
	
	EventsModule = function(obj) {
		this.base = WebinosService;
		this.base(obj);
		eventService = this;
		
		
		this.temporaryRandomAppID = "MyRandomApplicationID" +  Math.floor(Math.random()*1001);
	};
	
	EventsModule.prototype = new WebinosService;
	
	EventsModule.prototype.bind = function(success) {

		var rpc = webinos.rpcHandler.createRPC(this, "registerApplication", this.temporaryRandomAppID);
		rpc.fromObjectRef =  Math.floor(Math.random()*1001);
		
		var callback = new RPCWebinosService({api:rpc.fromObjectRef});
		callback.handleEvent = function (params,scb,ecb) {
			console.log("Received a new WebinosEvent");
			
			//search in registered listeners for interested listeners based on eventType etc
			
			if (typeof registeredListeners[params.listenerID] !== undefined){
				registeredListeners[params.listenerID](params.webinosevent);
				scb();
			}
			else{
				ecb();
			}
		};
		
		webinos.rpcHandler.registerCallbackObject(callback);
		
		webinos.rpcHandler.executeRPC(rpc, function () {
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
		var rpc = webinos.rpcHandler.createRPC(this, "createWebinosEvent",  arguments);
		webinos.rpcHandler.executeRPC(rpc,
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
		req.source = this.temporaryRandomAppID;
		
		
		req.destination = destination;
		req.listenerID = listenerID;
		
		var rpc = webinos.rpcHandler.createRPC(this, "addWebinosEventListener",  req);
		webinos.rpcHandler.executeRPC(rpc,
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
	 
		var rpc = webinos.rpcHandler.createRPC(this, "removeWebinosEventListener",  arguments);
		webinos.rpcHandler.executeRPC(rpc,
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
		params.webinosevent = {};
		params.webinosevent.id = this.id;
		params.webinosevent.type = this.type;
		params.webinosevent.adressing = this.addressing;
		params.webinosevent.inResponseTo = this.inResponseTo;
		params.webinosevent.timeStamp = this.timeStamp;
		params.webinosevent.expiryTimeStamp = this.expiryTimeStamp;
		params.webinosevent.addressingSensitive = this.addressingSensitive;
		params.webinosevent.forwarding = this.forwarding;
		params.webinosevent.forwardingTimeStamp = this.forwardingTimeStamp;
		params.webinosevent.payload = this.payload;
		params.referenceTimeout = referenceTimeout;
		params.sync = sync;
		
		
		registeredDispatchListeners[this.id] = callbacks;
		
		var rpc = webinos.rpcHandler.createRPC(eventService, "WebinosEvent.dispatchWebinosEvent",  params);
		
		if (typeof callbacks !== "undefined"){	
		
			console.log("Registering delivery callback");
			
			rpc.fromObjectRef =  Math.floor(Math.random()*1001);
		
			var callback = new RPCWebinosService({api:rpc.fromObjectRef});
		
			callback.onSending = function (params) {
			//params.event, params.recipient
				
				if (typeof callbacks.onSending !== "undefined") {callbacks.onSending(params.event, params.recipient);}
			};
			callback.onCaching = function (params) {
				//params.event
				if (typeof callbacks.onCaching !== "undefined") {callbacks.onCaching(params.event);}
			};
			callback.onDelivery = function (params) {
			//params.event, params.recipient
				if (typeof callbacks.onDelivery !== "undefined") {callbacks.onDelivery(params.event, params.recipient);}
			};
			callback.onTimeout = function (params) {
			//params.event, params.recipient
				if (typeof callbacks.onTimeout !== "undefined") {callbacks.onTimeout(params.event, params.recipient);}
			};
			callback.onError = function (params) {
			//params.event, params.recipient, params.error
				if (typeof callbacks.onError !== "undefined") {callbacks.onError(params.event, params.recipient, params.error);}
			};
	
		
			webinos.rpcHandler.registerCallbackObject(callback);
		}
		
		webinos.rpcHandler.executeRPC(rpc);
		
    	//returns void
    	//raises(WebinosEventException);
         
    }
    
	WebinosEvent.prototype.forwardWebinosEvent = function(forwarding, withTimeStamp, callbacks, referenceTimeout, sync){
    	
    	//returns void
    	//raises(WebinosEventException);
    }
	
	
}());