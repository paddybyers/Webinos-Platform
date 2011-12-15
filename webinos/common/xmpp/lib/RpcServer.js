/**
 * RPC server. Binds socket.io to the Webinos RPC scripts.
 * 
 * Author: Eelco Cramer, TNO
 */

var http = require("http");
var url = require("url");
var path = require("path");
var fs = require("fs");
var logger = require('nlogger').logger('RpcServer.js');
var io;

//RPC server initialization
function configure(server, rpcHandler) {
	io = server;
	
	io.of('/jsonrpc').on('connection', function(socket) {
	    logger.trace((new Date()) + " Connection accepted.");

	    socket.on('message', function(message) {
			msg = JSON.parse(message);
			logger.trace('calling rpc with message(' +  msg + ')');
			logger.trace('message.method=' + msg.method);
	        rpcHandler.handleMessage(msg, this, Math.round(Math.random() * 10000));
			logger.trace('rpc called.');
	    });
		
		socket.on('disconnect', function () {
	    	logger.debug('user disconnected');
	  	});

		//RPC writer for this connection
		function writer(result, respto, msgid)	{
			logger.trace('result(' + result + ')');
			socket.send(JSON.stringify(result));
			logger.trace('end result();')
		}
		
		rpcHandler.setWriter(writer);
	});
}

exports.configure = configure;