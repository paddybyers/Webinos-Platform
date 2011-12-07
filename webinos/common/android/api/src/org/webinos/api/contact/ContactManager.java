package org.webinos.api.contact;

import org.meshpoint.anode.idl.IDLInterface;
import org.meshpoint.anode.java.Base;
import org.webinos.api.PendingOperation;

public abstract class ContactManager extends Base {

	protected ContactManager(IDLInterface iface) { super(iface); }

	public abstract PendingOperation find(String[] fields, ContactFindCB successCB, ContactErrorCB errorCB, ContactFindOptions options);
}
