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
//require.paths.unshift(__dirname + "/node_contacts_remote");
var remote_contacts = require(__dirname + "/node_contacts_remote/remote_contacts");

//require.paths.unshift(__dirname + "/node_contacts_local");
var local_contacts = require(__dirname + "/node_contacts_local/local_contacts");

/**
 * Instances of remote contacts and local contacts
 */
RemoteContacts = new remote_contacts.contacts();
LocalContacts = new local_contacts.contacts();

/**
 * Empty Constructor for Contact Implements W3C Contact as in
 * http://dev.webinos.org/specifications/draft/contacts.html
 */
function Contact()
{
}

Contact.prototype.id = "";
Contact.prototype.displayName = "";
Contact.prototype.name = new ContactName();
Contact.prototype.nickname = "";
Contact.prototype.phoneNumbers = [];
Contact.prototype.emails = [];
Contact.prototype.addresses = [];
Contact.prototype.ims = [];
Contact.prototype.organizations = [];
Contact.prototype.revision = "";
Contact.prototype.birthday = "";
Contact.prototype.gender = "";
Contact.prototype.note = "";
Contact.prototype.photos = [];
Contact.prototype.categories = [];
Contact.prototype.urls = [];
Contact.prototype.timezone = "";

/**
 * Constructor for Contact with type checks Implements W3C Contact as in
 * http://dev.webinos.org/specifications/draft/contacts.html
 */
function Contact(_id, _displayName, _name, _nickname, _phonenumbers, _emails, _addrs, _ims, _orgs, _rev, _birthday,
  _gender, _note, _photos, _catgories, _urls, _timezone)
{
  if (_id)
    this.id = _id;
  if (_displayName)
    this.displayName = _displayName;
  if (_name && _name instanceof ContactName)
    this.name = _name;
  if (_nickname)
    this.nickname = _nickname;
  if (_phonenumbers && _phonenumbers instanceof Array &&
    (_phonenumbers.length > 0 && (_phonenumbers[0] instanceof ContactField)))
    this.phoneNumbers = _phonenumbers;
  if (_emails && _emails instanceof Array && (_emails.length > 0 && (_emails[0] instanceof ContactField)))
    this.emails = _emails;
  if (_addrs && _addrs instanceof Array && (_addrs.length > 0 && (_addrs[0] instanceof ContactAddress)))
    this.addresses = _addrs;
  if (_ims && _ims instanceof Array && (_ims.length > 0 && (_ims[0] instanceof ContactField)))
    this.ims = _ims;
  if (_orgs && _orgs instanceof Array && (_orgs.length > 0 && (_orgs[0] instanceof ContactOrganization)))
    this.organizations = _orgs;
  if (_rev && _rev instanceof Date)
    this.revision = _rev;
  if (_birthday && _birthday instanceof Date)
    this.birthday = _birthday;
  if (_gender)
    this.gender = _gender;
  if (_note)
    this.note = _note;
  if (_photos && _photos instanceof Array)
    this.photos = _photos;
  if (_catgories && _catgories instanceof Array && (_catgories.length > 0 && (_catgories[0] instanceof String)))
    this.categories = _catgories;
  if (_urls)
    this.urls = _urls;
  if (_timezone)
    this.timezone = _timezone;
}

/**
 * Empty Constructor for ContactName Implements W3C ContactName as in
 * http://dev.webinos.org/specifications/draft/contacts.html
 */
function ContactName()
{
}

ContactName.prototype.formatted = "";
ContactName.prototype.familyName = "";
ContactName.prototype.givenName = "";
ContactName.prototype.middleName = "";
ContactName.prototype.honorificPrefix = "";
ContactName.prototype.honorificSuffix = "";

ContactName.prototype.toString = function()
{
  return name.formatted + "";
}

/**
 * Constructor for ContactName with type checks. Implements W3C ContactName as
 * in http://dev.webinos.org/specifications/draft/contacts.html
 */
function ContactName(_formatted, _family, _given, _middle, _pre, _suf)
{
  if (_formatted)
    this.formatted = _formatted;
  if (_family)
    this.familyName = _family;
  if (_given)
    this.givenName = _given;
  if (_middle)
    this.middleName = _middle;
  if (_pre)
    this.honorificPrefix = _pre;
  if (_suf)
    this.honorificSuffix = _suf;
}

