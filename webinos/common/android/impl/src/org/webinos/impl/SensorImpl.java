package org.webinos.impl;

import org.webinos.api.PendingOperation;
import org.webinos.api.sensor.ConfigureSensorCB;
import org.webinos.api.sensor.ConfigureSensorOptions;
import org.webinos.api.sensor.SensorError;
import org.webinos.api.sensor.SensorErrorCB;
import org.webinos.api.sensor.SensorManager;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.idl.IDLInterface;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;
import org.meshpoint.anode.type.IValue;

import android.content.Context;

public class SensorImpl extends SensorManager implements IModule {

	private Context androidContext;

	/*****************************
	 * SensorManager methods
	 *****************************/
	@Override
	public PendingOperation configureSensor(ConfigureSensorOptions options,
			ConfigureSensorCB successCB, SensorErrorCB errorCB)
			throws SensorError {
		// TODO Auto-generated method stub
		return null;
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
