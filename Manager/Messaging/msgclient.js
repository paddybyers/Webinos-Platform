(function(global) 
{
  function ClientMsgHandler(socket)
  {
    this.messageCallbacks = {};
    this.channel = {};

    if(!socket)
      alert("Please specify the socket to connect to");
    else
      this.socket = io.connect(socket);
  }

/* setup socket connection, channels, sendMessage, handle received message */

ClientMsgHandler.prototype = 
{
  //note: with multiplexing, the following function can be called multiple times
  // if this function is not called, default channel '/' is assumed
  createChannel: function(channel) 
  {
    if(!channel)
      alert("Please specify the channel, e.g. '/discovery'");
    else
      this.channel = this.socket.of(channel);
  }, 

  /*JsonRPC message Object - method+ parameter + messageid.   

	{
	 "method": "methodnamehere",
	 "params": [
		    {
		     "firstparam": "this contains information of the firstparam.",
		     "secondparam": 1121211234,
		     "thirdparam": "this contains information of the thirdparam."
		    },
		    {
		     "fourthparam": "this is already a different object.",
		     "secondparam": "there can be same name fields in different objects.",
		     "thirdparam": "this contains information of the thirdparam."
		    }
		   ],
	 "id": messageid 
	}
  */ 

  sendMessage: function(obj, errorHandler, successHandler)
  {
    if(!obj.hasOwnProperty("id") || (!obj.id)) 
      //create a random messageid for it 
      obj.id =  1 + Math.floor(Math.random() * 12);  

    if( errorHandler || successHandler)
    {
      this.messageCallbacks[obj.id] = {onError: errorHandler, onSuccess: successHandler};
    }

    this.socket.send(obj, this.messageCallbacks[obj.id]);
    return obj;
  },
  
  onMessageReceived: function(message, callback) 
  {
    console.log("message: ", message);
    console.error("define the callback function");
  }

 };
  global.ClientMsgHandler = ClientMsgHandler;
})(this);


