package org.webinos.api.calendar;

import org.meshpoint.anode.idl.Dictionary;

public class CalendarEvent implements Dictionary {
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
}
