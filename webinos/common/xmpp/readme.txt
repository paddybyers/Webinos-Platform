Author: Eelco Cramer, TNO

This is the prototype of a XMPP libary that can connect the PZP to the PZH and in the future
maybe connect different PZPs as well.

The code is based upon the code of the XMPP demo built by Victor Klos (TNO) which can be found at
http://www.servicelab.org/xmppdemo/ but has a few differences. One is the way disco is implemented.
In de xmppdemo the client does not query unknown hashtables. The current version of this client always
queries hashtables (it has no cache at the moment).

Disco is the only working feature at the moment. Next thing is find how discovered services are propagated
to the requred code that is using the client and build in service execution.

No xmpp server is configured in the client. The service is determined by the domain part of the jid. First the
client tries to get the domains DNS SRV record or if it does not exsists tries to connect to the domain directly. This
is all part of the node-xmpp lib. 

The client uses TLS to connect to the xmpp server when available.

The client uses the node.js EventEmitter to fire events. The test client can add listeners to the event emitter to be
notified about new features being discovered etc.

Files:
1. callflow.txt - an example callflow from the xmppdemo.
2. pzpxmpp.js - the test client.
3. xmpp.js - has all the code to handle the xmpp stuff.
4. GenericFeature.js - the generic feature class.
5. GeolocationFeature.js - the geolocation feature class.
6. RemoteAlertFeature.js - the remote alert feature class.
7. WebinosFeatures.js - Factory class for features. Imports all the features and has all the namespaces. Just import this class
                        if you want to do stuff with features.

Installation prerequests:

1. Node.js ;-)

2. LibExpat:

On Ubuntu / Debian: apt-get install libexpat1

3. Node-Xmpp: https://github.com/astro/node-xmpp#readme

npm install node-xmpp

4. node-stringprep (optional): https://github.com/astro/node-stringprep#readme

5. ltx: npm install ltx

6. socket.io: npm install socket.io

Instructions:

1. Start the client.

node pzp.js <index> <jid> <password>

For example:

"node pzp.js 0 w021@servicelab.org/mobile webinos" starts the PZP on port 8000.
"node pzp.js 1 w021@servicelab.org/tv webinos" starts the PZP on port 8010.

2. To see if things are working. Start a second client for the same jid (other resource). You can now see the client discovering
the features of the other instance and vice versa.

If you share, unshare or invoke a feature using the browser you can see the corresponding RPC and XMPP calls in the logging of the PZP.

TODOs:

1. Correctly implement private methods as private.
2. Think through how to pass queries and results back and forth between the xmpp connection and the webinos code.



