package org.webinos.api.calendar;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.java.Base;

public abstract class CalendarManager extends Base {
	private static short classId = Env.getInterfaceId(CalendarManager.class);
	protected CalendarManager() { super(classId); }

	public abstract void findEvents (CalendarEventSuccessCB successCB, CalendarErrorCB errorCB, CalendarFindOptions options);
}
