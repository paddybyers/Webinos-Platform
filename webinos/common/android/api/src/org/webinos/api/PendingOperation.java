package org.webinos.api;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.java.Base;

public abstract class PendingOperation extends Base {

	private static short classId = Env.getInterfaceId(PendingOperation.class);
	protected PendingOperation() { super(classId); }
	public abstract void cancel();
}