Authentication APIs


Files list:

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



To run the test put auth.zip in the root RPC directory and put auth.js and test_auth.js in the client directory.
Full test instructions are in the ../README.txt file.
