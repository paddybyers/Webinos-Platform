var sys = require("sys");
// Library https://github.com/miksago/node-websocket-server
var websocket = require('websocket-server');
var fileprovider = require('./fileprovider.js');

webinos = {};
webinos.rpc = {};

function logObj(obj, name){
	for (var myKey in obj){
		console.log(name + "["+myKey +"] = "+obj[myKey]);
		if (typeof obj[myKey] == 'object') logObj(obj[myKey], myKey);
	}
}

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
		var myObject = JSON.parse(message);
		logObj(myObject, "rpc");
		
		//received message is RPC request
		if (typeof myObject.method !== 'undefined' && myObject.method != null) {
			if (typeof myObject.service !== 'undefined'){
				console.log("Got message: " + myObject.method + " " + myObject.params[0] );
			
				if (typeof webinos.rpc.objects[myObject.service] === 'object'){
					id = myObject.id;
					
					if (typeof myObject.fromObjectRef !== 'undefined' && myObject.fromObjectRef != null) {
						webinos.rpc.objects[myObject.service][myObject.method](
							myObject.params, 
							function (result) {
								var res = {};
								rpc.jsonrpc = "2.0";
								res.result = result;
								res.error = null;
								res.id = id;
								webinos.rpc.executeRPC(res);
							},
							function (error){
								var res = {};
								rpc.jsonrpc = "2.0";
								res.error = error;
								res.result = null;
								res.id = id;
								webinos.rpc.executeRPC(res);
							}, 
							myObject.fromObjectRef
						);
					}
					else {
						webinos.rpc.objects[myObject.service][myObject.method](
							myObject.params, 
							function (result) {
								var res = {};
								res.result = result;
								res.error = null;
								res.id = id;
								webinos.rpc.executeRPC(res);
							},
							function (error){
								var res = {};
								res.error = error;
								res.result = null;
								res.id = id;
								webinos.rpc.executeRPC(res);
							}
						);
					}
				}
			}
		}
		else {
			//if no id is provided we cannot invoke a callback
			if (typeof myObject.id === 'undefined' || myObject.id == null) return;
				
			//invoking linked error / success callback
			if (webinos.rpc.awaitingResponse[myObject.id] !== 'undefined'){
				if (webinos.rpc.awaitingResponse[myObject.id] != null){
					
					if (webinos.rpc.awaitingResponse[myObject.id].onResult !== 'undefined' && myObject.error == null){
						webinos.rpc.awaitingResponse[myObject.id].onResult(myObject.result);
					}
						
					if (webinos.rpc.awaitingResponse[myObject.id].onError !== 'undefined' && myObject.error != null){
						webinos.rpc.awaitingResponse[myObject.id].onError(myObject.error);
					}
						
					webinos.rpc.awaitingResponse[myObject.id] == null;
				}
			}
		}
	});
});


webinos.rpc.awaitingResponse = {};
webinos.rpc.objects = {};
/**
 * Executes the givin RPC Request and registers an optional callback that
 * is invoked if an RPC responce with same id was received
 */
webinos.rpc.executeRPC = function (rpc, callback, error) {
    if (typeof callback === 'function' && typeof rpc.id !== 'undefined' && rpc.id != null){
		cb = {};
		cb.onResult = callback;
		if (typeof error === 'funtion') cb.onError = error;
		webinos.rpc.awaitingResponse[rpc.id] = cb;
		return;
	}
    
    server.manager.forEach(function(connected_client) {
    	connected_client.write(JSON.stringify(rpc));
    });
}

/**
 * Creates a JSON RPC 2.0 compliant object
 * @param service The service Identifier (e.g., the file reader or the
 * 	      camera service) as string or an object reference as number
 * @param method The method that should be invoked on the service
 * @param an optional array of parameters to be used
 * @param an optional ID that can be used to map incomming RPC responses
 * 		  to requests
 */
webinos.rpc.createRPC = function (service, method, params, id) {
	
	if (typeof service === 'undefined') throw "Service is undefined";
	if (typeof method === 'undefined') throw "Method is undefined";
	
	var rpc = {};
	rpc.jsonrpc = "2.0";
	rpc.service = service;
	rpc.method = method;
	
	if (typeof params === 'undefined') rpc.params = [];
	else rpc.params = params;
	
	if (typeof id !== 'undefined') rpc.id = id;
	else rpc.id = Math.floor(Math.random()*101);
	
	return rpc;
}


/**
 * 
 * 
 */
webinos.rpc.registerObject = function (ref, callback) {
	if (typeof callback !== 'undefined' && typeof ref !== 'undefined' && ref != null){
		console.log("Adding handler: " + ref);	
		webinos.rpc.objects[ref] = callback;
	}
}

/**
 * 
 * 
 */
webinos.rpc.unregisterObject = function (ref) {
	if (typeof ref !== 'undefined' && ref != null){
		console.log("Adding handler: " + ref);	
		delete webinos.rpc.objects[ref];
	}
}

exports.executeRPC = webinos.rpc.executeRPC;
exports.createRPC = webinos.rpc.createRPC;
exports.registerObject = webinos.rpc.registerObject;
exports.unregisterObject = webinos.rpc.unregisterObject ;

//add your RPC Implementations here!
var rpc_file = require('./rpc_file.js');



