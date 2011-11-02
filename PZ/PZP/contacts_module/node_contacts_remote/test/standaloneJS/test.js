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

var remotecontacts = require("../../build/default/remotecontacts");

//TEST module loaded ok
console.log("remotecontacts module OBJ: "+remotecontacts);

//default address book
var defUsr = "<gmail_usr>";
var defPwd = "<gmail_pwd>";

//TEST constructor
var myContacts = new remotecontacts.contacts();
console.log("myContacts OBJ: "+myContacts);

//TEST logIn() all right
var r= myContacts.logIn(defUsr,defPwd);
console.log("address book opened succesfully: "+r);

//TEST isLoggedIn() all right 
var isOp = myContacts.isLoggedIn()
console.log("myContacts.isLoggedIn(): "+isOp);

//TEST logIn() and isLoggedIn() behavior with wrong path
var badContacts = new remotecontacts.contacts();
var isOp2 = badContacts.isLoggedIn()
console.log("badContacts.isLoggedIn(): "+isOp2);
var bad= badContacts.logIn("uauauauau","153231");
console.log("badContacts address book opened succesfully: "+bad);

//TEST isLoggedIn() behavior with empty path
var emptyContacts = new remotecontacts.contacts();
var isOp3 = emptyContacts.isLoggedIn()
console.log("emptyContacts.isLoggedIn(): "+isOp3);

//TEST getContacts()
console.log("\nADDRESS BOOK CONTENT:\n")
console.log(myContacts.getContacts());
console.log("phoneNumbers",myContacts.getContacts()[3]['phoneNumbers']);
console.log("emails",myContacts.getContacts()[3]['emails']);
console.log("addresses",myContacts.getContacts()[3]['addresses']);
console.log("ims",myContacts.getContacts()[3]['ims']);
console.log("organizations",myContacts.getContacts()[3]['organizations']);
console.log("urls",myContacts.getContacts()[3]['urls']);


console.log("\n----------------------")
console.log("emails[0]",myContacts.getContacts()[3]['emails'][0]);
