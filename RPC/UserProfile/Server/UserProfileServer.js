
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

var userProfileIntModule = new RPCWebinosService({
	api:'UserProfileInt',
	displayName:'UserProfileInt',
	description:''
});
userProfileIntModule.findProf = profileIntFind;
userProfileIntModule.createProf = profileIntCreate;
userProfileIntModule.replaceProf = profileIntReplace;
userProfileIntModule.deleteProf = profileIntDelete;
webinos.rpc.registerObject(userProfileIntModule);



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////         USER PROFILE        ////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var userProfileModule = new RPCWebinosService({
	api:'UserProfile',
	displayName:'UserProfile',
	description:''
});

var preferredUsername = {}; // attribute DOMString? preferredUsername;
var socialProfiles = {}; //attribute SocialNetworkProfile[]? socialProfiles;

userProfileModule.preferredUsername=preferredUsername;
userProfileModule.socialProfiles=socialProfiles;

webinos.rpc.registerObject(userProfileModule);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////         SOCIAL NETWORK PROFILE        //////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


var socialNetworkProfileModule = new RPCWebinosService({
	api:'SocialNetworkProfile',
	displayName:'SocialNetworkProfile',
	description:''
});

var pref = {}; // attribute boolean pref;
 
var socialNetworkProvider = {}; // attribute DOMString? socialNetworkProvider;
  
var userId = {}; // attribute DOMString? userId;

socialNetworkProfileModule.pref=pref;
socialNetworkProfileModule.socialNetworkProvider=socialNetworkProvider;
socialNetworkProfileModule.userId=userId;

webinos.rpc.registerObject(socialNetworkProfileModule);

