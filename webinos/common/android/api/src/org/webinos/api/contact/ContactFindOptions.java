package org.webinos.api.contact;

import java.util.Date;

import org.meshpoint.anode.idl.Dictionary;

public class ContactFindOptions implements Dictionary {
	public String filter;
    public Boolean multiple;
    public Date updatedSince;
}
