package org.webinos.api.contact;

import java.util.Date;

import org.meshpoint.anode.idl.ValueType;

public class ContactFindOptions implements ValueType {
	public String filter;
    public Boolean multiple;
    public Date updatedSince;
}
