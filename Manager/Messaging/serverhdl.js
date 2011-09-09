if (typeof webinos === 'undefined') var webinos = {};
//webinos.message = require('./messagehandler.js'); 
var http = require('http');
var io = require('socket.io');	
var sys = require("sys");

var chainGang = require('chain-gang');
var chain = chainGang.create({workers: 3})

var httpserver = http.createServer(function(req,res){
  var output = {message: "Hello World!"};
  var body = JSON.stringify(output);

  res.writeHead(200, {'Content-Type': 'application/json', 'Content-Length': body.length});
  res.end(body);
});

httpserver.listen(8000);
io = io.listen(httpserver);

io.sockets.on('connection', function (socket){
  var handler = {};
  var callback = {};
  var clients = {};
  var sessionid;
  
  socket.on('client-message', function (message) {
  console.log(message);
  if(message.hasOwnProperty("register") && message.register && message.address)
  {
    //this is a register message, associate the address with session id
    sessionid = socket.id;
    clients[message.address] = sessionid;
    console.log(clients[message.address]);     
  }
  // check message destination
  if(message.hasOwnProperty("to") && (message.to))
  {
    //check if a session with destination has been stored 
    if(clients[message.to])
    {
      sessiontid = clients[message.to];
      io.sockets.socket(sessiontid).send(message);
    }   
    else
    {
      // can not reach destination - does this mean that we give up?
      console.log("no session had been established with destination");
    } 
  }
  if(message.hasOwnProperty("resp_to") && (message.resp_to))
  {
    // this should be called after a callback has been executed 
    // TODO: should deal differently but... 
     
    if(clients[message.resp_to])
    {
      sessiontid = clients[message.resp_to];
      io.sockets.socket(sessiontid).send(message);
    }   
    else
    {
      // can not reach destination - does this mean that we give up?
      console.log("no session had been established with response destination");
    }
  }
  else  //handle message on this server
  {
    if(message.type == "JSONRPC")
    {
      if (typeof handler == 'function'){
        //add callbacks to the queue          
        chain.on('add', function(name) {
        console.log(name, "has been queued.");   
      })

      chain.on('starting', function(name) {
        console.log(name, "has started running.");
      })

      chain.on('finished', function(err, name) {
        console.log(name, "has finished.  Error:", err);
      })   
      chain.add(handler, 'rpc-handler', callback);
    }
    else
    {
      // what other message type are we exepcting?
    }
  }
}
   
  });
});


