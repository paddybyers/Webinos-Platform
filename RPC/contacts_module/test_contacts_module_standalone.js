/*******************************************************************************
 * Copyright 2011 Istituto Superiore Mario Boella (ISMB)
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 ******************************************************************************/

require.paths.unshift(".");
var cm = require("contacts_module");

var params = new Array(1);
params[0] = {};
params[0].usr = "USER";
params[0].pwd = "PASSWORD";
params[0].type = "remote";

cm.authenticate(params, function(res)
{
  console.log("Authenticate = " + (res ? "OK" : "ERROR"));
});
cm.isAlreadyAuthenticated(params, function(res)
{
  console.log("Already authenticated = " + (res ? "YES" : "NO"));
});
console.log("\n");

cm.getAllContacts(params, function(list)
{
  console.log("Found ", list.length, "contacts");
  for ( var i = 0; i < list.length; i++)
    console.log("getAllContacts res[", i, "].displayName = ", list[i].displayName, list[i].urls);
  //console.log("getAllContacts res[",3,"] = ", list[3]);
});
console.log("\n");
console.log("________________________________________________________________________");
// This should be the way to pass params asynchronously... ????
var found;
function getFound(par)
{
  return par;
};

var fields =
{
  "displayName" : "Lord Darth Skywalker Vader sith"
}; //try also with: rossi, Rossi, Vader... ;)
console.log("\search for:", fields.displayName);
cm.find(fields, function(pms)
{
  found = getFound(pms);
})
console.log("\nFOUND:");
if (found.length == 0)
  console.log("      NOT FOUND!")
else
  for ( var i = 0; i < found.length; i++)
    console.log("[", i, "]: ", found[i].displayName);
console.log("________________________________________________________________________");

//var fields2 = {"name.familyName":"Paolo"};
//console.log("FIELDS 2:",fields2["name.familyName"]);

var fields1 =
{
  "name" : "Paolo"
};
console.log("\nsearch for:", fields1["name"]);
found = undefined;
cm.find(fields1, function(pms)
{
  found = getFound(pms);
})
console.log("\nFOUND:");
if (found.length == 0)
  console.log("      NOT FOUND!")
else
  for ( var i = 0; i < found.length; i++)
    console.log("[", i, "]: ", found[i].displayName);
console.log("________________________________________________________________________");

var fields2 =
{
  "name" : "paolo",
  "birthday" : (new Date(1956, 8, 23)).toString()
}; //Date month is 0->11 so september is 8 !!!
console.log("\nsearch for:", fields2);
found = undefined;
cm.find(fields2, function(pms)
{
  found = getFound(pms);
})
console.log("\nFOUND:");
if (found.length == 0)
  console.log("      NOT FOUND!")
else
  for ( var i = 0; i < found.length; i++)
    console.log("[", i, "]: ", found[i].displayName);
console.log("________________________________________________________________________");

var fields3 =
{
  "birthday" : "Sun, 05 Jun 1966 22:00:00 GMT"
};
console.log("\nsearch for:", fields3["birthday"]);
found = undefined;
cm.find(fields3, function(pms)
{
  found = getFound(pms);
})
console.log("FOUND:");
if (found.length == 0)
  console.log("      NOT FOUND!")
else
  for ( var i = 0; i < found.length; i++)
    console.log("[", i, "]: ", found[i].displayName);
console.log("________________________________________________________________________");

var fields3 =
{
  "emails" : "paolo.rossi@cheridere.it"
};
console.log("\nsearch for:", fields3["emails"]);
found = undefined;
cm.find(fields3, function(pms)
{
  found = getFound(pms);
})
console.log("FOUND:");
if (found.length == 0)
  console.log("      NOT FOUND!")
else
  for ( var i = 0; i < found.length; i++)
    console.log("[", i, "]: ", found[i].displayName);
console.log("________________________________________________________________________");

var fields4 =
{
  "addresses" : "spazio"
};
console.log("\nsearch for:", fields4["addresses"]);
found = undefined;
cm.find(fields4, function(pms)
{
  found = getFound(pms);
})
console.log("FOUND:");
if (found.length == 0)
  console.log("      NOT FOUND!")
else
  for ( var i = 0; i < found.length; i++)
  {
    console.log("[", i, "]: ", found[i].displayName);
    console.log("Addresses:")
    for ( var k = 0; k < found[i].addresses.length; k++)
    {
      console.log("\t" + found[i].addresses[k].toString());
//      console.log("\t" + (found[i].addresses[k].pref ? "*" : "") +
//        (found[i].addresses[k].type == "" ? "other" : found[i].addresses[k].type) + ": " +
//        found[i].addresses[k].formatted + "\n");
    }
  }
console.log("________________________________________________________________________");

var fields4 =
{
  "organizations" : "empire"
};
console.log("\nsearch for:", fields4["organizations"]);
found = undefined;
cm.find(fields4, function(pms)
{
  found = getFound(pms);
})
console.log("FOUND:");
if (found.length == 0)
  console.log("      NOT FOUND!")
else
  for ( var i = 0; i < found.length; i++)
    console.log("[", i, "]: ", found[i].displayName);
console.log("________________________________________________________________________");

// // TEST OF LOCAL CONTACTS API
// console.log("Type:")
// var cLocal = new cm.local.contacts();
// console.log(typeof (cLocal));
// console.log(cLocal);
//
// var addressbookName = "<path_to_thunderbird_address_book>/abook.mab"; //
// history.mab";
// var res1 = false;
// res1 = cLocal.open(addressbookName);
// console.log("open was succesfull: ", res1);
//
// var res2 = false;
// res = cLocal.isOpen();
// console.log("cLocal is open: ", res2);
//
// console.log("LOCAL ADDRESS BOOK");
// console.log(cLocal.getAB());
//
// // TEST OF REMOTE (GMAIL) CONTACTS API
// console.log("Type:")
// var cRemote = new cm.remote.contacts();
// console.log(typeof (cRemote));
// console.log(cRemote);
//
// var def_usr = "<gmail_username>";
// var def_pwd = "<gmail_password>";
//
// var res3 = false;
// res3 = cRemote.logIn(def_usr, def_pwd);
// console.log("log in was succesfull: ", res3);
//
// var res4 = false;
// res4 = cRemote.isLoggedIn();
// console.log("cRemote, is logged in: ", res4);
//
// console.log("REMOTE ADDRESS BOOK");
// console.log(cRemote.getContacts());
