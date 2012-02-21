package org.webinos.app.wrt.mgr;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.java.Base;

public abstract class WidgetManager extends Base {
	private static short classId = Env.getInterfaceId(WidgetManager.class);
	protected WidgetManager() { super(classId); }
	public abstract void setWidgetProcessor(WidgetProcessor processor);
}
