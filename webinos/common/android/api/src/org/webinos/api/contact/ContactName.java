package org.webinos.api.contact;

import org.meshpoint.anode.idl.ValueType;

public class ContactName implements ValueType {
	public String formatted;
    public String familyName;
    public String givenName;
    public String middleName;
    public String honorificPrefix;
    public String honorificSuffix;
}
