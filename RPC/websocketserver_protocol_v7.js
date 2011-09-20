var WEBSOCKET_SERVER_PORT = 8080;
var WEBSERVER_PORT = 80; //Ports <1024 require sudo on linux/osx for the node script to start which is not advised

//Requires
var WebSocketServer = require('websocket07').server;
var http = require("http"),  
url = require("url"),  
path = require("path"),
rpc = require("./rpc.js"),
fs = require("fs");  

//Static resources
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
}).listen(WEBSERVER_PORT,function(){
	console.log((new Date()) + " Web Server is listening on port "+WEBSERVER_PORT);
	});

//WebSocket initialization
var httpserver = http.createServer(function(request, response) {
    console.log((new Date()) + " Received request for " + request.url);
    response.writeHead(404);
    response.end();
});
httpserver.listen(WEBSOCKET_SERVER_PORT, function() {
    console.log((new Date()) + " WebSocket Server is listening on port "+WEBSOCKET_SERVER_PORT);
});

var wsServer = new WebSocketServer({
    httpServer: httpserver,
    autoAcceptConnections: true
});

wsServer.on('connect', function(connection) {
    console.log((new Date()) + " Connection accepted.");
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
        	rpc.handleMessage(message.utf8Data);
        }
        else {
            console.log("Received Message of type" + message.type + ", which dont know how to handle.");
        }
    });
    connection.on('close', function(connection) {
        console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
    });
});


//RPC writer
function write(text){
	wsServer.broadcastUTF(text);
}
//set writer for RPC module
rpc.setWriter(write);