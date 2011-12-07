// webserver.js
// simple webserver that serves the contents of the www/ directory
// based on nodebeginner.org project
// author: Victor Klos & Eelco Cramer
var http = require('http');
var server = http.createServer(handler);
var url = require("url");
var path = require("path");
var fs = require("fs");
var logger = require('nlogger').logger('webserver.js');
var io = require('socket.io').listen(server);

var rpcServer = require("./RpcServer.js");

function handler(request, response) {
	logger.trace("Entering request callback");
    var pathname = url.parse(request.url).pathname;

    logger.debug("Received request for " + pathname);

    // simulate a fully configured web server
    if (pathname == "/") pathname = "index.html";
    
    // return the web socket port number when requested
    //var m = pathname.match(/^\/wss_bootstrap.json&callback=(.*)/); 
		//     if (pathname.match(/^\/wss_bootstrap.json/)) {
		// response.writeHead(200, {"Content-Type": "application/json"});
		// response.write("{\"wss_port\": \"" + wss_port + "\"}");
		// logger.info("200 OK generated " + pathname + " using wss_port=" + wss_port);
		//     	response.end();
		//     	logger.trace("Leaving request callback");
		//     	return;
		//     }

    // determine file to serve
    var filename = path.join("www/" + pathname);
    
    // the rpc stuff is not in the www tree, so get around that
    filename = filename.replace(/^www\/rpc\//, "../../rpc/lib/");
    
    // now serve the file
    fs.readFile(filename, function (err, data) {
    	if (err) {
    		// Can't read file. This is not an error or warning
    		logger.debug("Can't read " + filename + " due to " + err);
    		
    		// create error response
    		response.writeHead(404, {"Content-Type": "text/plain"});
    		response.write("Error " + err + " when serving " + pathname);
    		logger.info("404 NOT FOUND for " + filename);
    	} else {
    		response.writeHead(200, {"Content-Type": mimeType(filename)});
    		response.write(data);
    		logger.info("200 OK for " + filename);
    	}
    	response.end();
    	logger.trace("Leaving request callback");
    });
}

function start(ws_port, rpc_port) {
	logger.trace("Entering start()");
	logger.debug("Creating web server on port " + ws_port);
	
	server.listen(ws_port);
	
//	io.enable('browser client minification');  // send minified client
//	io.enable('browser client etag');          // apply etag caching logic based on version number
	io.set('log level', 1);                    // reduce logging
	io.set('transports', [                     // enable all transports (optional if you want flashsocket)
	    'websocket'
	  , 'flashsocket'
	  , 'htmlfile'
	  , 'xhr-polling'
	  , 'jsonp-polling'
	]);
	
	logger.info("Webserver listening on port " + ws_port);
	
	// configure the RPC server
	rpcServer.configure(io);
	
	logger.trace("Leaving start()");
}

exports.start = start;
exports.io = io;

var mimeTypes = [];
mimeTypes[".png"]  = "image/png";
mimeTypes[".gif"]  = "image/gif";
mimeTypes[".htm"]  = "text/html";
mimeTypes[".html"] = "text/html";
mimeTypes[".txt"]  = "text/plain";
mimeTypes[".png"]  = "image/png";
mimeTypes[".js"]   = "application/x-javascript";
mimeTypes[".css"]  = "text/css";

function mimeType(file) {
	logger.trace("Entering mimeType function");
	var ext = path.extname(file);
	var type = mimeTypes[ext] || "text/plain";
	logger.debug("Determined mime type of ext " + ext + " to be " + type)
	logger.trace("Leaving mimeType function");
}
