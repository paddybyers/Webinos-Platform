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

#ifndef NODE_CONTACTS_GMAIL_H
#define NODE_CONTACTS_GMAIL_H

/**
  TODO put copyright headers here
*/
#include <v8.h>
#include <node.h>
#include <string>

#include "gAddressBook.h"

/**
  @brief This class is a native C++ Node.js extension for reading mork addressbook (Thunderbird)
  It is a v8/node wrapper around MorkAddressBook class;
*/
class CRemoteContacts : node::ObjectWrap {
  private:
    ///The remote address book
    GCalAddressBook *gab;
    
    ///True if autenthication was performed
    bool is_logged_in;
  public:
    ///class constructor
    CRemoteContacts();

    ///class destructor
    ~CRemoteContacts();

    // Holds our constructor function
    static v8::Persistent<v8::FunctionTemplate> persistent_function_template;

    // @Node.js calls Init() when you load the extension through require()
    // Init() defines our constructor function and prototype methods
    // It then binds our constructor function as a property of the target object
    // Target is the "target" onto which an extension is loaded. For example:
    // var notify = require("<path>/remoteAddressBook.node"); will bind our constructor function to notify.Notification
    // so that we can call "new notify.Notification();"
    static void Init(v8::Handle<v8::Object> target) ;

    // new CRemoteContacts();
    // This is our constructor function. It instantiate a C++ GCalAddressBook object and returns a Javascript handle to this object.
    static v8::Handle<v8::Value> New(const v8::Arguments& args);

    //remotecontacts.open();
    // This is a method part of the constructor function's prototype
    static v8::Handle<v8::Value> _LogIn(const v8::Arguments& args) ;
    
    //remotecontacts.isLoggedIn();
    // This is a method part of the constructor function's prototype
    static v8::Handle<v8::Value> _isLoggedIn(const v8::Arguments& args) ;
    
    //remotecontacts.getContacts();
    // This is a method part of the constructor function's prototype
    static v8::Handle<v8::Value> _getContacts(const v8::Arguments& args) ;
    
};




#endif //NODE_CONTACTS_GMAIL_H
