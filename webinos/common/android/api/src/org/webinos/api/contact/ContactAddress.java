package org.webinos.api.contact;

import org.meshpoint.anode.idl.Dictionary;

public class ContactAddress implements Dictionary {
	public boolean pref;
	public String type;
	public String formatted;
	public String streetAddress;
	public String locality;
	public String region;
	public String postalCode;
	public String country;
}
