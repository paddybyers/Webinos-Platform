var io = require('socket.io');
var EventEmitter = require('events').EventEmitter;

/**
 * @name ServerMsgHandler
 * @constructor
 * @description The object returned by require('ServerMsgHandler').
 */

var ServerMsgHandler = function (server, options) 
{
  EventEmitter.apply(this, arguments);
  this.messageCallbacks = {};
  
  this.io = io.listen(server);
}

ServerMsgHandler.prototype.__proto__ = EventEmitter.prototype;

function extend (a, b) {
  for (var k in b) {
    a[k] = b[k];
  }
}

extend(ServerMsgHandler.prototype, {

  // To set up multiple channles, call this function with different namespaces. 
  SetChannel: function(channel, handler)
  {
    var connection = this.io
    .of(this.channel);
    this.io.sockets.on('connection', handler);
  },
  
  onMessage: function(message, RPChandler)
  {
    console.log("message: ", message);
    console.error("define the callback function, for RPC message - define the handler");
  },
 
  sendMessage: function(obj, errorHandler, successHandler)
  {
    if(!obj.hasOwnProperty("id") || (!obj.id)) 
      //create a random messageid for it 
      obj.id =  1 + Math.floor(Math.random() * 12);  

    if( errorHandler || successHandler)
    {
      this.messageCallbacks[obj.id] = {onError: errorHandler, onSuccess: successHandler};
    }

    this.socket.send(obj, this.messageCallbacks[obj.id]);
    return obj;
  },
 
 });

exports.ServerMsgHandler = ServerMsgHandler;

