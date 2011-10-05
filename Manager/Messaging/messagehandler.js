(function() {

if (typeof webinos === "undefined") webinos = {};
if (typeof exports !== "undefined") rpc = require("./rpc.js");
else rpc = webinos.rpc; 

getownid = null;
send = null;

webinos.message = {};
clients = {};

//setting address 
var address = {
/*PZH: 
,PZP:
,appid:
,instanceid: */
};  

/*var message = {
  register: false    //register sender
  ,type: 0            // JSONRPC message or other 
  ,id:   0           // messageid
  ,from:  null           //sender's address
  ,to:    null           // destination address 
  ,resp_to:   null       // response destination 
  ,timestamp:  0      
  ,timeout:  null
  ,payload:  null        // message body 
}; */

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

webinos.message.createMessage = function (options){
  for (var i in options) 
  {
    message[i] = options[i];
  }
  return message;
}

webinos.message.createMessageId = function(message, errorHandler, successHandler){
  if(!message.hasOwnProperty("id") || (!obj.id)) 
  //create a random messageid for it 
  message.id =  1 + Math.floor(Math.random() * 12);
  if( errorHandler || successHandler)
  {
    messageCallbacks[message.id] = {onError: errorHandler, onSuccess: successHandler};
  }  
}

// only call this once for session setup 

webinos.message.registerSender = function(address){
  var options = {};
  options.register = true;
  options.address = address;
  var message = this.createMessage(options);
  return message;
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
	    options.to = respto;
	    options.payload = rpc;
	    message = webinos.message.createMessage(options);
	    send(message, clients[message.to]);
	    logObj(clients, "clients");
	    console.log("message write"); 
        }

rpc.setWriter(write);

webinos.message.onMessageReceived = function(message, sessionid){
  
  console.log("message: ", message);
  
  if(message.hasOwnProperty("register") && message.register && message.address)
  {  
    //this is a register message, associate the address, with session id    
    clients[message.address] = sessionid;
    console.log(clients[message.address]);   
    return; 
  }
  // check message destination 
  if(message.hasOwnProperty("to") && (message.to))
  {
    // get own id?
    self = getownid();
    console.log("Get own ID:" + self);
    console.log("message send to:" +  message.to);
    //check if a session with destination has been stored 
    if(message.to != self)
    {
      console.log("Forwarding Message to: " + message.to);
      //forward the message
      if(clients[message.to])
      {
        console.log("message forward to:" + message.to);
        sessionid = clients[message.to];
        send(message, sessionid);
      }
      else
      {
        console.log("no session has been established with the forward destination " + message.to);
        //no session with destination - shall we start a new session here?
      }
      return;
    }
    else  //handle message on this server 
    {
     // if((message.type == "JSONRPC") && (message.payload))
      if(message.payload) 
      { 
        console.log(message.payload);
        console.log("Forwarding to RPC Message handler: " + message.payload);
        
        //can rpc.handMessage return a new message?mail
        rpc.handleMessage(message.payload, message.resp_to);
        /*
        if((message.resp_to) && (clients[message.resp_to]))
        {
          
          send(message, clients[message.resp_to]);
        }*/
      }
      else
      {
      // what other message type are we expecting?
      }
      return; 
    }
    return;
  }
}  
/**
 * Export messaging handler definitions for node.js
 */
if (typeof exports !== 'undefined'){
    exports.setSend = webinos.message.setSend;
    exports.setGet = webinos.message.setGet;
	exports.createMessage = webinos.message.createMessage;
	exports.registerSender = webinos.message.registerSender;
	exports.createMessageId = webinos.message.createMessageId;
	exports.ClientonMessageReceived = webinos.message.ClientonMessageReceived;
	exports.onMessageReceived = webinos.message.onMessageReceived;
}

}());
