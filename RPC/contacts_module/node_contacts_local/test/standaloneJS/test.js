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

require.paths.unshift("../../build/default/"); // path to our extension
var localcontacts = require("localcontacts");

//TEST module loaded ok
console.log("localcontacts module OBJ: "+localcontacts);

//default address book TODO add a sample .mab file
var addressbookName="<path_to_thunderbird_address_book>/abook.mab"; //history.mab";

//TEST constructor
var myContacts = new localcontacts.contacts();
console.log("myContacts OBJ: "+myContacts);

//TEST open() all right
var r= myContacts.open(addressbookName);
console.log("address book opened succesfully: "+r);

//TEST isOpen() all right 
var isOp = myContacts.isOpen()
console.log("myContacts.isOpen(): "+isOp);

//TEST open() and isOpen() behavior with wrong path
var badContacts = new localcontacts.contacts();
var isOp2 = badContacts.isOpen()
console.log("badContacts.isOpen(): "+isOp2);
var bad= badContacts.open("uauauauau");
console.log("badContacts address book opened succesfully: "+bad);

//TEST isOpen() behavior with empty path
var emptyContacts = new localcontacts.contacts();
var isOp3 = emptyContacts.isOpen()
console.log("emptyContacts.isOpen(): "+isOp3);

//TEST getAB()
console.log("\nADDRESS BOOK CONTENT:\n")
console.log(myContacts.getAB());
