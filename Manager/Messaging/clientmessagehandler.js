(function() {

webinos = {};
webinos.message = {};

//setting address 
var address = {};  

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

// only call this once after session setup 

webinos.message.registerSender = function(address){
  var options = {};
  options.register = true;
  options.address = address;
  var message = this.createMessage(options);
  return message;
}

webinos.message.ClientonMessageReceived = function(message, callback){
  console.log("message: ", message);
  console.error("define the callback function");
}

webinos.message.createSessionid = function(){
} 


/**
 * Export messaging handler definitions for node.js
 */
if (typeof exports !== 'undefined'){
	exports.createMessage = webinos.message.createMessage;
	exports.registerSender = webinos.message.registerSender;
	exports.createMessageId = webinos.message.createMessageId;
	exports.ClientonMessageReceived = webinos.message.ClientonMessageReceived;
}

}()); 




