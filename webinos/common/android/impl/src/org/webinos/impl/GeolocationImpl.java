package org.webinos.impl;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;
import org.webinos.api.geolocation.GeolocationManager;
import org.webinos.api.geolocation.PositionCallback;
import org.webinos.api.geolocation.PositionErrorCallback;
import org.webinos.api.geolocation.PositionOptions;

import android.content.Context;

public class GeolocationImpl extends GeolocationManager implements IModule {

	private Context androidContext;
	
	/*****************************
	 * GeolocationManager methods
	 *****************************/
	@Override
	public void getCurrentPosition(PositionCallback successCallback,
			PositionErrorCallback errorCallback, PositionOptions options) {
		// TODO Auto-generated method stub

	}

	@Override
	public long watchPosition(PositionCallback successCallback,
			PositionErrorCallback errorCallback, PositionOptions options) {
		// TODO Auto-generated method stub
		return 0;
	}

	@Override
	public void clearWatch(long id) {
		// TODO Auto-generated method stub

	}

	/*****************************
	 * IModule methods
	 *****************************/
	@Override
	public Object startModule(IModuleContext ctx) {
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