/**
 * Empty Constructor for ContactField. Implements W3C ContactField as in
 * http://dev.webinos.org/specifications/draft/contacts.html
 */
function ContactField()
{
}

ContactField.prototype.type = "";
ContactField.prototype.value = "";
ContactField.prototype.pref = false;

ContactField.prototype.toString = function()
{
  if (!this.isEmpty())
    return this.type + ": " + this.value + (this.pref ? " *" : "") + "";
  else
    return "";
}

ContactField.prototype.isEmpty = function()
{
  return (this.value == "");
}

/**
 * Constructor for ContactField with type checks. Implements W3C ContactField as
 * in http://dev.webinos.org/specifications/draft/contacts.html
 */
function ContactField(_value, _type, _pref)
{
  if (_value)
    this.value = String(_value);
  if (_type)
    this.type = String(_type);
  if (_pref)
    this.pref = Boolean(_pref);
}

/**
 * Empty Constructor for ContactAddress. Implements W3C ContactAddress as in
 * http://dev.webinos.org/specifications/draft/contacts.html
 */
function ContactAddress()
{
}
ContactAddress.prototype.pref = false;
ContactAddress.prototype.type = "";
ContactAddress.prototype.formatted = "";
ContactAddress.prototype.streetAddress = "";
ContactAddress.prototype.locality = "";
ContactAddress.prototype.region = "";
ContactAddress.prototype.postalCode = "";
ContactAddress.prototype.country = "";

/**
 * Constructor for ContactAddress with type checks. Implements W3C
 * ContactAddress as in
 * http://dev.webinos.org/specifications/draft/contacts.html
 */
function ContactAddress(_formatted, _type, _street, _pref, _locality, _region, _postalCode, _country)
{
  if (_pref)
    this.pref = Boolean(_pref);
  if (_type)
    this.type = _type;
  if (_formatted)
    this.formatted = _formatted;
  if (_street)
    this.streetAddress = _street;
  if (_locality)
    this.locality = _locality;
  if (_region)
    this.region = _region;
  if (_postalCode)
    this.postalCode = _postalCode;
  if (_country)
    this.country = _country;
}

ContactAddress.prototype.toString = function()
{
  if (!this.isEmpty())
    return (this.type == "" ? "other" : this.type) + ": " + this.formatted + (this.pref ? " *" : "") + "";
  else
    return "";
}

ContactAddress.prototype.isEmpty = function()
{
  return (this.formatted == "");
}

/**
 * Empty Constructor for ContactOrganization. Implements W3C ContactOrganization
 * as in http://dev.webinos.org/specifications/draft/contacts.html
 */
function ContactOrganization()
{
}
ContactOrganization.prototype.pref = false;
ContactOrganization.prototype.type = "";
ContactOrganization.prototype.name = "";
ContactOrganization.prototype.department = "";
ContactOrganization.prototype.title = "";

/**
 * Constructor for ContactOrganization with type checks. Implements W3C
 * ContactOrganization as in
 * http://dev.webinos.org/specifications/draft/contacts.html
 */
function ContactOrganization(_name, _type, _pref, _title, _department)
{
  if (_pref)
    this.pref = Boolean(_pref);
  if (_type)
    this.type = _type;
  if (_name)
    this.name = _name;
  if (_department)
    this.department = _department;
  if (_title)
    this.title = _title;
}

ContactOrganization.prototype.toString = function()
{
  if (!this.isEmpty())
    return (this.type == "" ? "other" : this.type) + ": " + this.name + (this.pref ? " *" : "") + "";
  else
    return "";
}

ContactOrganization.prototype.isEmpty = function()
{
  return (this.name == "");
}

/**
 * Either open a local address book or perform login into GMail account TODO
 * this method has to be removed when user profile will handle authentication
 */
