package org.webinos.impl;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;
import org.meshpoint.anode.type.IValue;
import org.webinos.api.calendar.CalendarErrorCB;
import org.webinos.api.calendar.CalendarEventSuccessCB;
import org.webinos.api.calendar.CalendarFindOptions;
import org.webinos.api.calendar.CalendarManager;

import android.content.Context;

public class CalendarImpl extends CalendarManager implements IModule {

	private Context androidContext;
	
	/*****************************
	 * CalendarManager methods
	 *****************************/
	@Override
	public void findEvents(CalendarEventSuccessCB successCB,
			CalendarErrorCB errorCB, CalendarFindOptions options) {
		// TODO Auto-generated method stub
		
	}

	/*****************************
	 * IModule methods
	 *****************************/
	@Override
	public IValue startModule(IModuleContext ctx) {
		androidContext = ((AndroidContext)ctx).getAndroidContext();
		/*
		 * perform any module initialisation here ...
		 */
		return this;
	}

	@Override
	public void stopModule() {
		/*
		 * perform any module shutdown here ...
		 */
	}
}
