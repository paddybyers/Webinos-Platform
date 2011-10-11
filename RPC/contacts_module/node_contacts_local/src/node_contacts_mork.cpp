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

#include "node_contacts_mork.h"

CLocalContacts::CLocalContacts() : is_open(false)
{
  mab = new MorkAddressBook();
};

CLocalContacts::~CLocalContacts()
{
  if (mab)
    delete mab;
};


// @Node.js calls Init() when you load the extension through require()
// Init() defines our constructor function and prototype methods
// It then binds our constructor function as a property of the target object
// Target is the "target" onto which an extension is loaded. For example:
// var notify = require("../build/default/localcontacts.node"); will bind our constructor function to notify.Notification
// so that we can call "new localcontacts.Contacts();"
void CLocalContacts::Init(v8::Handle<v8::Object> target) 
{
  // We need to declare a V8 scope so that our local handles are eligible for garbage collection.
  // once the Init() returns.
  v8::HandleScope scope;
  // Wrap our New() method so that it's accessible from Javascript
  v8::Local<v8::FunctionTemplate> local_function_template = v8::FunctionTemplate::New(New);
  
  // Make it persistent and assign it to our object's persistent_function_template attribute
  CLocalContacts::persistent_function_template = v8::Persistent<v8::FunctionTemplate>::New(local_function_template);
  
  // Each JavaScript object keeps a reference to the C++ object for which it is a wrapper with an internal field.
  CLocalContacts::persistent_function_template->InstanceTemplate()->SetInternalFieldCount(1); // 1 since this is a constructor function
  
  // Set a class name for objects created with our constructor - i.e. the type returned from typeof()
  CLocalContacts::persistent_function_template->SetClassName(v8::String::NewSymbol("LocalContacts"));
  
  // Set property ACCESSORS (i.e. for using JS = operator)
  //CLocalContacts::persistent_function_template->InstanceTemplate()->SetAccessor(String::New("title"), GetTitle, SetTitle);
  //CLocalContacts::persistent_function_template->InstanceTemplate()->SetAccessor(String::New("icon"), GetIcon, SetIcon);
  
  // @Node.js macro to help bind C++ METHODS to Javascript methods (see https://github.com/joyent/node/blob/v0.2.0/src/node.h#L34)
  // Arguments: our constructor function, Javascript method name, C++ method name
  NODE_SET_PROTOTYPE_METHOD(CLocalContacts::persistent_function_template, "open", _Open);
  NODE_SET_PROTOTYPE_METHOD(CLocalContacts::persistent_function_template, "isOpen", _isOpen);
  NODE_SET_PROTOTYPE_METHOD(CLocalContacts::persistent_function_template, "getAB", _getAB);
  
  // Set the "contacts" property to the target and assign it to our constructor function
  target->Set(v8::String::NewSymbol("contacts"), CLocalContacts::persistent_function_template->GetFunction());
}

// new LocalContacts();
// This is our constructor function. It instantiate a C++ CLocalContacts object and returns a Javascript handle to this object.
 v8::Handle<v8::Value> CLocalContacts::New(const v8::Arguments& args) {
  v8::HandleScope scope;
  CLocalContacts* localContacts_instance = new CLocalContacts();
  // Set some default values
//  localContacts_instance->title = "Node.js";
//  localContacts_instance->icon = "terminal";
  
  // Wrap our C++ object as a Javascript object
  localContacts_instance->Wrap(args.This());
  
  
  // Our constructor function returns a Javascript object which is a wrapper for our C++ object, 
  // This is the expected behavior when calling a constructor function with the new operator in Javascript.
  return args.This();
}

// localcontacts.open(addressbook);
// This is a method part of the constructor function's prototype
v8::Handle<v8::Value> CLocalContacts::_Open(const v8::Arguments& args) 
{
  v8::HandleScope scope;
  
  if (args.Length()==0) //TODO raise exception - user must supply an addres book name
    return v8::Boolean::New(false);
  else
  {
    // Extract C++ object reference from "this" aka args.This() argument
    CLocalContacts* localContacts_instance = node::ObjectWrap::Unwrap<CLocalContacts>(args.This());
    
    // Convert first argument to V8 String
    v8::String::Utf8Value addresBookPath(args[0]);
    
    //TODO raise exception if no arguments
    
    localContacts_instance->is_open = localContacts_instance->mab->openAddressBook(*addresBookPath);
    
    // Return value
    return v8::Boolean::New(localContacts_instance->is_open);
  }
}