this.authenticate = function(params, callback)
{

  if (params[0]['type'] == "local")
  {
    callback(LocalContacts.open(params[0]['addressBookName']));
  }
  else if (params[0]['type'] == "remote")
  {
    //callback(RemoteContacts.logIn(params[0]['usr'], params[0]['pwd']));

	var pmlib = require("../../Manager/Policy/policymanager.js"),
	policyManager,
	exec = require('child_process').exec; // this line should be moved in the policy manager

	policyManager = new pmlib.policyManager();

		var res,
		request = {},
		subjectInfo = {},
		resourceInfo = {};

		subjectInfo.userId = "user1";
		request.subjectInfo = subjectInfo;

		resourceInfo.apiFeature = "http://www.w3.org/ns/api-perms/contacts.read";
		request.resourceInfo = resourceInfo;
		//policyManager.enforceRequest(request, console.log, callback, RemoteContacts.logIn("gregg01", "lazio000"));

		res=policyManager.enforceRequest(request);
		switch(res) {
		case 0:		callback(RemoteContacts.logIn(params[0]['usr'], params[0]['pwd']));
				break;

		case 1:		callback(false);
				console.log("KO");
				break;

		case 2:
		case 3:
		case 4:		var child = exec("xmessage -buttons allow,deny -print 'Access request to "+resourceInfo.apiFeature+"'",
					function (error, stdout, stderr) {	
						if (stdout == "allow\n") {
							callback(RemoteContacts.logIn(params[0]['usr'], params[0]['pwd']));
						}
						else {
							callback(false);
							console.log("KO");
						}
					});
				break;

		default:	callback(false);
				console.log("KO");
	}
  }
}

/**
 * returns true if contacts service is already authenticated with GMail or a
 * valid address book file is aready open TODO this method has to be removed
 * when user profile will handle authentication
 * 
 */
this.isAlreadyAuthenticated = function(params, callback)
{
  if (params)
  {
    if (params[0]['type'] == "local")
    {
      callback(LocalContacts.isOpen());
    }
    else if (params[0]['type'] == "remote")
    {
      callback(RemoteContacts.isLoggedIn());
    }
  }
}

/**
 * returns a list of all contact TODO remove once debugging and testing are
 * successfull
 */
this.getAllContacts = function(params, callback)
{
  if (params)
  {
    makeW3Ccontacts(params[0]['type'], callback);
  }
}

/**
 * Map a native contact type array to a W3C compliant Contact one
 */
function makeW3Ccontacts(type, callback)
{
  var contacts_l;
  var rawContacts;
  if (type == "local")
  {
    // get an array of local contacts
    rawContacts = LocalContacts.getAB();
    contacts_l = new Array(rawContacts.length);
  }
  else if (type == "remote")
  {
    // get an array of remote contacts
    rawContacts = RemoteContacts.getContacts();
    contacts_l = new Array(rawContacts.length);
  }

  for ( var i = 0; i < rawContacts.length; i++)
  {
    contacts_l[i] = rawContact2W3CContact(rawContacts[i]);
  }

  callback(contacts_l);
}

/**
 * map a raw (c++ like) contact to a w3c typed contact
 */
