package org.webinos.impl;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;
import org.webinos.api.DeviceAPIError;
import org.webinos.api.ErrorCallback;
import org.webinos.api.PendingOperation;
import org.webinos.api.SuccessCallback;
import org.webinos.api.deviceinteraction.DeviceInteractionManager;

import android.content.Context;

public class DeviceInteractionImpl extends DeviceInteractionManager implements IModule {

	private Context androidContext;
	
	/*****************************
	 * DeviceInteractionManager methods
	 *****************************/
	@Override
	public PendingOperation startNotify(SuccessCallback successCallback,
			ErrorCallback errorCallback, int duration) throws DeviceAPIError {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public void stopNotify() {
		// TODO Auto-generated method stub
		
	}

	@Override
	public PendingOperation startVibrate(SuccessCallback successCallback,
			ErrorCallback errorCallback, Integer duration)
			throws DeviceAPIError {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public void stopVibrate() {
		// TODO Auto-generated method stub
		
	}

	@Override
	public PendingOperation lightOn(SuccessCallback successCallback,
			ErrorCallback errorCallback, int duration) throws DeviceAPIError {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public void lightOff() {
		// TODO Auto-generated method stub
		
	}

	@Override
	public PendingOperation setWallpaper(SuccessCallback successCallback,
			ErrorCallback errorCallback, String fileName) throws DeviceAPIError {
		// TODO Auto-generated method stub
		return null;
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
