var sys = require("sys");
// Library https://github.com/miksago/node-websocket-server
var websocket = require('websocket-server');

var http = require("http"),  
url = require("url"),  
path = require("path"),
rpc = require("./rpc.js"),
fs = require("fs");  

http.createServer(function(request, response) {  
var uri = url.parse(request.url).pathname;  
var filename = path.join(process.cwd(), uri);  
path.exists(filename, function(exists) {  
    if(!exists) {  
        response.writeHead(404, {"Content-Type": "text/plain"});  
        response.write("404 Not Found\n");  
        response.end();  
        return;  
    }  

    fs.readFile(filename, "binary", function(err, file) {  
        if(err) {  
            response.writeHead(500, {"Content-Type": "text/plain"});  
            response.write(err + "\n");  
            response.end();  
            return;  
        }  

        response.writeHead(200);  
        response.write(file, "binary");  
        response.end();  
    });  
});  
}).listen(8081);  

sys.log("File Server running at http://localhost:80/");  

var server = websocket.createServer();
server.listen(8080);

server.addListener("listening", function() {
	sys.log("Listening for web socket connections on localhost:8080");
});

// when a traditional HTTP request comes
server.addListener("request", function(req, res) {
	res.writeHead(200, {
		"Content-Type" : "text/plain"
	});
	res.write("This is an example WebSocket server.");
	res.end();
});

function write(text){
	server.manager.forEach(function(connected_client) {
		connected_client.write(text);
	});
}

//set writer for RPC module
rpc.setWriter(write);

// when a client websocket connects
server.addListener("connection", function(conn) {
	// when client writes something
	conn.addListener("message", function(message) {
		rpc.handleMessage(message);
	});
});




