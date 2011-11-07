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

//require.paths.unshift(__dirname+"/build/default/"); // path to local contacts extension module

//var localcontacts = require(__dirname+"/build/default/localcontacts"); //node v0.4.12
var localcontacts = require(__dirname+"/build/Release/localcontacts");   //node v0.6.0

//Pass methods to the above levels using this
//TODO here we can remap names, if desired

///Constructor
this.contacts = localcontacts.contacts;

///Open open(<path-to-mab-addressbook>) - returns true if opening the address book was succesfull
this.open = localcontacts.open;

///true if a valid mab file has been loaded
this.isOpen = localcontacts.isOpen;

///get all address book contacts
this.getAB= localcontacts.getAB;

//TODO continue exposing other C++ methods here
