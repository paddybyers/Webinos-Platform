package org.webinos.api.calendar;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.idl.IDLInterface;
import org.meshpoint.anode.java.Base;

public abstract class CalendarManager extends Base {
	private static IDLInterface iface = Env.getCurrent().getInterfaceManager().getByClass(CalendarManager.class);
	protected CalendarManager() { super(iface); }

	public abstract void findEvents (CalendarEventSuccessCB successCB, CalendarErrorCB errorCB, CalendarFindOptions options);
}
