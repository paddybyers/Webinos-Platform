var openid = require('openid');

var extensions = [
	new openid.AttributeExchange({
		"http://axschema.org/contact/country/home":	"required",
		"http://axschema.org/namePerson/first":		"required",
		"http://axschema.org/pref/language":		"required",
		"http://axschema.org/namePerson/last":		"required",
		"http://axschema.org/contact/email":		"required",
		"http://axschema.org/namePerson/friendly":	"required",
		"http://axschema.org/namePerson":			"required",
		"http://axschema.org/media/image/default":	"required",
		"http://axschema.org/person/gender/":		"required"
	})
];


exports.verificationURL = function (url) {
	exports.relyingParty = new openid.RelyingParty(
		url, // Verification URL (yours)
		null, // Realm (optional, specifies realm for OpenID authentication)
		false, // Use stateless verification
		false, // Strict mode
		extensions // List of extensions to enable and include
	);
}
