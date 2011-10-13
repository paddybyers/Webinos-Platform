(function() {

if (typeof webinos === "undefined") webinos = {};
if (typeof exports !== "undefined") rpc = require("./rpc.js");
else rpc = webinos.rpc; 

var getownid = null;
var separator = null;
var send = null;
webinos.message = {};
var clients = {};  // clients[regiestee->register]

//setting address: 

//address format in current session Manager code - PZH::PZP::appid::instanceid  
//address format defined in http://dev.webinos.org/redmine/projects/wp4/wiki/Entity_Naming_for_Messaging is:
//https://her_domain.com/webinos/other_user/urn:services-webinos-org:calender
/*
other_user@her_domain.com                        <-- name of user identity (PZH?)
  |
  +-- laptop                                     <-- name of the PZP
        |
        +-- urn:services-webinos-org:calender    <-- service type
              |
              +-- A0B3      
other_user@her_domain.com/laptop/urn:services-webinos-org:calender/
*/

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

//this function will be used when current address format changes, e.g. separator changes from "::" to "/"
webinos.message.setSeparator = function (sep){
	sep = sep;
}

webinos.message.createMessage = function (options){
	var message = {};
	for (var i in options){
	message[i] = options[i];
	}
	return message;
}

webinos.message.createMessageId = function(message, successHandler, errorHandler){
  //create a random messageid for it - to increase the range, replace 1024 with large number
  message.id =  1 + Math.floor(Math.random() * 1024);
  if( errorHandler || successHandler){
  messageCallbacks[message.id] = {onError: errorHandler, onSuccess: successHandler};
  }  
}

// only call this once for session setup 

webinos.message.registerSender = function(from, to){
  var options = {};
  options.register = true;
  options.to = to;
  options.from = from;
  var message = this.createMessage(options);
  return message;
}

function logObj(obj, name){
	for (var myKey in obj){
		console.log(name + "["+myKey +"] = "+obj[myKey]);
		if (typeof obj[myKey] == 'object') logObj(obj[myKey], name + "." + myKey);
	}
}

function write(rpc, respto, msgid){

	    //create response message
	    var options = {};
            options.to = respto;
            options.resp_to = respto;
            options.id = msgid;

	    options.payload = rpc;
	    message = webinos.message.createMessage(options);
            console.log("message.create:" + JSON.stringify(message));

 	    var to = message.to;
            var session1 = [to, self];
	    session1.join("->");
            console.log("write function - session1:" + session1);
	    var session2 = [self, to];
	    session2.join("->");
            console.log("write function - session2:" + session2);

	    if((!clients[session1]) && (!clients[session2]))  // not registered either way
	    {
              console.log("session not set up");
              //check occurances of "::" or "/" 
	      //var occurences = (message.to.split("/").length - 1);
              var occurences = (message.to.split("/").length - 1)
	      console.log("occurences:", occurences);

	      //strip from right side
	      //var data = message.to.split('/');
	      var data = message.to.split('/');
	      var id = data[0];
              console.log("id" + id);
	      var forwardto = message.to; 

	      for(i = 1; i < occurences; i++)
	      {
	        id = id + '/' + data[i];
		var new_session1 = [id, self];
		new_session1.join("->");
		var new_session2 = [self, id];
		new_session2.join("->");
	
		if(clients[new_session1] || clients[new_session2])
                { 
		  forwardto = id;
                  console.log("forwardto", forwardto);
                }
	       }
		send(message,forwardto);
	    }
	      else if(clients[session2])
              {
                console.log("clients[session2]:" + clients[session2]);
		send(message, clients[session2]);
              }
	      else if(clients[session1])
              {
                console.log("clients[session1]:" + clients[session1]);

		send(message, clients[session1]);
              }

}

rpc.setWriter(write);

webinos.message.onMessageReceived = function(message, sessionid){
 
  console.log("message received:" + message);
  message = JSON.parse(message);

  if(message.hasOwnProperty("register") && message.register)
  { 
    var from = message.from;
    var to = message.to;

    var regid = [from, to];
    //regid.join("->");  
    //regid.join("+");
    regid.join("and"); 
    console.log("regid = " + regid);

    //this is a register message, associate the address, with session id    
    if(sessionid)
    {
      console.log("register session: sessionid=" + sessionid);
      clients[regid] = sessionid;
    }
    else if(message.from)
    {
      clients[regid] = message.from;
      console.log("register session: regid=" + regid); 
      console.log("register session: clients[regid]=" + clients[regid]); 
    }
   
    console.log(" Message = " + message + ": clients[regid]" + clients[regid] );   
    logObj(message, "register Message");
    return; 
  }
  // check message destination 
  else if(message.hasOwnProperty("to") && (message.to))
  {
    // get own id?
    //self = getownid();
    self = getownid;
    console.log("Get own ID:" + self);

    //check if a session with destination has been stored 
    if(message.to !== self) 
    {
      console.log("Forwarding Message to: " + message.to);
           
      //if no session is available for the destination, forward to the hop nearest, 
      //i.e A->D, if session for D is not reachable, check C, then check B if C is not reachable
      //if(!clients[message.to])
      console.log("self:", self);
      var to = message.to;
      var session1 = [to, self];
      session1.join("->");
      console.log("session1:" + session1);
      var session2 = [self, to];
      session2.join("->");
      console.log("session2:" + session2);

      if((!clients[session1]) && (!clients[session2]))  // not registered either way
      {
        console.log("session not set up");
        //check occurances of "::" or "/" 
    
        //strip from right side
        //var occurences = (message.to.split("//").length - 1)
        var occurences = (message.to.split("/").length - 1)
        var data = message.to.split('/');
	var id = data[0];
        var forwardto = message.to; 

	for(i = 1; i < occurences; i++)
        {
	  id = id + '/' + data[i];
          var new_session1 = [id, self];
          new_session1.join("->");
          var new_session2 = [self, id];
          new_session2.join("->");
	
          if(clients[new_session1] || clients[new_session2])
            forwardto = id;
	}
        send(message,forwardto);
      }
      else if(clients[session2])
      {
        console.log("session2 is up");
        send(message, clients[session2]);
      }
      else if(clients[session1])
      {
        console.log("session1 is up, clients[session1]:", clients[session1]);
        send(message, clients[session1]);
      }	

      return;
    }
    
    else  //handle message on this server 
    {
     console.log("message.to:" + message.to);
     console.log("message.resp_to:" + message.resp_to);
  
     // if((message.type == "JSONRPC") && (message.payload))
      if(message.payload) 
      {
        if(message.to != message.resp_to)
        {   
          console.log(message.payload);
          console.log("message is not to myself:" + JSON.stringify(message));
          console.log("message.id =  " + message.id);
          console.log("Forwarding to RPC Message handler: " + JSON.stringify(message));
          var resp = message.resp_to;
          var msgid = message.id;
          rpc.handleMessage(message.payload, resp, msgid);
        } 
        else
        { 
          console.log("message comes back to me"); 
 
          //this is a message respnose to me 
          if(messageCallbacks[message.id])
          {
            console.log(messageCallbacks[message.id]);
            var tmp = JSON.parse(message.payload);
            console.log(tmp);
            messageCallbacks[message.id].onSuccess(tmp.result);
          }
	  else
	    console.log("messagecallbacks is not defined");
       } 
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
