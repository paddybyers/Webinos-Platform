package org.webinos.api;

import org.meshpoint.anode.java.Base;

public abstract class PendingOperation extends Base {

	protected PendingOperation(short classId) { super(classId); }
	public abstract void cancel();
}