(function() {

	TestModule = function (){
		this._testAttr = "HelloWorld";
		this.__defineGetter__("testAttr", function (){
			return this._testAttr + " Success";
		});
		
		this.echoAttr = new EchoObj();
		
	};
	
	
	TestModule.prototype.get42PZP = function (successCB) {
		var payload = webinos.rpc.createRPC("Test", "get42", []); // RPCservicename, function
		payload.id = 1;
		var options = {register: false, type: "JSONRPC", id: 0,
			from: webinos.getSessionId(), to: webinos.getPZPId(), resp_to: webinos.getSessionId(),
			timestamp: 0, timeout:  null, payload: JSON.stringify(payload)
		}; 		
		webinos.message.createMessageId(options, successCB);
		msg = webinos.message.createMessage(options);
		webinos.send(msg);		
	}
	
	TestModule.prototype.get42PZPtoPZH = function (successCB) {
		var payload = webinos.rpc.createRPC("Test", "get42", []); // RPCservicename, function
		payload.id = 1;
		var options = {register: false, type: "JSONRPC", id: 0,
			from: webinos.getSessionId(), to:webinos.getPZHId(), resp_to: webinos.getSessionId(),
			timestamp: 0, timeout:  null, payload: JSON.stringify(payload)
		};

		webinos.message.createMessageId(options, successCB);
		msg = webinos.message.createMessage(options);
		webinos.send(msg);
	}
	
	TestModule.prototype.get42PZPtoPZHtoPZP = function (successCB) {
		var payload = webinos.rpc.createRPC("Test", "get42", []); // RPCservicename, function
		payload.id = 1;
		var options = {register: false, type: "JSONRPC", id: 0,
			from: webinos.getSessionId(), to: webinos.getOtherPZP(), resp_to: webinos.getSessionId(),
			timestamp: 0, timeout:  null, payload: JSON.stringify(payload)
		}; 		
		webinos.message.createMessageId(options, successCB);
		msg = webinos.message.createMessage(options);
		webinos.send(msg);
	}

	TestModule.prototype.get42PZPtoPZHtoPZH = function (successCB) {
		var payload = webinos.rpc.createRPC("Test", "get42", []); // RPCservicename, function
		payload.id = 1;
		var options = {register: false, type: "JSONRPC", id: 0,
			from: webinos.getSessionId(), to: "nick@allott", resp_to: webinos.getSessionId(),
			timestamp: 0, timeout:  null, payload: JSON.stringify(payload)
		}; 		
		webinos.message.createMessageId(options, successCB);
		msg = webinos.message.createMessage(options);
		webinos.send(msg);
	}

	TestModule.prototype.get42PZPtoPZHtoPZHtoPZP = function (successCB) {
		var payload = webinos.rpc.createRPC("Test", "get42", []); // RPCservicename, function
		payload.id = 1;
		var options = {register: false, type: "JSONRPC", id: 0,
			from: webinos.getSessionId(), to: "nick@allott/PC", resp_to: webinos.getSessionId(),
			timestamp: 0, timeout:  null, payload: JSON.stringify(payload)
		}; 		
		webinos.message.createMessageId(options, successCB);
		msg = webinos.message.createMessage(options);
		webinos.send(msg);
	}

	EchoObj = function (){
	
		
	};
	
	EchoObj.prototype.echo = function (attr, successCB) {
		var payload = webinos.rpc.createRPC("Test", "echoAttr.echo", []); // RPCservicename, function

		payload.id = 2;
		var options = {register: false, type: "JSONRPC", id: 0,
			from: webinos.getSessionId(), to: webinos.getPZPId(), resp_to: webinos.getSessionId(),
			timestamp: 0, timeout:  null, payload: JSON.stringify(payload)
		}; 		
		webinos.message.createMessageId(options, successCB);
		msg = webinos.message.createMessage(options);
		webinos.send(msg);	
	}
	
}());
