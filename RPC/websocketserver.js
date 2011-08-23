var sys = require("sys");
// Library https://github.com/miksago/node-websocket-server
var websocket = require('websocket-server');
var fileprovider = require('./fileprovider.js');
var rpc_file = require('./rpc_file.js');

webinos = {};
webinos.rpc = {};
webinos.rpc.registeredFunctions = [];

var http = require("http"),  
url = require("url"),  
path = require("path"),  
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
}).listen(80);  

sys.puts("Server running at http://localhost:80/");  

// create web socket server
var server = websocket.createServer();
// listen on port 8080
server.listen(8080);

// when the server is ready
server.addListener("listening", function() {
	sys.log("Listening for connections on localhost:8080");
});

// when a traditional HTTP request comes
server.addListener("request", function(req, res) {
	res.writeHead(200, {
		"Content-Type" : "text/plain"
	});
	res.write("This is an example WebSocket server.");
	res.end();
});

// when a client websocket connects
server.addListener("connection", function(conn) {

	// when client writes something
	conn.addListener("message", function(message) {

		// iterate thorough all connected clients, and push this message
		server.manager.forEach(function(connected_client) {
			var myObject = JSON.parse(message);
			
			console.log("Got message: " + myObject.method + " " + myObject.params[0] );
			logObj(myObject,"rpc");
			
			if (typeof webinos.rpc.registeredFunctions[myObject.service] === 'function'){
				console.log("is function");
				webinos.rpc.registeredFunctions[myObject.service](myObject, connected_client);
			}
			else
			{
				connected_client.write(JSON.stringify(myObject));	
			}
		});
	});
});

function addHandler(handler){
	for (var myKey in handler){
		if (typeof handler[myKey] == 'function'){
			console.log("Adding handler: " + myKey);
			webinos.rpc.registeredFunctions[myKey] = handler[myKey];
		}
	}
}

function logObj(obj, name){
	for (var myKey in obj){
		console.log(name + "["+myKey +"] = "+obj[myKey]);
		if (typeof obj[myKey] == 'object') logObj(obj[myKey], myKey);
	}
}

/**
 * Add your Handlers here!
 */
addHandler(rpc_file.getRPCHandler());



