
16 Sep 2011

The initial commit contains the Payment API code for the client
side (creating the RPC requests) and for the server side.

There's also a test page named client.html to test the basic functions.

The server code needs to be put in the directory with the 
'node.exe', 'rpc.js' and 'websocketserver.js' to be integrated 
into the server - it's currently just in a separate directory to
create a more convenient structure.

If added to a central node server, this needs to be added to rpc.js:
require('./rpc_payment.js');

To be able to build the communication from the client side,
the following lines need to be added to webinos.js to enable
discovery of the Payment service.

                if (type == "Payment"){
                        var tmp = new PaymentModule();
                        tmp.origin = 'ws://127.0.0.1:8080';
                        webinos.ServiceDiscovery.registeredServices++;
                        callback.onFound(tmp);
                        return;
                }

Currently the code only covers client-server communication, but
has no connection to any real payment server. 
So Shopping baskets get created and can be handled and filled,
but nothing real happens on checkout until we get some real
payment provider at the backend.

Also, at the moment there's basically no error handling - it's
just the initial version implemented in Oxford to achieve basic
functionality - not a solid version yet.
