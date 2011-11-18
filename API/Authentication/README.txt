Authentication APIs


Files list:

- rpc_auth.js
The code about authentication.

-tools/secstore_open.js
-tools/secstore_close.js
Node.js scripts to manually open and close encrypted auth.zip file. They require securestore.js.
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


Required modules:

- zipper (https://github.com/rubenv/zipper) and zipfile (https://github.com/springmeyer/node-zipfile), required by securestore

- schema.js (https://github.com/akidee/schema.js), required to validate input files against JSON schema.


How to run the test:

1) Put in the root RPC directory rpc_auth.js and auth.zip.

2) Add to rpc.js (located in the RPC root directory) the element
'./rpc_auth.js'
in the modules list

3) Put in the client directory auth.js and test_auth.html

4) Add to webinos.js (located in the client directory) the following row:
if (typeof AuthenticationModule !== 'undefined') typeMap['http://webinos.org/api/authentication'] = AuthenticationModule;

5) execute the server
# node websocketserver.js

6) using chrome (or another websocket supporting browser) connect to the server and open the client page.
e.g:
$ goocle-chrome http://localhost/client/test_auth.html

7) click on Find Services

8) insert a username into the insert box

9) test APIs
