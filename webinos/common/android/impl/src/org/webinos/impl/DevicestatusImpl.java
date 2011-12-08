package org.webinos.impl;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;
import org.meshpoint.anode.type.IValue;
import org.webinos.api.DeviceAPIError;
import org.webinos.api.ErrorCallback;
import org.webinos.api.PendingOperation;
import org.webinos.api.devicestatus.DevicestatusManager;
import org.webinos.api.devicestatus.PropertyRef;
import org.webinos.api.devicestatus.PropertyValueSuccessCallback;
import org.webinos.api.devicestatus.WatchOptions;

import android.content.Context;

public class DevicestatusImpl extends DevicestatusManager implements IModule {

	private Context androidContext;

	/*****************************
	 * DevicestatusManager methods
	 *****************************/
	@Override
	public String[] getComponents(String aspect) throws DeviceAPIError {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public boolean isSupported(String aspect, String property)
			throws DeviceAPIError {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public PendingOperation getPropertyValue(
			PropertyValueSuccessCallback successCallback,
			ErrorCallback errorCallback, PropertyRef prop)
			throws DeviceAPIError {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public int watchPropertyChange(
			PropertyValueSuccessCallback successCallback,
			ErrorCallback errorCallback, PropertyRef prop, WatchOptions options)
			throws DeviceAPIError {
		// TODO Auto-generated method stub
		return 0;
	}

	@Override
	public void clearPropertyChange(int watchHandler) throws DeviceAPIError {
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
