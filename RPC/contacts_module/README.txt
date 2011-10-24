October 11th, 2011

To satisfy all dependencies, please have a look to each module README file

Instructions to compile natvive contacts modules:

  cd node_contacts_local
  node-waf configure
  node-waf build

After a successful build, a "build" folder will be created within the node_contacts_local folder, containing localcontacts.node (shared library) in build/default

  cd node_contacts_remote
  node-waf configure
  node-waf build

After a successful build, a "build" folder will be created within the contacts_module folder, containing remotecontacts.node (shared library) in build/default

contacts_module.js
is the module name that has to be included from RPC/rpc_contacts.js in order to access all the C++ classes corresponding calls

To thest contacts_module is working with Node.js, just type:
  node test_contacts_module_standalone.js.
