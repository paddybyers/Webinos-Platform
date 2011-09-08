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

Files:
1. callflow.txt - an example callflow from the xmppdemo.
2. pzpxmpp.js - the test client.
3. service.js - not used yet. Services should probably not be a part of the xmpp client and the client should be service agnostic.
4. xmpp.js - has all the code to handle the xmpp stuff.

Installation prerequests:

1. Node.js ;-)
2. Node Xmpp - see installation instructions on: https://github.com/astro/node-xmpp
3. Node hashlib:

a) Download from: https://github.com/brainfucker/hashlib
b) execute 'node-waf configure build'
c) copy module from './build/default/hashlib.node' to '<pzpxmpp-home>/libs'

Instructions:

1. Start the client.

node pzpxmpp.js <jid> <password>

2. To see if things are working. Connect with another XMPP client (for example PSI) to the same server with the same JID.

When used PSI you can open the XMPP log and here you can see PSI discovering the pzpxmpp client and visa versa.

