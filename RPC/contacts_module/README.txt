October 11th, 2011

To satisfy all dependencies, please have a look to each module README file

Instructions to compile natvive contacts modules:

  cd node_local_module
  node-waf configure
  node-waf build

After a successful build, a node_local_module.build folder will be created within in the contacts_module folder, containing localcontacts.node (shared library) in node_local_module.build/default

  cd node_remote_module
  node-waf configure
  node-waf build

After a successful build, a node_remote_module.build folder will be created within in the contacts_module folder, containing remotecontacts.node (shared library) in node_local_module.build/default

contacts_module.js
is the module name that has to be included from RPC/rpc_contacts.js in order to access all the C++ classes corresponding calls. It just exposes the C++ libraries functions to the upper levels.

To thest contacts_module is working with Node.js, just type:
  node test_contacts_module_standalone.js

The rpc_contacts.js module implements or will implement the W3C API interfaces.
