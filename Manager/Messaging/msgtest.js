if (typeof webinos === 'undefined') var webinos = {};

function Msg()
{
  this.socket = io.connect('http://localhost:8000');
  
  this.register = function(id)
  {
    //reigster sender
    this.message = webinos.message.registerSender(id);
    console.log(this.message);
    //this.socket.send(this.message);
    this.socket.emit("client-message", this.message);
  }
  
  this.create = function()
  {
    //create a message with payload
    var options = {
    register: false    
    ,type: 1             
    ,id:   0           
    ,from:  "0123456"      
    ,to:    "234"          
    ,resp_to:   null       
    ,timestamp:  0      
    ,timeout:  null
    ,payload:  { "method": "echo", "params": ["Hello JSON-RPC"], "id": 1} 
    }; 
    
    this.message = webinos.message.createMessage(options);
    this.socket.emit("client-message", this.message);
  }

 return this;
}	

