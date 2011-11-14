var http = require('http'),
    //please don't use the socket.io in RPC dir	
    //io = require('../../../../RPC/node_modules/socket.io'),
    io = require('./node_modules/socket.io'),
    sys = require("sys"),
    url = require("url"),
    path = require("path");
    fs = require("fs");

var ft = require('./bluetooth/build/default/bluetooth.node');

var httpserver = http.createServer(function(request,response)
{
  var uri = url.parse(request.url).pathname;
  var filename = path.join(process.cwd(), uri);
  path.exists(filename, function(exists) 
  {
    if(!exists) 
    {
      response.writeHeader(404, {"Content-Type": "text/plain"});
      response.end("404 Not Found\n");
      return;
    }

    fs.readFile(filename, "binary", function(err, file) 
    {
      if(err) 
      {
    	  response.writeHeader(500, {"Content-Type": "text/plain"});
    	  response.end(err + "\n");
    	  return;
      }

      response.writeHeader(200);
      response.end(file, "binary");
    });
  });
});

httpserver.listen(8000);
io = io.listen(httpserver);

io.sockets.on('connection', function (socket)
{
  socket.on('findservice', function (data) 
  {
    console.log(data);

    n = new ft.bluetooth();
    data = data + '';
    result = n.scan_device(data);
    socket.emit('response', result);
  });

  socket.on('binddevice', function (data) {
	   n = new ft.bluetooth();
	   var result = n.folder_list(data);
	   console.log("folder list:" + result);
	   socket.emit('folder-response', result);
  }); 
  
  socket.on('listfile', function (data) {
	   n = new ft.bluetooth();
	   //lists = n.file_list(data[0], data[1]);
	   //var str1 = "/";
	   //lists = n.file_list(data[0], data[1]);
	   //lists = n.file_list(data[0], str1.concat(data[1]));
	   lists = n.file_list(data[0], data[1]);
	   
	   console.log("lists = " + lists);
	   console.log("send resp back to clients"); 
	   socket.emit("listresp", lists);
  }); 
  
  socket.on('transferfile', function (data) {
   n = new ft.bluetooth();
   n.file_transfer(data[0], data[1], data[2]);
   socket.emit("transfer-rep");
  }); 
	
});
