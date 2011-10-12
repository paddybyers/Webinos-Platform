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

if (typeof webinos === 'undefined')
  var webinos = {};
webinos.rpc = require('./rpc.js');

require.paths.unshift("./contacts_module");
var contacts_module = require("contacts_module");

// Contacts specific errors TODO for some reason not working
var ContactError = function() {
  // TODO implement constructor logic if needed!

  // TODO initialize attributes

  this.code = Number;
};

// An unknown error occurred.
ContactError.prototype.UNKNOWN_ERROR = 0;

// An invalid parameter was provided when the requested method was invoked
ContactError.prototype.INVALID_ARGUMENT_ERROR = 1;

// The requested method timed out before it could be completed
ContactError.prototype.TIMEOUT_ERROR = 2;

// There is already a task in the device task source
ContactError.prototype.PENDING_OPERATION_ERROR = 3;

// An error occurred in communication with the underlying implementation that
// meant the requested method could not complete
ContactError.prototype.IO_ERROR = 4;

// The requested method is not supported by the current implementation
ContactError.prototype.NOT_SUPPORTED_ERROR = 5;

// Access to the requested information was denied by the implementation or by
// the user
ContactError.prototype.PERMISSION_DENIED_ERROR = 20;

// An error code assigned by an implementation when an error has occurred in
// Contacts API processing. No exceptions
ContactError.prototype.code = Number;

// Contacts Object Registration
var Contacts = new RPCWebinosService({
  api:'http://www.w3.org/ns/api-perms/contacts',
  displayName:'Contacts',
  description:'W3C Contacts Module'
});

// Instantiation of local and remote contacts modules
Contacts.LocalContacts = new contacts_module.local.contacts();
Contacts.RemoteContacts = new contacts_module.remote.contacts();

/*
 * TODO expose only following functions:
 * 
 * bool authenticate(params) params is (remote/local flag + func_params = usr,
 * pwd if remote, addressBook name if local (open a file selection form in
 * client please!) bool isAuthenticated(params) - no W3C but but find() - W3C
 */

/**
 * returns true if contacts service is already authenticated with GMail or a
 * valid address book file is aready open TODO this method has to be removed
 * when user profile will handle this
 */
function authenticate(params, successCB, errorCB, objectRef)
{
  if (params)
  {
    if (params[0]['type'] == "local")
    {
      successCB(Contacts.LocalContacts.open(params[0]['addressBookName']));
    } else if (params[0]['type'] == "remote")
    {
      successCB(Contacts.RemoteContacts.logIn(params[0]['usr'],
        params[0]['pwd']));
    }
  }
}

/**
 * returns true if contacts service is already authenticated with GMail or a
 * valid address book file is aready open TODO this method has to be removed
 * when user profile will handle this
 */
function isAlreadyAuthenticated(params, successCB, errorCB, objectRef)
{
  if (params)
  {
    if (params[0]['type'] == "local")
    {
      successCB(Contacts.LocalContacts.isOpen());
    } else if (params[0]['type'] == "remote")
    {
      successCB(Contacts.RemoteContacts.isLoggedIn());
    }
  }
}

/**
 * returns a list of all contact TODO remove once debugging and testing are
 * successfull
 */
function getAllContacts(params, successCB, errorCB, objectRef)
{
  if (params)
  {
    if (params[0]['type'] == "local")
    {
      successCB(Contacts.LocalContacts.getAB());
    } else if (params[0]['type'] == "remote")
    {
      successCB(Contacts.RemoteContacts.getContacts());
    }
  }
}

/**
 * TODO W3C Spec
 */
function find(params, successCB, errorCB, objectRef)
{
  console.log("Not implemented yet");
}

//www.w3.org/ns/api-perms/



Contacts.authenticate = authenticate;
Contacts.isAlreadyAuthenticated = isAlreadyAuthenticated;
Contacts.getAllContacts = getAllContacts;

Contacts.find = find;

console.log("Registering Contacts module")

webinos.rpc.registerObject(Contacts); // RPC name for
// the service:
// Contacts
