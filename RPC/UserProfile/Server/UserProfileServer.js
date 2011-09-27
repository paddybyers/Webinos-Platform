
var w3cfile = require('./../../impl_file.js');
if (typeof webinos === 'undefined') var webinos = {};
webinos.rpc = require('./../../rpc.js');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////    USER PROFILE INTERFACE   ////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function profileIntFind (params, successCB, errorCB)
{		
var myCars=new Array(); // regular array (add an optional integer
myCars[0]="Saab";       // argument to control array's size)
myCars[1]="Volvo";
myCars[2]="BMW";
myCars[3]=	params;
successCB(myCars);
}
function profileIntCreate (params, successCB, errorCB)
{	successCB(47);
}
function profileIntReplace (params, successCB, errorCB)
{	successCB(48);
}
function profileIntDelete (params, successCB, errorCB)
{	successCB(49);
}

userProfileInt = {};
userProfileInt.findProf = profileIntFind;
userProfileInt.createProf = profileIntCreate;
userProfileInt.replaceProf = profileIntReplace;
userProfileInt.deleteProf = profileIntDelete;
webinos.rpc.registerObject("UserProfileInt", userProfileInt);



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////         USER PROFILE        ////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


userProfile = {};

var preferredUsername = {}; // attribute DOMString? preferredUsername;
var socialProfiles = {}; //attribute SocialNetworkProfile[]? socialProfiles;

userProfile.preferredUsername=preferredUsername;
userProfile.socialProfiles=socialProfiles;

webinos.rpc.registerObject("UserProfile", userProfile);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////         SOCIAL NETWORK PROFILE        //////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


socialNetworkProfile = {};

var pref = {}; // attribute boolean pref;
 
var socialNetworkProvider = {}; // attribute DOMString? socialNetworkProvider;
  
var userId = {}; // attribute DOMString? userId;

socialNetworkProfile.pref=pref;
socialNetworkProfile.socialNetworkProvider=socialNetworkProvider;
socialNetworkProfile.userId=userId;

webinos.rpc.registerObject("SocialNetworkProfile", socialNetworkProfile);

