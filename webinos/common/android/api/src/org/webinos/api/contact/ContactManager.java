package org.webinos.api.contact;

import java.util.HashMap;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.java.Base;
import org.webinos.api.PendingOperation;

public abstract class ContactManager extends Base {
	private static short classId = Env.getInterfaceId(ContactManager.class);
	protected ContactManager() { super(classId); }

	public abstract PendingOperation find(HashMap<String, String> fields, ContactFindCB successCB, ContactErrorCB errorCB, ContactFindOptions options);
}
