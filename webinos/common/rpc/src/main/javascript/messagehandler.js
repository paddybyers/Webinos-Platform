(function()	{

	if (typeof webinos === "undefined") {
		webinos = {};
	}
	if (typeof module !== "undefined") {
		rpc = require("./rpc.js");
	}
	else {
		rpc = webinos.rpc; 
	}
	
	function logObj(obj, name)	{
		for (var myKey in obj)	{
			console.log(name + "["+myKey +"] = "+obj[myKey]);
			if (typeof obj[myKey] === 'object') logObj(obj[myKey], name + "." + myKey);
		}
	}

	webinos.message = {};
	
	/** Message fields:
	 * 
	 * var message = {
	 * register: false    //register sender if true
	 * ,type: "JSONRPC"   // JSONRPC message or other 
	 * ,id:   0           // messageid used to 
	 * ,from:  null       // sender address
	 * ,to:    null       // reciever address 
	 * ,resp_to:   null   // the destination to pass RPC result back to 
	 * ,timestamp:  0     // currently this parameter is not used   
	 * ,timeout:  null    // currently this parameter is not used
	 * ,payload:  null    // message body - RPC object
	 * }; 
	 */

	/** Address description: 

	 * address format in current session Manager code - PZH/PZP/appid/instanceid  
	 * address format defined in http://dev.webinos.org/redmine/projects/wp4/wiki/Entity_Naming_for_Messaging is:
	 * https://her_domain.com/webinos/other_user/urn:services-webinos-org:calender
	 *	
	 * other_user@her_domain.com                        <-- name of user identity (PZH?)
	 *  |
	 * +-- laptop                                     <-- name of the PZP
	 *         |
	 *        +-- urn:services-webinos-org:calender    <-- service type
	 *              |
	 *              +-- A0B3      
	 * other_user@her_domain.com/laptop/urn:services-webinos-org:calender/
	 */

    	var getOwnId = null;
	var separator = null;
    
	var sendMessage = null;
	var objectRef = null;
	 
	/** 
	 * To store the session id after registration. e.g. PZP registers with
	 *  PZH, PZH creates a session id X for PZP. client[PZP->PZH] = X
	 *  
	 *  TODO need to adjust clients[] to accommodate PZH farm, PZP farm scenarios
	 */  	
	var clients = {};  

	var message = {};
	
	/** To Store callback functions associated with each message. 
	 */
	var messageCallbacks = {};

	/**
	 * Set the sendMessage function that should be used to send message. 
	 * Developers use this function to call different sendmessage APIs under
	 * different communication environment. e.g. in socket.io, the 
	 * sendMessageFunction could be: io.sockets.send(sessionid); 
	 */
	webinos.message.setSendMessage = function (sendMessageFunction)	{
		sendMessage = sendMessageFunction;
	};
	
	webinos.message.sendMessage = function (message, sessionid, objectRef)	{
		sendMessage (message, sessionid, objectRef);
	};
	
	/**
	 * To set the reference to differtnet objects. e.g. in a PZH farm, objectRef  
	 * is used to refer to different PZH.
	 */
	webinos.message.setObjectRef = function (objref)	{
		objectRef = objref;
	};
	
	/**
	 * Function to get own identity.  
	 */
	webinos.message.setGetOwnId = function (OwnIdGetter)	{
		getOwnId = OwnIdGetter;
	};

	/**
	 *  Set separator used to in Addressing to separator different part of the address. 
	 *  e.g. PZH/PZP/APPID, "/" is the separator here 	
	 */ 
	webinos.message.setSeparator = function (sep)	{
		separator = sep;
	};
	
	/**
	 *  Create new message. Refer Message fields above for more details.
	 */ 
	webinos.message.createMessage = function (options)	{
		var message = {};
		
		for (var i in options)	{
			message[i] = options[i];
		}
		return message;
	};

	/**
	 *  Create messageid. This messageid is used as an identifier for callback function associated 
	 *  with the message.  
	 */ 
	webinos.message.createMessageId = function(message, successHandler, errorHandler){
		message.id =  1 + Math.floor(Math.random() * 1024);
		if( errorHandler || successHandler)	{
			messageCallbacks[message.id] = {onError: errorHandler, onSuccess: successHandler};
		}  
	};

	/**
	 *  Only need to call this once. This will result a sessionid in the receiver's storage. 
	 */ 
	webinos.message.registerSender = function(from, to)	{
		var options = {};
		options.register = true;
		options.to = to;
		options.from = from;
		var message = this.createMessage(options);
		return message;
	};

	/**
	 * RPC writer
	 */
	 
	function write(rpc, respto, msgid)	{

		//create response message
		var options = {};
	    options.to = respto;
	    options.resp_to = respto;
	    options.id = msgid;
	    
		options.payload = rpc;
		message = webinos.message.createMessage(options);
		
		var to = message.to;
		var session1 = [to, self];
		session1.join("->");
		var session2 = [self, to];
		session2.join("->");
		
	    if((!clients[session1]) && (!clients[session2]))  // not registered either way
	    {
			console.log("MSGHANDLER:  session not set up");
			var occurences = (message.to.split(separator).length - 1);
			
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
			webinos.message.sendMessage(message, forwardto, objectRef);
		}
	    else if(clients[session2]){
	    	console.log("MSGHANDLER:  clients[session2]:" + clients[session2]);
	    	webinos.message.sendMessage(message, clients[session2], objectRef);
	    }
	    else if(clients[session1]){
	    	console.log("MSGHANDLER:  clients[session1]:" + clients[session1]);
	    	webinos.message.sendMessage(message, clients[session1], objectRef);
	    }
	}

	rpc.setWriter(write);

	webinos.message.onMessageReceived = function(message, sessionid){
 
		if(typeof message === "string")
			message = JSON.parse(message);
 
		if(message.hasOwnProperty("register") && message.register)
		{ 
			var from = message.from;
			var to = message.to;

			var regid = [from, to];
			regid.join("->");  

			//Register message to associate the address with session id
    		if(message.from)
			{
				clients[regid] = message.from;
			}
    		else if(sessionid)
    		{
    			clients[regid] = sessionid;
    		}
   
    		logObj(message, "register Message");
    		return; 
		}
		// check message destination 
		else if(message.hasOwnProperty("to") && (message.to))
		{
			self = getOwnId;
			
			//check if a session with destination has been stored 
			if(message.to !== self) 
			{
				logObj(message, "forward Message");
           
				//if no session is available for the destination, forward to the hop nearest, 
				//i.e A->D, if session for D is not reachable, check C, then check B if C is not reachable
				var to = message.to;
				var session1 = [to, self];
				session1.join("->");
				var session2 = [self, to];
				session2.join("->");

				// not registered either way
				if((!clients[session1]) && (!clients[session2]))  
				{
					logObj(message, "Sender, receiver not registered either way");
					//check occurances of separator used in addressing 
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
			        webinos.message.sendMessage(message,forwardto, objectRef);
				}
				else if(clients[session2])
				{
					webinos.message.sendMessage(message, clients[session2], objectRef);
				}
				else if(clients[session1])
				{
					webinos.message.sendMessage(message, clients[session1], objectRef);
				}	
				return;
			}
			//handle message on itself 
			else  
			{
				if(message.payload) 
				{	
			        if(message.to != message.resp_to)
			        {   
						console.log(message.payload);
						var resp = message.resp_to;
						var msgid = message.id;
						rpc.handleMessage(message.payload, resp, msgid);
			        } 
			        else
			        { 
			        	//this is a message respnose to me 
			        	if(messageCallbacks[message.id])
			        	{
			        		message.payload = message.payload;
			        		if(typeof message.payload.method !== "undefined")
			        		{
			        			logObj(message, "Message forwarded to RPC to handle callback");
			        			var resp = message.resp_to;
			        			var msgid = message.id;	       
			        			rpc.handleMessage(message.payload, resp, msgid);
			        		}
			        		else
			        		{
			        			messageCallbacks[message.id].onSuccess(message.payload.result);
			        		}
			        	}
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

//TODO add fucntion to release clients[] when session is closed -> this will also affect RPC callback funcs 

/**
 * Export messaging handler definitions for node.js
 */
if (typeof exports !== 'undefined'){
	exports.setSeparator = webinos.message.setSeparator; 
	exports.setGetOwnId = webinos.message.setGetOwnId;
	exports.setObjectRef = webinos.message.setObjectRef;
	exports.setSendMessage = webinos.message.setSendMessage;
	exports.sendMessage = webinos.message.sendMessage;
	exports.createMessage = webinos.message.createMessage;
	exports.registerSender = webinos.message.registerSender;
	exports.createMessageId = webinos.message.createMessageId;
	exports.onMessageReceived = webinos.message.onMessageReceived;
}

}());