// localcontacts.isOpen();
// This is a method part of the constructor function's prototype
v8::Handle<v8::Value> CLocalContacts::_isOpen(const v8::Arguments& args) 
{
  v8::HandleScope scope;
  
    // Extract C++ object reference from "this" aka args.This() argument
    CLocalContacts* localContacts_instance = node::ObjectWrap::Unwrap<CLocalContacts>(args.This());
    
    // Return value
    return v8::Boolean::New(localContacts_instance->is_open);
}

// localcontacts.getAB();
// This is a method part of the constructor function's prototype
v8::Handle<v8::Value> CLocalContacts::_getAB(const v8::Arguments& args) 
{
  v8::HandleScope scope;
  // Extract C++ object reference from "this" aka args.This() argument
  CLocalContacts* localContacts_instance = node::ObjectWrap::Unwrap<CLocalContacts>(args.This());
  
  //Read contacts from instance
  AbeMap ab=localContacts_instance->mab->getAB();
  //Store number of contacts
  uint num_of_cont = ab.size();
  
  v8::Local<v8::Array> ab_array = v8::Array::New(num_of_cont);
  uint i=0;
  //Iterate through the map and set new array entries
  AbeMap::iterator iter;
  for ( iter = ab.begin(); iter != ab.end(); iter++ )
  {
    v8::Local<v8::Object> _entry = v8::Object::New();
    
        /// Entry ID
    _entry->Set(v8::String::New("id"), v8::String::New(iter->second.id.c_str()));

    /// Name
    _entry->Set(v8::String::New("first_name"), v8::String::New(iter->second.first_name.c_str()));
    _entry->Set(v8::String::New("last_name"), v8::String::New(iter->second.last_name.c_str()));
    _entry->Set(v8::String::New("nick_name"), v8::String::New(iter->second.nick_name.c_str()));

    /// Telephones/Faxes
    _entry->Set(v8::String::New("home_tel"), v8::String::New(iter->second.home_tel.c_str()));
    _entry->Set(v8::String::New("mobile_tel"), v8::String::New(iter->second.mobile_tel.c_str()));
    _entry->Set(v8::String::New("work_tel"), v8::String::New(iter->second.work_tel.c_str()));
    _entry->Set(v8::String::New("fax"), v8::String::New(iter->second.fax.c_str()));

    /// Addresses
    _entry->Set(v8::String::New("address_work"), v8::String::New(iter->second.address_work.c_str()));
    _entry->Set(v8::String::New("address_home"), v8::String::New(iter->second.address_home.c_str()));

    /// Web Page
    _entry->Set(v8::String::New("web_page"), v8::String::New(iter->second.web_page.c_str()));

    /// Email
    _entry->Set(v8::String::New("email"), v8::String::New(iter->second.email.c_str()));
    
    /// Notes
    _entry->Set(v8::String::New("notes"), v8::String::New(iter->second.notes.c_str()));
    
    //TODO ask Paolo for final API look: following line is compatible with Google's "title" field, but should we better handle it in JS?
//    _entry->Set(v8::String::New("title"), v8::String::New(std::string(iter->second.first_name+" "+iter->second.last_name).c_str()));

    //Store Entry to array
    ab_array->Set(i++,_entry);   
  }
  
  
  
  // Return value
  return scope.Close(ab_array);
}

// What follows is boilerplate code:

/* Thats it for actual interfacing with v8, finally we need to let Node.js know how to dynamically load our code. 
   Because a Node.js extension can be loaded at runtime from a shared object, we need a symbol that the dlsym function can find, 
   so we do the following: */
// See https://www.cloudkick.com/blog/2010/aug/23/writing-nodejs-native-extensions/ & http://www.freebsd.org/cgi/man.cgi?query=dlsym
// Cause of name mangling in C++, we use extern C here
v8::Persistent<v8::FunctionTemplate> CLocalContacts::persistent_function_template;
extern "C" {
  static void init(v8::Handle<v8::Object> target) {
    CLocalContacts::Init(target);
  }
  // @see http://github.com/ry/node/blob/v0.2.0/src/node.h#L101
  NODE_MODULE(localcontacts, init);
}
