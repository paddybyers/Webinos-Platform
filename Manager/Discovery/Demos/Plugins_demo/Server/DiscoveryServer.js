//ziran.sun@samsung.com

var http = require('http');
var io = require('socket.io');	
var sys = require("sys");

var httpserver = http.createServer(function(req,res)
{
  var output = {message: "Hello World!"};
  var body = JSON.stringify(output);

  res.writeHead(200, {'Content-Type': 'application/json', 'Content-Length': body.length});
  res.end(body);
});

httpserver.listen(8000);
io = io.listen(httpserver);

io.sockets.on('connection', function (socket)
{
  socket.on('findservice', function (data) {
  
  //speak to other components, e.g. context manager, local storage etc..., pass information back to client 
   
  //Discovery mechanism is wrapped as browser plugin - trigger plugin in browser
  console.log(data);
  socket.emit('Discovery-plugin');
  
  //Discovery mechanism can be called directly as JS interface. Server can do the discovery itself 
  //Or trigger an event back to client  
 // socket.emit('Discovery-direct');
  });
	
  socket.on('bindservice', function (serviceType) {

  //Server check credential/authentication information
  });

  //...socket.on 'other event ...add here 	
	
	
});
