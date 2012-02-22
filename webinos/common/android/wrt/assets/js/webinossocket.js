(function(exports) {
	
	var CONNECTING = 0;
	var OPEN       = 1;
	var CLOSING    = 2;
	var CLOSED     = 3;

	var sockets = [];
	
	var WebinosSocket = function(){
		this.id = sockets.length;
		sockets.push(this);
		
		this.readyState = CONNECTING;
		exports.__webinos.openSocket(this.id);
	};

	WebinosSocket.CONNECTING = CONNECTING;
	WebinosSocket.OPEN       = OPEN;
	WebinosSocket.CLOSING    = CLOSING;
	WebinosSocket.CLOSED     = CLOSED;

	WebinosSocket.handleConnect = function(id) {
		var ws = sockets[id];
		if(ws) {
			if(ws.readyState == CONNECTING) {
				ws.readyState = OPEN;
				if(ws.onopen)
					ws.onopen();
			}
		}
	};

	WebinosSocket.handleDisconnect = function(id) {
		var ws = sockets[id];
		if(ws) {
			if(ws.readyState != CLOSED) {
				ws.readyState = CLOSED;
				if(ws.onclose)
					ws.onclose();
			}
		}
	};

	WebinosSocket.handleMessage = function(id, data) {
		var ws = sockets[id];
		if(ws) {
			if(ws.readyState == OPEN && ws.onmessage)
				ws.onmessage({data:data});
		}
	};

	WebinosSocket.prototype.send = function(data) {
		if(this.readyState != OPEN)
			throw new Error('IllegalStateError');
		
		exports.__webinos.send(this.id, data);
	};
	
	WebinosSocket.prototype.close = function(data) {
		if(this.readyState == OPEN || this.readyState == CONNECTING)
			exports.__webinos.closeSocket(this.id);
		
		if(this.readyState != CLOSED)
			this.readyState = CLOSING;
	};
	
	exports.WebinosSocket = WebinosSocket;
})(window);