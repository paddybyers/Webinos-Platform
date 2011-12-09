package org.webinos.api.contact;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.idl.IDLInterface;
import org.meshpoint.anode.java.Base;
import org.webinos.api.PendingOperation;

public abstract class ContactManager extends Base {
	private static IDLInterface iface = Env.getCurrent().getInterfaceManager().getByClass(ContactManager.class);
	protected ContactManager() { super(iface); }

	public abstract PendingOperation find(String[] fields, ContactFindCB successCB, ContactErrorCB errorCB, ContactFindOptions options);
}
