(function() {

if (typeof webinos === "undefined") webinos = {};
if (typeof exports !== "undefined") rpc = require("./rpc.js");
else rpc = webinos.rpc; 

var getownid = null;
var send = null;
webinos.message = {};
var clients = {};
//setting address 
var address = {};  
var message = {};
var messageCallbacks = {};

/**
 * Sets the send that should be used to send message on a specific session.
 */
webinos.message.setSend = function (sender){
	send = sender;
}

webinos.message.setGet = function (getter){
	getownid = getter;
}

webinos.message.getOwnId = function (){
	return getownid;
}

webinos.message.createMessage = function (options){
	var message = {};
	for (var i in options) {
	message[i] = options[i];
	}
	return message;
}

webinos.message.createMessageId = function(message, successHandler, errorHandler){
	message.id =  1 + Math.floor(Math.random() * 12);
	if( errorHandler || successHandler) {
		messageCallbacks[message.id] = {onError: errorHandler, onSuccess: successHandler};
	}  
}
messageOrigin = {};
webinos.message.track = function(message) {
	messageOrigin[message.id] = message.from;
}

webinos.message.registerSenderClient = function(address) {
	clients[address] = address;
	console.log('Message: registered client '+clients[address]);   
}

function logObj(obj, name){
	for (var myKey in obj){
		console.log(name + "["+myKey +"] = "+obj[myKey]);
		if (typeof obj[myKey] == 'object') logObj(obj[myKey], name + "." + myKey);
	}
}

function write(rpc, respto){
	//create response message
	var options = {};
	options.to = respto.address;
	options.payload = rpc;
	options.id = respto.id;
	var message = webinos.message.createMessage(options);
	send(message); //, clients[message.to]);
	console.log("Message: write"); 
 }

rpc.setWriter(write);

webinos.message.onMessageReceived = function(message, sessionid) {
	message = JSON.parse(message);
	// check message destination 
	if(message.hasOwnProperty("to") && (message.to)) {
		// get own id?    
		self = getownid;
		console.log("Message: Get own ID:" + self);
		console.log("Message: send to:" +  message.to);
		//check if a session with destination has been stored 
		if(message.to != self) {
			console.log("Message: Forwarding to: " + message.to);
			//forward the message
			if(clients[message.to]) {
				console.log("Message: forward to:" + message.to);
				var data=message.from.split('::');
				var id = data[0]+'::'+data[1];
				message.resp_to = id;
				webinos.message.track(message);
				send(message);
      			} else {
				console.log("Message: no session has been established with the forward destination " + message.to);
				console.log("Message: forward to PZH since it is not registered with us:" + message.to);
				var data=message.from.split('::');
				var id = data[0]+'::'+data[1];
				message.resp_to = id;
				webinos.message.track(message);
				send(message);
			        //no session with destination - shall we start a new session here?
      			}
			return;
		} else if(messageCallbacks[message.id]){
			console.log(messageCallbacks[message.id]);
			var tmp = JSON.parse(message.payload);
			console.log(tmp);
			messageCallbacks[message.id].onSuccess(tmp.result);
		} else if(messageOrigin[message.id]) {
			message.to = messageOrigin[message.id];
			console.log('one of the apps message');
			webinos.message.onMessageReceived(JSON.stringify(message));
		} else { //handle message on this server 
		// if((message.type == "JSONRPC") && (message.payload))
			if(message.payload) { 
				console.log("Message: Forwarding to RPC Message handler: ");
				console.log(message.payload);
				var resp = {address: message.resp_to, id: message.id};
				//can rpc.handMessage return a new message?mail
        			rpc.handleMessage(message.payload, resp);       
      			} 
			return; 
    		}
    		return;
  	}
}  
/**
 * Export messaging handler definitions for node.js
 */
if (typeof exports !== 'undefined') {
	exports.setSend = webinos.message.setSend;
	exports.setGet = webinos.message.setGet;
	exports.createMessage = webinos.message.createMessage;
	exports.registerSender = webinos.message.registerSender;
	exports.createMessageId = webinos.message.createMessageId;
	exports.ClientonMessageReceived = webinos.message.ClientonMessageReceived;
	exports.onMessageReceived = webinos.message.onMessageReceived;
}

}());
