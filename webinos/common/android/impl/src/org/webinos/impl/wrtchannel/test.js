var wrtchannel = require('bridge').load('org.webinos.impl.wrtchannel.WebinosSocketServerImpl', this);

wrtchannel.listener = function(socket) {
  socket.listener = {
    onClose: function(reason) {console.log('onClose(): ' + reason);},
    onError: function(reason) {console.log('onError(): ' + reason);},
    onMessage: function(ev) {
      console.log('onMessage(): ' + ev.data);
      socket.send(ev.data);
    }
  };
}