function rawContact2W3CContact(rawContact)
{
  //Fill Contact Name
  var _contactName = new ContactName(rawContact.name['formatted'], rawContact.name['familyName'],
    rawContact.name['givenName'], rawContact.name['middleName'], rawContact.name['honorificPrefix'],
    rawContact.name['honorificSuffix']);

  //Phone Numbers
  var _contactPhoneNumbers = new Array(rawContact.phoneNumbers.length);
  for ( var j = 0; j < rawContact.phoneNumbers.length; j++)
  {
    _contactPhoneNumbers[j] = new ContactField(rawContact.phoneNumbers[j]['value'],
      rawContact.phoneNumbers[j]['type'], Boolean(rawContact.phoneNumbers[j]['pref'] == "true"));
  }

  //Email Addresses
  var _contactEmails = new Array(rawContact.emails.length);
  for ( var j = 0; j < rawContact.emails.length; j++)
  {
    _contactEmails[j] = new ContactField(rawContact.emails[j]['value'], rawContact.emails[j]['type'],
      Boolean(rawContact.emails[j]['pref'] == "true"));
  }

  //Post Addresses _formatted
  var _contactAddresses = new Array(rawContact.addresses.length);
  for ( var j = 0; j < rawContact.addresses.length; j++)
  {
    _contactAddresses[j] = new ContactAddress(rawContact.addresses[j]['formatted'],
      rawContact.addresses[j]['type'], rawContact.addresses[j]['streetAddress'],
      Boolean(rawContact.addresses[j]['pref'] == "true"));
  }

  //Instant Messengers
  var _contactIms = new Array(rawContact.ims.length);
  for ( var j = 0; j < rawContact.ims.length; j++)
  {
    _contactIms[j] = new ContactField(rawContact.ims[j]['value'], rawContact.ims[j]['type'],
      Boolean(rawContact.ims[j]['pref'] == "true"));
  }

  //Organizations
  var _contactOrgs = new Array(rawContact.organizations.length);
  for ( var j = 0; j < rawContact.organizations.length; j++)
  {
    _contactOrgs[j] = new ContactOrganization(rawContact.organizations[j]['name'],
      rawContact.organizations[j]['type'], Boolean(rawContact.organizations[j]['pref'] == "true"),
      rawContact.organizations[j]['title']);
  }

  //Urls
  var _contactUrls = new Array(rawContact.urls.length);
  for ( var j = 0; j < rawContact.urls.length; j++)
  {
    _contactUrls[j] = new ContactField(rawContact.urls[j]['value'], rawContact.urls[j]['type'],
      Boolean(rawContact.urls[j]['pref'] == "true"));
  }

  //Photos (always 1, with libGCal)
  var _contactPhotos = new Array(rawContact.photos.length);
  for ( var j = 0; j < rawContact.photos.length; j++)
  {
    _contactPhotos[j] = new ContactField(rawContact.photos[j]['value'], rawContact.photos[j]['type'],
      Boolean(rawContact.photos[j]['pref'] == "true"));
  }

  //Fill Contact
  /*
   * _id, _displayName, _name, _nickname, _phonenumbers, _emails, _addrs, _ims,
   * _orgs, _rev, _birthday, _gender, _note, _photos, _catgories, _urls,
   * _timezone
   * 
   */

  var _contact = new Contact(rawContact.id, rawContact.displayName, _contactName, rawContact.nickname,
    _contactPhoneNumbers, _contactEmails, _contactAddresses, _contactIms, _contactOrgs,
    new Date(rawContact.revision), new Date(rawContact.birthday), rawContact.gender, rawContact.note,
    _contactPhotos, rawContact.categories, _contactUrls, rawContact.timezone);

  return _contact;
}



// /////////////////CONTACT FIND

function ContactFindOptions()
{

}
ContactFindOptions.prototype.filter = "";
ContactFindOptions.prototype.multiple = false;
ContactFindOptions.prototype.updatedSince = ""; //is a Date

/**
 * callback used to internally retrieve some data
 * 
 * @param par
 * @returns
 */
function simpleCallback(par)
{
  return par;
}

/**
 * Call find() according to the type specified in params TODO remove once
 * authentication is handled somewhere else
 */
this.findContacts = function(params, callback)
{
  if (params)
    this.find(params[0]['type'], params[0]['fields'], callback);
}

/**
 * Retrieve a list of contatcs matching fields specified in field TODO make this
 * full W3C specs compliant
 */
this.find = function(type, fields, successCB)// , errorCB, options)
{
  // initialize contacs_l with all contacts 
  //TODO should we cache the contacts somewhere in this module for speed up?
  var contacts_l;

  
// This should be the way to pass params asynchronously... ????
  makeW3Ccontacts(type, function(params)
  {
    contacts_l = simpleCallback(params);
  });

  var res = contacts_l;

  for ( var key in fields) //split key if necessary
  {
    res = filterContacts(key, fields[key], res);
    //TODO decomment following if only if we want to add more search options
//    var spKey = key.split("."); //---TODO if we allow user to use dot notation
//    switch (spKey.length)
//    {
//      case 1://simple key
//      res = filterContacts(key, fields[key], res);
//        break
//      case 2: //composite property, e.g. ContactName
//      //here
//      console.log("DBG: case 2 ", key, spKey);
//      res = [];
//        break;
//      default: //array of composite properties e.g ContactAddresses
//      //here
//      console.log("DBG: case n ", key, spKey);
//      res = [];
//    }
  }

  successCB(res);
}

/**
 * Filter contacts by checking their attributes key and values are always string
 * 
 * c_array array of Contacts to filter key = Contact property name value = value
 * to be checked
 * 
 * returns a filtered array of Contacts or an empty array
 */
