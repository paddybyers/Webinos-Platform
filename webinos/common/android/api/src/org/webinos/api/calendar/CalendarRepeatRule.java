package org.webinos.api.calendar;

import org.meshpoint.anode.idl.Dictionary;

public class CalendarRepeatRule implements Dictionary {
	public String frequency;
	public Integer interval;
	public String expires;
	public String[] exceptionDates;
	public int[] daysInWeek;
	public int[] daysInMonth;
	public int [] daysInYear;
	public int [] weeksInMonth;
	public int [] monthsInYear;
}
