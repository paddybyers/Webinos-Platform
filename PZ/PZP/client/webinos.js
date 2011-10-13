(function() {
	var channel = null;
	var sessionid = null;
	var pzpid = null;
	var pzhid = null;
	var otherpzp = null;
	webinos.send = function(text) {
		console.log('WebSocket Client: Message Sent');
		console.log(text);
		channel.send(JSON.stringify(text));
	}
	webinos.getSessionId = function() {
		return sessionid;
	}
	webinos.getPZPId = function() {
		return pzpid;
	}
	webinos.getPZHId = function() {
		return pzhid;
	}
	webinos.getOtherPZP = function() {
		return otherpzp;
	}
	/**
	 * Creates the socket communication channel
	 * for a locally hosted websocket server at port 8080
	 * for now this channel is used for sending RPC, later the webinos
	 * messaging/eventing system will be used
	 */
	function createCommChannel(successCB) {
		try{
			channel  = new WebSocket('ws://127.0.0.1:8080');
		} catch(e) {
			channel  = new MozWebSocket('ws://127.0.0.1:8080');
		}
				
		channel.onmessage = function(ev) {
			console.log('WebSocket Client: Message Received');
			console.log(JSON.parse(ev.data));
			var data = JSON.parse(ev.data);
			if(data.type === "prop") {
				sessionid = data.to;
				pzpid = data.from;
				pzhid = data.resp_to;
				otherpzp = data.payload;
				webinos.message.setGet(sessionid);
				var msg = webinos.message.registerSender(sessionid,pzpid);
				webinos.send(msg);
			}
			else {
				webinos.message.onMessageReceived(JSON.stringify(data));
			}
		};
	}
	createCommChannel ();
			
	if (typeof webinos === 'undefined') webinos = {}; 
	
	///////////////////// WEBINOS INTERNAL COMMUNICATION INTERFACE ///////////////////////////////
	function logObj(obj, name){
		for (var myKey in obj){
			console.log(name + "["+myKey +"] = "+obj[myKey]);
			if (typeof obj[myKey] == 'object') logObj(obj[myKey], name + "." + myKey);
		}
	}
	///////////////////// WEBINOS DISCOVERY INTERFACE ///////////////////////////////
	webinos.ServiceDiscovery = {};
	webinos.ServiceDiscovery.registeredServices = 0;
	webinos.ServiceDiscovery.findServices = function (type, callback) {
		if (type == "Test"){
			var tmp = new TestModule();
			tmp.origin = 'ws://127.0.0.1:8080';
			webinos.ServiceDiscovery.registeredServices++;
			callback.onFound(tmp);
			return;
		}		
	};	
}());
