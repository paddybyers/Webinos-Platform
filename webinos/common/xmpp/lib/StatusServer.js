/**
 * StatusServer.js
 * handles the connection status service
 * author: Eelco Cramer (TNO)
 */

var sys = require('util');
var logger = require('nlogger').logger('StatusServer.js');

var connection;

var io;

//TODO retrieve jid from pzhConnection
function start(socketIO, pzhConnection, jid) {
	logger.trace("Entering start()");

	io = socketIO;
	connection = pzhConnection;
	
	io.of('/bootstrap').on('connection', function(socket) {
		logger.trace("New connection.");
		//TODO add boolean for connected status to XMPP server
		socket.emit('status', { 'device': jid, 'owner': jid.split("/")[0]});
	});
	
	//TODO add connection listener to update status if pzh connection is disconnected
	
	logger.trace("Leaving start()");
}

exports.start = start;
