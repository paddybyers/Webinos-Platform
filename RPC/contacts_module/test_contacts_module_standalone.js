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

require.paths.unshift(".");
var cm = require("contacts_module");

// TEST OF LOCAL CONTACTS API
console.log("Type:")
var cLocal = new cm.local.contacts();
console.log(typeof (cLocal));
console.log(cLocal);

var addressbookName = "<path_to_thunderbird_address_book>/abook.mab"; // history.mab";
var res1 = false;
res1 = cLocal.open(addressbookName);
console.log("open was succesfull: ", res1);

var res2 = false;
res = cLocal.isOpen();
console.log("cLocal is open: ", res2);

console.log("LOCAL ADDRESS BOOK");
console.log(cLocal.getAB());

// TEST OF REMOTE (GMAIL) CONTACTS API
console.log("Type:")
var cRemote = new cm.remote.contacts();
console.log(typeof (cRemote));
console.log(cRemote);

var def_usr = "<gmail_username>";
var def_pwd = "<gmail_password>";

var res3 = false;
res3 = cRemote.logIn(def_usr, def_pwd);
console.log("log in was succesfull: ", res3);

var res4 = false;
res4 = cRemote.isLoggedIn();
console.log("cRemote, is logged in: ", res4);

console.log("REMOTE ADDRESS BOOK");
console.log(cRemote.getContacts());
