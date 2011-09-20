if (typeof webinos === 'undefined') var webinos = {};

function Msg()
{
  socket = io.connect('http://localhost:8000');
  
  var ownid = "890";
  function send(message){
	
   socket.emit("message", message);
  }
  
  webinos.message.setSend(send);
  
  function getownid(){
	
   return ownid;
  }
  webinos.message.setGet(getownid);
  
  webinos.message.setSend(send);
  
  this.register = function(id)
  {
    //register sender
    this.message = webinos.message.registerSender(id);
    console.log(this.message);
    socket.emit("client-message", this.message);
    socket.on("server-message", function(message){
    console.log("message forwarded to me");
    //webinos.rpc.handleMessge(message);
    webinos.message.onMessageReceived(message);
    });
  }
  
  this.create = function()
  {
    //var rpc = webinos.rpc.createRPC("Test", "get42", arguments);
   
   tmp = webinos.rpc.createRPC("Test", "get42", arguments);
    tmp.id = 4;
    //create a message with payload
    var options = {
    register: false    
    ,type: "JSONRPC"             
    ,id:   0           
    ,from:  "890"      
    ,to:    "678"          
    ,resp_to:   "890"      
    ,timestamp:  0      
    ,timeout:  null
   // ,payload: webinos.rpc.createRPC("Test", "get42", arguments)
    ,payload: tmp
    }; 
    
   /* webinos.rpc.executeRPC(options.payload, function (params){
					successCB(params);
				},
				function (error){}
		); */
    this.message = webinos.message.createMessage(options);
    socket.emit("client-message", this.message);
    
    socket.on("server-message", function(message){
    console.log("message forwarded to me");
    //webinos.rpc.handleMessge(message);
    webinos.message.onMessageReceived(message);
    });

  }

 return this;
}	

