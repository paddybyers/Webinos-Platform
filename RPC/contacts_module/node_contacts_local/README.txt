October 11th, 2011

Node.js Extension Module to access contacts stored on the local machine (currently, from Mozilla Thunderbird address book).

DESCRIPTION:

This Node.js module provides access to a mork format based address book, i.e. the format used by Mozilla Thunderbird mail client, using native C++ libraries.
Mork address book files usually have .mab extension (see http://en.wikipedia.org/wiki/Mork_(file_format) ) and under Linux systems are usually located under $HOME/.thunderbird/<some_hash_code>.default/ folder. There are usually 2 default address books in Thunderbird: abook.mab and history.mab, the latter being used to store contacts retrieved automatically from received emails.

The Mork parser library is provided inside the package (from http://www.scalingweb.com/mork_parser.php) and its license in src/License_MorkParser.txt. It should cover only the MorkParser.h and MrkParser.cpp files.
Guideline for binding C++ classes from https://www.cloudkick.com/blog/2010/aug/23/writing-nodejs-native-extensions/ and http://syskall.com/how-to-write-your-own-native-nodejs-extension.

INSTRUCTIONS:

To build the node:

  node-waf configure build install

The extension will be build OUTSIDE the source three, in a directory called node_contacts_local.build one level above. There you will find a local_contacts.js which interfaces the localcontacts.node C++ module.

C++ extension module source files are under the src/ folder.

standaloneCpp/ folder provides a standalone C++ test and debug program for the basic C++ classes with a CMake file to compile it (it should cross-compile). Better use CMake GUI to make this task easier.

standaloneJS/ folder provides a test.js file to test the C++ wrappers and binding. To run it, once the extension module has been compiled:

  cd standaloneJS
  node test.js
