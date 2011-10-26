(function()	{

	if (typeof webinos === "undefined") {
		webinos = {};
	}
	if (typeof exports !== "undefined") {
		rpc = require("./rpc.js");
	}
	else {
		rpc = webinos.rpc; 
	}

	var getownid = null;
	var separator = null;
	var send = null;
	var object = null;
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
	webinos.message.setSend = function (sender)	{
		send = sender;
	};

	webinos.message.setObject = function (obj)	{
		object = obj;
	};


	webinos.message.setGet = function (getter)	{
		getownid = getter;
	};

//this function will be used when current address format changes, e.g. separator changes from "::" to "/"
	webinos.message.setSeparator = function (sep)	{
			separator = sep;
	};

	webinos.message.createMessage = function (options)	{
		var message = {};
		for (var i in options)	{
			message[i] = options[i];
		}
		return message;
	};

	webinos.message.createMessageId = function(message, successHandler, errorHandler){
  //create a random messageid for it - to increase the range, replace 1024 with large number
		message.id =  1 + Math.floor(Math.random() * 1024);
		if( errorHandler || successHandler)	{
			messageCallbacks[message.id] = {onError: errorHandler, onSuccess: successHandler};
		}  
	};

// only call this once for session setup 

	webinos.message.registerSender = function(from, to)	{
		var options = {};
		options.register = true;
		options.to = to;
		options.from = from;
		var message = this.createMessage(options);
		return message;
	};

	function logObj(obj, name)	{
		for (var myKey in obj)	{
			console.log(name + "["+myKey +"] = "+obj[myKey]);
			if (typeof obj[myKey] === 'object') logObj(obj[myKey], name + "." + myKey);
		}
	}

	function write(rpc, respto, msgid)	{

		//create response message
		var options = {};
	    options.to = respto;
	    options.resp_to = respto;
	    options.id = msgid;
	    
		options.payload = rpc;
		message = webinos.message.createMessage(options);
		console.log("MSGHANDLER:  message.create:" + JSON.stringify(message));
		
		var to = message.to;
		var session1 = [to, self];
		session1.join("->");
		console.log("MSGHANDLER:  write function - session1:" + session1);
		var session2 = [self, to];
		session2.join("->");
		console.log("MSGHANDLER:  write function - session2:" + session2);

	    if((!clients[session1]) && (!clients[session2]))  // not registered either way
	    {
			console.log("MSGHANDLER:  session not set up");
			var occurences = (message.to.split(separator).length - 1);
			console.log("MSGHANDLER:  occurences:", occurences);

			var data = message.to.split(separator);
			var id = data[0];
			var forwardto = data[0]; 

			for(var i = 1; i < occurences; i++)	{
				id = id + separator + data[i];
				var new_session1 = [id, self];
				new_session1.join("->");
				var new_session2 = [self, id];
				new_session2.join("->");
	
				if(clients[new_session1] || clients[new_session2]) {
					forwardto = id;
					console.log("MSGHANDLER:  forwardto", forwardto);
				}
			}
			send(message, forwardto, object);
		}
	    else if(clients[session2]){
	    	console.log("MSGHANDLER:  clients[session2]:" + clients[session2]);
	    	send(message, clients[session2], object);
	    }
	    else if(clients[session1]){
	    	console.log("MSGHANDLER:  clients[session1]:" + clients[session1]);
	    	send(message, clients[session1], object);
	    }
	}

rpc.setWriter(write);

webinos.message.onMessageReceived = function(message, sessionid){
 
  console.log("MSGHANDLER:  message received:" + message);
  message = JSON.parse(message);

  if(message.hasOwnProperty("register") && message.register)
  { 
    var from = message.from;
    var to = message.to;

    var regid = [from, to];
    regid.join("->");  
    console.log("MSGHANDLER:  regid = " + regid);

    //this is a register message, associate the address, with session id    
    if(sessionid)
    {
      console.log("MSGHANDLER:  register session: sessionid=" + sessionid);
      clients[regid] = sessionid;
    }
    else if(message.from)
    {
      clients[regid] = message.from;
      console.log("MSGHANDLER:  register session: regid=" + regid); 
      console.log("MSGHANDLER:  register session: clients[regid]=" + clients[regid]); 
    }
   
    logObj(message, "register Message");
    return; 
  }
  // check message destination 
  else if(message.hasOwnProperty("to") && (message.to))
  {
    //self = getownid();
    self = getownid;
    console.log("MSGHANDLER:  getownid:" + self);

    //check if a session with destination has been stored 
    if(message.to !== self) 
    {
      console.log("MSGHANDLER:  Forwarding Message to: " + message.to);
           
      //if no session is available for the destination, forward to the hop nearest, 
      //i.e A->D, if session for D is not reachable, check C, then check B if C is not reachable
      var to = message.to;
      var session1 = [to, self];
      session1.join("->");
      var session2 = [self, to];
      session2.join("->");

      if((!clients[session1]) && (!clients[session2]))  // not registered either way
      {
        console.log("MSGHANDLER:  session not set up");
        //check occurances of "::" or "/" 
	var occurences = (message.to.split(separator).length - 1);
	var data = message.to.split(separator);
	var id = data[0];
        var forwardto = data[0]; 
        
	//strip from right side
	for(var i = 1; i < occurences; i++)
        {
          id = id + separator + data[i];
          var new_session1 = [id, self];
          new_session1.join("->");
          var new_session2 = [self, id];
          new_session2.join("->");
	
          if(clients[new_session1] || clients[new_session2])
            forwardto = id;
	}
        send(message,forwardto, object);
      }
      else if(clients[session2])
      {
        console.log("MSGHANDLER:  session2 is up");
        send(message, clients[session2], object);
      }
      else if(clients[session1])
      {
        console.log("MSGHANDLER:  session1 is up, clients[session1]:", clients[session1]);
        send(message, clients[session1], object);
      }	

      return;
    }
    
    else  //handle message on this server 
    {
     console.log("MSGHANDLER:  message.to:" + message.to);
     console.log("MSGHANDLER:  message.resp_to:" + message.resp_to);
  
     // if((message.type == "JSONRPC") && (message.payload))
      if(message.payload) 
      {
        if(message.to != message.resp_to)
        {   
          console.log(message.payload);
          console.log("MSGHANDLER:  message is not to myself:" + JSON.stringify(message));
          console.log("MSGHANDLER:  message.id =  " + message.id);
          console.log("MSGHANDLER:  Forwarding to RPC Message handler: " + JSON.stringify(message));
          var resp = message.resp_to;
          var msgid = message.id;
          rpc.handleMessage(message.payload, resp, msgid);
        } 
        else
        { 
          console.log("MSGHANDLER:  message comes back to me"); 
 
          //this is a message respnose to me 
          if(messageCallbacks[message.id])
          {
            console.log(messageCallbacks[message.id]);
            var tmp = JSON.parse(message.payload);
            console.log(tmp);
            messageCallbacks[message.id].onSuccess(tmp.result);
          }
	  else
	    console.log("MSGHANDLER:  messagecallbacks is not defined");
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
};  
/**
 * Export messaging handler definitions for node.js
 */
if (typeof exports !== 'undefined'){
    exports.setSend = webinos.message.setSend;
    exports.setGet = webinos.message.setGet;
    exports.createMessage = webinos.message.createMessage;
    exports.registerSender = webinos.message.registerSender;
    exports.createMessageId = webinos.message.createMessageId;
    exports.onMessageReceived = webinos.message.onMessageReceived;
}

}());
