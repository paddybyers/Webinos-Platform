package org.webinos.impl;

import org.webinos.api.contact.Contact;

public class ContactImpl extends Contact {
	private ContactManagerImpl mgr;

	ContactImpl(ContactManagerImpl mgr) {
		this.mgr = mgr;
	}
	
}
