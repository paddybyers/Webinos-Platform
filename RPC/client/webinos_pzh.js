(function() {
if (typeof webinos === "undefined") webinos = {};
	var channel = null;
	var sessionid = null;
		
	webinos.message_send = function(to, rpc, successCB, errorCB) {
		channel.send(JSON.stringify(rpc));
	}
	
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
			if(data.type === "prop" && data.payload.status === "info") {
				$('#message').append('<li>'+data.payload.message+'</li>');				
			}
		};
	}
	createCommChannel ();
	
	if (typeof webinos === 'undefined') webinos = {}; 
}());
