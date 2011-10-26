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
    console.log("getAllContacts res[", i, "].displayName = ", list[i].displayName);
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
};
console.log("\search for:", fields.displayName);
cm.find("remote",fields, function(pms) //or use cm.findContacts({"type":"remote","fields":fields}, function(pms)
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

var fields1 =
{
  "name" : "Paolo"
};
console.log("\nsearch for:", fields1["name"]);
found = undefined;
cm.find("remote",fields1, function(pms)
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
cm.find("remote",fields2, function(pms)
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
cm.find("remote",fields3, function(pms)
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
  "emails" : "paolo.rossi@cheridere.it"
};
console.log("\nsearch for:", fields4["emails"]);
found = undefined;
cm.find("remote",fields4, function(pms)
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
cm.find("remote",fields4, function(pms)
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
    }
  }
console.log("________________________________________________________________________");

var fields5 =
{
  "organizations" : "empire"
};
console.log("\nsearch for:", fields5["organizations"]);
found = undefined;
cm.find("remote",fields5, function(pms)
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

//  TEST OF LOCAL CONTACTS
console.log("TEST OF LOCAL CONTACTS:")

var addressbookName = "node_contacts_local/test/testAddressBook/abook.mab";
 
params = new Array(1);
params[0] = {};
params[0].addressBookName = addressbookName;
params[0].type = "local";

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
    console.log("getAllContacts res[", i, "].displayName = ", list[i].displayName);
 });
console.log("\n");
console.log("________________________________________________________________________");
 

var fields6 =
{
  "displayName" : "gigio"
};
console.log("\search for:", fields6.displayName);
found = undefined;
cm.find("local",fields6, function(pms)
{
  found = getFound(pms);
})
console.log("FOUND:");
if (found.length == 0)
  console.log("      NOT FOUND!")
else
  for ( var i = 0; i < found.length; i++)
    console.log("[", i, "]: ", found[i].displayName);
