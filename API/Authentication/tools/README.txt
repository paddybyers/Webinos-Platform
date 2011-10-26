secstore_open.js and secstore_close.js are node.js scripts to manually open and close encrypted auth.zip file. They require securestore.js.
Tho open command reads auth.zip and creates an authentication directory containing the password.txt and the authstatus.txt files.
The close command creates the auth.zip file and removes authetication directory and contained files.
