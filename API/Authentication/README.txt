Authentication APIs


Files list:

- rpc_auth.js
The code about authentication.

- old_securestore.js
An old version of the John's secure store code.
The newer version can't be used because it requires node.js version 0.4.

-tools/secstore_open.js
-tools/secstore_close.js
Node.js scripts to manually open and close encrypted auth.zip file. They require old_securestore.js.
Tho open command reads auth.zip and creates an authentication directory containing the password.txt and the authstatus.txt files.
The close command creates the auth.zip file and removes authetication directory and contained files.

- test_auth/auth.js
The client side script to execute the test.

- test_auth/test_auth.html
The html page to use to execute the test.
The page shows the Find Service button, three buttons for authentication APIs (authenticate, isAuthenticated and getAuthenticationStatus) and an input box where to insert the username.

- test_auth/auth.zip
The encrypted file containing password.txt and authstatus.txt file.
This file has been created to use the securestore module.
password.txt contains usernames and passwords.
authstatus.txt contains data about authenticated users.



How to run the test:

1) Put in the root RPC directory the following files: rpc_auth.js, old_securestore.js, auth.zip.

2) Add to rpc.js (located in the RPC root directory) the line:
require('./rpc_auth.js');

3) Put in the client directory auth.js and test_auth.html

4) Add to webinos.js (located in the client directory) the following lines:
if (type == "AuthenticationAPIs"){
	var tmp = new authenticationAPIsModule();
	tmp.origin = 'ws://127.0.0.1:8080';
	webinos.ServiceDiscovery.registeredServices++;
	callback.onFound(tmp);
	return;
}

5) execute the server
# node websocketserver.js

6) using chrome (or another websocket supporting browser) connect to the server and open the client page.
e.g:
$ goocle-chrome http://localhost/client/test_auth.html

7) click on Find Services

8) insert a username into the insert box

9) test APIs
