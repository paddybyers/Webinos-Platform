October 11th, 2011

Node.js Extension Module to access contacts on a remote mail server address book (currently GMail only).

DESCRIPTION:

This Node.js module provides access to a GMail contacts.
You need to provide some valid GMail username and password

It requires libgcal > 0.9 (current version 0.9.6 from http://code.google.com/p/libgcal/)
Guideline for binding C++ classes from https://www.cloudkick.com/blog/2010/aug/23/writing-nodejs-native-extensions/ and http://syskall.com/how-to-write-your-own-native-nodejs-extension.

INSTRUCTIONS:

To build and install the node:

  node-waf configure build

The extension will be built in a directory called "build". 

remote_contacts.js interfaces the remotecontacts.node C++ module which is built into build/default.

C++ extension module source files are under the src/ folder.

test/standaloneCpp/ folder provides a standalone C++ test and debug program for the basic C++ classes with a CMake file to compile it (it should cross-compile). Better use CMake GUI to make this task easier.

test/standaloneJS/ folder provides a test.js file to test the C++ wrappers and binding of this module. To run it, once the extension module has been compiled:

  cd test/standaloneJS
  node test.js

