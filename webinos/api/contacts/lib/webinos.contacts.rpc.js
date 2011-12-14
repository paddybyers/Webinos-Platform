/*******************************************************************************
 * Copyright 2011 Istituto Superiore Mario Boella (ISMB)
 *  
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *  
 *     http://www.apache.org/licenses/LICENSE-2.0
 *  
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/

var path = require('path');
var moduleRoot = require(path.resolve(__dirname, '../dependencies.json'));
var dependencies = require(path.resolve(__dirname, '../' + moduleRoot.root.location + '/dependencies.json'));
var webinosRoot = path.resolve(__dirname, '../' + moduleRoot.root.location);

//console.log("DBG moduleRoot",moduleRoot)
//console.log("DBG webinosRoot",webinosRoot)
//var rpc = require(path.join(webinosRoot, dependencies.rpc.location));

//console.log("RPC",rpc);
//In order to work also on anode, require paths should look like these:
////var root = "../" + localDependencies.root.location;
//var webinosRoot = process.env.WEBINOS_PATH;//"../" + localDependencies.root.location;
//console.log("DEBUG webinosRoot = \n",webinosRoot);
//var moduleRoot=webinosRoot+'/api/contacts';
//console.log("DEBUG: moduleRoot = \n",moduleRoot);

//var localDependencies = require(moduleRoot +'/dependencies.json');
//var dependencies = require(webinosRoot + "/dependencies.json");
////console.log("DEBUG\n",localDependencies,dependencies);

if (typeof webinos === "undefined") {
	var webinos = {};
}
if (!webinos.contacts) {
	webinos.contacts = {};
}
//webinos.rpc = require(path.join(webinosRoot, dependencies.rpc.location) + 'lib/rpc.js');
//console.log("DEBUG\n",webinos.rpc)

/**
 * Webinos Service constructor.
 * @param rpcHandler A handler for functions that use RPC to deliver their result.  
 */
var Contacts = function(rpcHandler) {
	// inherit from RPCWebinosService
	this.base = RPCWebinosService;
	this.base({
		api: 'http://www.w3.org/ns/api-perms/contacts',
		displayName: 'Contacts',
		description: 'W3C Contacts Module'
	});
};

Contacts.prototype = new RPCWebinosService;


//if (typeof webinos === 'undefined')
//  var webinos = {};
//rpcfilePath = '../webinos/common/rpc/lib/'; //TODO change
//webinos.rpc = require(rpcfilePath +'rpc.js');

//require.paths.unshift(__dirname +"/contacts_module");
//var contacts_module = require("contacts_module");

//console.log("DBG ***",path.resolve(__dirname,'contacts_module.js'))
var contacts_module = require(path.resolve(__dirname,'contacts_module.js')); //TODO change


//console.log("in rpc_contacts.js ...")

// Contacts specific errors TODO for some reason not working
//var ContactError = function() {
//  // TODO implement constructor logic if needed!
//
//  // TODO initialize attributes
//
//  this.code = Number;
//};
//
//// An unknown error occurred.
//ContactError.prototype.UNKNOWN_ERROR = 0;
//
//// An invalid parameter was provided when the requested method was invoked
//ContactError.prototype.INVALID_ARGUMENT_ERROR = 1;
//
//// The requested method timed out before it could be completed
//ContactError.prototype.TIMEOUT_ERROR = 2;
//
//// There is already a task in the device task source
//ContactError.prototype.PENDING_OPERATION_ERROR = 3;
//
//// An error occurred in communication with the underlying implementation that
//// meant the requested method could not complete
//ContactError.prototype.IO_ERROR = 4;
//
//// The requested method is not supported by the current implementation
//ContactError.prototype.NOT_SUPPORTED_ERROR = 5;
//
//// Access to the requested information was denied by the implementation or by
//// the user
//ContactError.prototype.PERMISSION_DENIED_ERROR = 20;
//
//// An error code assigned by an implementation when an error has occurred in
//// Contacts API processing. No exceptions
//ContactError.prototype.code = Number;

// Contacts Object Registration
//var Contacts = new RPCWebinosService({
//  api:'http://www.w3.org/ns/api-perms/contacts',
//  displayName:'Contacts',
//  description:'W3C Contacts Module'
//});

/**
 * returns true if contacts service is already authenticated with GMail or a
 * valid address book file is aready open TODO this method has to be removed
 * when user profile will handle this
 */
Contacts.prototype.authenticate = function (params, successCB, errorCB, objectRef)
{
  "use strict";
  contacts_module.authenticate(params,successCB);
}

/**
 * returns true if contacts service is already authenticated with GMail or a
 * valid address book file is aready open TODO this method has to be removed
 * when user profile will handle this
 */
Contacts.prototype.isAlreadyAuthenticated = function (params, successCB, errorCB, objectRef)
{
  "use strict";
  contacts_module.isAlreadyAuthenticated(params,successCB);
}

/**
 * returns a list of all contact TODO remove once debugging and testing are
 * successfull
 */
Contacts.prototype.getAllContacts = function (params, successCB, errorCB, objectRef)
{
  "use strict";
  contacts_module.getAllContacts(params,successCB);
}

/**
 * TODO full W3C Spec
 */
Contacts.prototype.find = function (params, successCB, errorCB, objectRef)
{
  "use strict";
  //TODO should type be handled by this module?
  contacts_module.find(params[0]['type'],params[0]['fields'],successCB,errorCB,objectRef);
  //contacts_module.findContacts(params,successCB);
  //contacts_module.find(params,successCB); //TODO use contacts_module.find() directly once switching remote/local contacts happens in a different way
}

//www.w3.org/ns/api-perms/

exports.Service = Contacts;

//Contacts.prototype.authenticate = authenticate;
//Contacts.prototype.isAlreadyAuthenticated = isAlreadyAuthenticated;
//Contacts.prototype.getAllContacts = getAllContacts;
//Contacts.prototype.find = find;

//console.log("Registering Contacts module")

//webinos.rpc.registerObject(Contacts); // RPC name for
// the service:
// Contacts
