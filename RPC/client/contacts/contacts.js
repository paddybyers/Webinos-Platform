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

(function()
{

  Contacts = function(obj) {
    this.base = WebinosService;
    this.base(obj);
    
  };

//  /**
//   * returns true if contacts service is authenticated with GMail using username and password
//   * or a valid address book file could be open
//   * TODO this method has to be removed when user profile will handle this
//   * */
  Contacts.prototype.authenticate = function(attr, successCB)
  {
    var rpc = webinos.rpc.createRPC(this, "authenticate", [ attr ]); // RPCservicename,
    // function
    webinos.rpc.executeRPC(rpc, function(params)
    {
      successCB(params);
    }, function(error)
    {
    });
  };

  /**
   * returns true if contacts service is already authenticated with GMail
   * or a valid address book file is aready open
   * TODO this method has to be removed when user profile will handle this
   * */
  Contacts.prototype.isAlreadyAuthenticated = function(attr,successCB)
  {
    var rpc = webinos.rpc.createRPC(this, "isAlreadyAuthenticated", [ attr ]); // RPCservicename,
    // function
    webinos.rpc.executeRPC(rpc, function(params)
    {
      successCB(params);
    }, function(error)
    {
    });
  };

  /**
   * returns a list of all contact
   * TODO remove once debugging and testing are successfull
   * */
   Contacts.prototype.getAllContacts = function(attr,successCB)
   {
   var rpc = webinos.rpc.createRPC(this, "getAllContacts", [ attr ]); 
   //RPCservicename,
   // function
   webinos.rpc.executeRPC(rpc, function(params)
   {
   successCB(params);
   }, function(error)
   {
   });
   };
  
  


  // TODO implement on back end
//  Contacts.prototype.find = function(successCB)
//  {
//    var rpc = webinos.rpc.createRPC(this, "find", arguments); // RPCservicename,
//    // function
//    webinos.rpc.executeRPC(rpc, function(params)
//    {
//      successCB(params);
//    }, function(error)
//    {
//    });
//  };

}());
