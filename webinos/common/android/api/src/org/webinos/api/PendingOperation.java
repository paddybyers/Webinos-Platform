package org.webinos.api;

import org.meshpoint.anode.idl.IDLInterface;
import org.meshpoint.anode.java.Base;

public abstract class PendingOperation extends Base {

	protected PendingOperation(IDLInterface iface) { super(iface); }
	public abstract void cancel();
}