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

#include "node_contacts_gmail.h"

CRemoteContacts::CRemoteContacts() : is_logged_in(false)
{
  gab = new GCalAddressBook();
};

CRemoteContacts::~CRemoteContacts()
{
  if (gab)
    delete gab;
};


// @Node.js calls Init() when you load the extension through require()
// Init() defines our constructor function and prototype methods
// It then binds our constructor function as a property of the target object
// Target is the "target" onto which an extension is loaded. For example:
// var notify = require("../build/default/remotecontacts.node"); will bind our constructor function to notify.Notification
// so that we can call "new remotecontacts.Contacts();"
void CRemoteContacts::Init(v8::Handle<v8::Object> target) 
{
  // We need to declare a V8 scope so that our remote handles are eligible for garbage collection.
  // once the Init() returns.
  v8::HandleScope scope;
  // Wrap our New() method so that it's accessible from Javascript
  v8::Local<v8::FunctionTemplate> remote_function_template = v8::FunctionTemplate::New(New);
  
  // Make it persistent and assign it to our object's persistent_function_template attribute
  CRemoteContacts::persistent_function_template = v8::Persistent<v8::FunctionTemplate>::New(remote_function_template);
  
  // Each JavaScript object keeps a reference to the C++ object for which it is a wrapper with an internal field.
  CRemoteContacts::persistent_function_template->InstanceTemplate()->SetInternalFieldCount(1); // 1 since this is a constructor function
  
  // Set a class name for objects created with our constructor - i.e. the type returned from typeof()
  CRemoteContacts::persistent_function_template->SetClassName(v8::String::NewSymbol("RemoteContacts"));
  
  // Set property ACCESSORS (i.e. for using JS = operator)
  //CRemoteContacts::persistent_function_template->InstanceTemplate()->SetAccessor(String::New("title"), GetTitle, SetTitle);
  //CRemoteContacts::persistent_function_template->InstanceTemplate()->SetAccessor(String::New("icon"), GetIcon, SetIcon);
  
  // @Node.js macro to help bind C++ METHODS to Javascript methods (see https://github.com/joyent/node/blob/v0.2.0/src/node.h#L34)
  // Arguments: our constructor function, Javascript method name, C++ method name
  NODE_SET_PROTOTYPE_METHOD(CRemoteContacts::persistent_function_template, "logIn", _LogIn);
  NODE_SET_PROTOTYPE_METHOD(CRemoteContacts::persistent_function_template, "isLoggedIn", _isLoggedIn);
  NODE_SET_PROTOTYPE_METHOD(CRemoteContacts::persistent_function_template, "getContacts", _getContacts);
  
  // Set the "contacts" property to the target and assign it to our constructor function
  target->Set(v8::String::NewSymbol("contacts"), CRemoteContacts::persistent_function_template->GetFunction());
}

// new RemoteContacts();
// This is our constructor function. It instantiate a C++ CRemoteContacts object and returns a Javascript handle to this object.
 v8::Handle<v8::Value> CRemoteContacts::New(const v8::Arguments& args) {
  v8::HandleScope scope;
  CRemoteContacts* remoteContacts_instance = new CRemoteContacts();
  // Set some default values
//  remoteContacts_instance->title = "Node.js";
//  remoteContacts_instance->icon = "terminal";
  
  // Wrap our C++ object as a Javascript object
  remoteContacts_instance->Wrap(args.This());
  
  
  // Our constructor function returns a Javascript object which is a wrapper for our C++ object, 
  // This is the expected behavior when calling a constructor function with the new operator in Javascript.
  return args.This();
}

// remotecontacts.logIn(username,password);
// This is a method part of the constructor function's prototype
v8::Handle<v8::Value> CRemoteContacts::_LogIn(const v8::Arguments& args) 
{
  v8::HandleScope scope;
  
  if (args.Length()<2) //TODO raise exception - user must supply username and password
    return v8::Boolean::New(false);
  else
  {
    // Extract C++ object reference from "this" aka args.This() argument
    CRemoteContacts* remoteContacts_instance = node::ObjectWrap::Unwrap<CRemoteContacts>(args.This());
    
    // Convert first argument to V8 String
    v8::String::Utf8Value user(args[0]);
    v8::String::Utf8Value pasw(args[1]);
    
    //TODO raise exception whenarguments < 2
    
    remoteContacts_instance->is_logged_in = remoteContacts_instance->gab->authenticate(*user,*pasw);
    
    // Return value
    return v8::Boolean::New(remoteContacts_instance->is_logged_in);
  }
}

// remotecontacts.isLoggedIn();
// This is a method part of the constructor function's prototype
v8::Handle<v8::Value> CRemoteContacts::_isLoggedIn(const v8::Arguments& args) 
{
  v8::HandleScope scope;
  
    // Extract C++ object reference from "this" aka args.This() argument
    CRemoteContacts* remoteContacts_instance = node::ObjectWrap::Unwrap<CRemoteContacts>(args.This());
    
    // Return value
    return v8::Boolean::New(remoteContacts_instance->is_logged_in);
}

// remotecontacts.getContacts();
// This is a method part of the constructor function's prototype
v8::Handle<v8::Value> CRemoteContacts::_getContacts(const v8::Arguments& args) 
{
  v8::HandleScope scope;
  // Extract C++ object reference from "this" aka args.This() argument
  CRemoteContacts* remoteContacts_instance = node::ObjectWrap::Unwrap<CRemoteContacts>(args.This());
  
  //Read contacts from instance
  std::vector<RawContact> contactVec=remoteContacts_instance->gab->getContacts();
  //Store number of contacts
  uint num_of_cont = contactVec.size();
  
  v8::Local<v8::Array> contacts_array = v8::Array::New(num_of_cont);
  uint i=0;
  //Iterate through the map and set new array entries
  std::vector<RawContact>::iterator v_iter;
  for ( v_iter = contactVec.begin(); v_iter != contactVec.end(); v_iter++ )
  {
    v8::Local<v8::Object> _entry = v8::Object::New();
    
    //Iteration through the single entry map (string field,string value)
    RawContact::iterator rc_it;
    for(rc_it = v_iter->begin(); rc_it != v_iter->end(); rc_it++)
    {
      _entry->Set(v8::String::New(rc_it->first.c_str()), v8::String::New(rc_it->second.c_str()));
    }
    
    //Store Entry to array
    contacts_array->Set(i++,_entry);   
  }
  
  // Return value
  return scope.Close(contacts_array);
}

// What follows is boilerplate code:

/* Thats it for actual interfacing with v8, finally we need to let Node.js know how to dynamically load our code. 
   Because a Node.js extension can be loaded at runtime from a shared object, we need a symbol that the dlsym function can find, 
   so we do the following: */
// See https://www.cloudkick.com/blog/2010/aug/23/writing-nodejs-native-extensions/ & http://www.freebsd.org/cgi/man.cgi?query=dlsym
// Cause of name mangling in C++, we use extern C here
v8::Persistent<v8::FunctionTemplate> CRemoteContacts::persistent_function_template;
extern "C" {
  static void init(v8::Handle<v8::Object> target) {
    CRemoteContacts::Init(target);
  }
  // @see http://github.com/ry/node/blob/v0.2.0/src/node.h#L101
  NODE_MODULE(remotecontacts, init);
}
