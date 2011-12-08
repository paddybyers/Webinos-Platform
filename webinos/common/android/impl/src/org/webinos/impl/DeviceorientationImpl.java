package org.webinos.impl;

import org.webinos.api.deviceorientation.DeviceorientationManager;
import org.webinos.api.deviceorientation.MotionCB;
import org.webinos.api.deviceorientation.OrientationCB;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;
import org.meshpoint.anode.type.IValue;

import android.content.Context;

public class DeviceorientationImpl extends DeviceorientationManager implements
		IModule {

	private Context androidContext;
	
	/*****************************
	 * DeviceorientationManager methods
	 *****************************/
	@Override
	public void watchOrientation(OrientationCB orientationCb) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void watchMotion(MotionCB motionCb) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void unwatchOrientation() {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void unwatchMotion() {
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
