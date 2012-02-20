/*******************************************************************************
*  Code contributed to the webinos project
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
*
* Copyright 2012 Torsec -Computer and network security group-
* Politecnico di Torino
******************************************************************************/

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