function filterContacts(key, value, c_array)
{
  var ret_array = new Array();

  for ( var i = 0; i < c_array.length; i++)
  {
    //TODO decomment following if only if we want to add more search options
//    if (typeCheck(key, String) || typeCheck(key, "string")) //TODO if we allow user to use dot notation, check if key is a single string or a string array
//    {
    //Check String type Contact fields
    if (typeCheck(c_array[i][key], String) || typeCheck(c_array[i][key], "string")) // string types like displayName, nickname and so on
    {
      var rex = new RegExp("\\b" + value + "\\b", "gim");
      if (rex.test(c_array[i][key])) //TODO use ->(c_array[i][key] == value) if we wan exact case sensitive match
        ret_array.push(c_array[i]);
    }
    //Check Date type Contact fields
    else if (typeCheck(c_array[i][key], Date))
    {
      if (stringEqDate(value, c_array[i][key]))
        ret_array.push(c_array[i]);
    }
    else if (typeCheck(c_array[i][key], ContactName)) // query type "name":"Paolo"
    {
      for ( var f in c_array[i][key])
      {
        var rex = new RegExp("\\b" + value + "\\b", "gim");
        if (rex.test(c_array[i][key][f])) //TODO use ->(c_array[i][key][f] == value) if we wan exact case sensitive match
        {
          ret_array.push(c_array[i]);
          break;
        }
      }
    }
    else if (typeCheck(c_array[i][key], Array))
    {
      if (c_array[i][key].length > 0) //Supposing Array is uniform, which is not granted in JS!
      {
        if (typeCheck(c_array[i][key][0], ContactField)) //if ContactField, we check only the "value" field
        {
          for ( var j = 0; j < c_array[i][key].length; j++)
          {
            if (c_array[i][key][j]["value"] == value)
            {
              ret_array.push(c_array[i]);
              break;
            }
          }
        }
        else if (typeCheck(c_array[i][key][0], ContactAddress))
        {
          for ( var j = 0; j < c_array[i][key].length; j++)
          {
            //use of regular expression to search into formatted address string
            var rex = new RegExp("\\b" + value + "\\b", "gim");
            if (rex.test(c_array[i][key][j]["formatted"]))
            {
              ret_array.push(c_array[i]);
              break;
            }
          }
        }
        else if (typeCheck(c_array[i][key][0], ContactOrganization))
        {
          for ( var j = 0; j < c_array[i][key].length; j++)
          {
            //use of regular expression to search into formatted address string
            var rex = new RegExp("\\b" + value + "\\b", "gim");
            if (rex.test(c_array[i][key][j]["type"]) || rex.test(c_array[i][key][j]["name"]) ||
              rex.test(c_array[i][key][j]["department"]) || rex.test(c_array[i][key][j]["title"]))
            {
              ret_array.push(c_array[i]);
              break;
            }
          }
        }
      }
    }
  }
//    else if (typeCheck(key, Array)) //Key is in format ["name" "familyName"] //TODO only if we want to add more search options
//    {
//
//    }
//  }
  return ret_array;
}

/**
 * Check types of object obj Tries to uniform typeof and instanceof, literals
 * and Objects e.g. String or string type may be either a string or a function
 */
function typeCheck(obj, type)
{
  var res = false;
  if (typeof (type) == "string")
  {
    if (typeof (obj) == type)
      res = true;
  }
  else if (typeof (type) == "function")
  {
    if (obj instanceof type)
      res = true;
  }
  return res;
}

/**
 * Compare a string with a date to a Date obj Needed to compare only Year, Month
 * and Date without making a mess with hours and timezones e.g. birthdays
 */
function stringEqDate(dateStr, date)
{
  var tmp = new Date(dateStr);
  return (tmp.getFullYear() == date.getFullYear() && tmp.getMonth() == date.getMonth() && tmp.getDate() == date
    .getDate())
}

// //////////////////////ERROR HANDLING
this.UNKNOWN_ERROR = 0;

this.INVALID_ARGUMENT_ERROR = 1;

this.TIMEOUT_ERROR = 2;

this.PENDING_OPERATION_ERROR = 3;

this.IO_ERROR = 4;

this.NOT_SUPPORTED_ERROR = 5;

this.PERMISSION_DENIED_ERROR = 20;

/**
 * code should assume one of the values above
 */
function ContactError(_code)
{
  this.code = _code; // readonly ?
};
