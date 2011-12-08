package org.webinos.api.calendar;

import org.meshpoint.anode.idl.ValueType;

public class CalendarEventFilter implements ValueType {
	/* from CalendarEvent */
	public String id;
	public String description;
	public String location;
	public String summary;
	public String start;
	public String end;
	public String status;
	public String transparency;
	public CalendarRepeatRule recurrence;
	public String reminder;
	/* from CalendarEventFilter */
	public String startBefore;
	public String startAfter;
	public String endBefore;
	public String endAfter;
}
