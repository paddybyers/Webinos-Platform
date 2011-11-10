(function() {
	if (typeof webinos === "undefined") webinos = {};
	var channel = null;
	var sessionid = null;
	var connected_pzp = null;
	var connected_pzh = null;

	webinos.message_send = function(msg) {
		channel.send(JSON.stringify(msg));
	};
	
	webinos.getSessionId = function() {
		return sessionid;
	};	
	
	/**
	 * Creates the socket communication channel
	 * for a locally hosted websocket server at port 8080
	 * for now this channel is used for sending RPC, later the webinos
	 * messaging/eventing system will be used
	 */
	 function createCommChannel(successCB) {
		try{
			channel  = new WebSocket('ws://'+window.location.hostname+':81');
		} catch(e) {
			channel  = new MozWebSocket('ws://'+window.location.hostname+':81');
		}
				
		channel.onmessage = function(ev) {
			console.log('WebSocket Client: Message Received');
			console.log(JSON.parse(ev.data));
			var data = JSON.parse(ev.data);
			if(data.type === "prop" && data.payload.status === 'registeredBrowser') {
				sessionid = data.to;			
				connected_pzp = data.payload.connected_pzp;
				connected_pzh = data.payload.connected_pzh;
				webinos.message.setGet(sessionid);
				var msg = webinos.message.registerSender(sessionid , pzpid);
				webinos.message_send(pzpid, msg, null, null);
			} else if(data.type === "prop" && data.payload.status === "info") {
				$('#message').append('<li>'+data.payload.message+'</li>');				
			} else if(data.type === "prop" && data.payload.status === "pzh_info") {
				$("<option value=" + data.payload.message + " >" +data.payload.message + "</option>").appendTo("#pzp_list");
				$('#message').append('<li> PZH just joined: '+data.payload.message+'</li>');	
			}
		};
	}
	createCommChannel ();
	
	if (typeof webinos === 'undefined') webinos = {}; 	
	
	
}());
