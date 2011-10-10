if (typeof webinos === 'undefined') var webinos = {};
var http = require('http');
var io = require('socket.io');	
var sys = require("sys");

// interfacing with rpc
rpc = require("./rpc.js");
var msg = require("./messagehandler.js");

var httpserver = http.createServer(function(req,res){
  var output = {message: "Hello World!"};
  var body = JSON.stringify(outpuhandleMessaget);

  res.writeHead(200, {'Content-Type': 'application/json', 'Content-Length': body.length});
  res.end(body);
});

httpserver.listen(8000);
io = io.listen(httpserver);

io.sockets.on('connection', function (socket){
  var handler = {};
  var callback = {};
  var clients = {};
  
  function send(message, sessionid){
	//io.sockets.socket(sessiontid).send(message);
	io.sockets.socket(sessionid).emit("server-message", message);
	console.log("message send to " + sessionid); 

}
  msg.setSend(send);
  
  function getownid(){
	//io.sockets.socket(sessiontid).send(message);
	//io.sockets.socket(sessionid).emit("server-message", message);
	
	//return "0123456";
	return "678";
   }
  
  msg.setGet(getownid);
  
  socket.on('client-message', function (message) {
 
  console.log(message);
 
  sessionid = socket.id;
  
  msg.onMessageReceived(message,sessionid);
 
  });
});

