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
 
//require.paths.unshift(__dirname+"/build/default/"); // path to our extension

//var remotecontacts = require(__dirname+"/build/default/remotecontacts"); //node v0.4.12
var remotecontacts = require(__dirname+"/build/Release/remotecontacts"); //node v0.6.0

//Pass methods to the above levels using this
//TODO here we can remap names, if desired

///Constructor
this.contacts = remotecontacts.contacts;

///logIn (<gmail_user>, <gmail_passw>) - returns true if the login was succesfull
this.logIn = remotecontacts.logIn;

///true if a valid usrname and password were supplied
this.isLoggedIn = remotecontacts.isLoggedIn;

///get all gmail contacts
this.getContacts= remotecontacts.getContacts;

//TODO continue exposing other C++ methods here
