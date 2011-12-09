package org.webinos.impl;

import java.util.List;

import org.webinos.api.deviceorientation.Acceleration;
import org.webinos.api.deviceorientation.DeviceorientationManager;
import org.webinos.api.deviceorientation.MotionCB;
import org.webinos.api.deviceorientation.MotionEvent;
import org.webinos.api.deviceorientation.OrientationCB;
import org.webinos.api.deviceorientation.OrientationEvent;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;
import org.meshpoint.anode.type.IValue;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

public class DeviceorientationImpl extends DeviceorientationManager implements
		IModule {

	private Context androidContext;
	private SensorManager sensorManager;

	private OrientationCB orientationCb;
	private OrientationListener orientationListener;
	private Sensor orientationSensor;

	private MotionCB motionCb;
	private AccelerometerListener accelerometerListener;
	private Sensor accelerometerSensor;
	private long lastEventTime;

	private static final String TAG = "org.webinos.impl.DeviceorientationImpl";
	
	/*****************************
	 * DeviceorientationManager methods
	 *****************************/
	@Override
	public synchronized void watchOrientation(OrientationCB orientationCb) {
		this.orientationCb = orientationCb;
		orientationListener = new OrientationListener();
		sensorManager.registerListener(orientationListener, orientationSensor, SensorManager.SENSOR_DELAY_FASTEST);
	}

	@Override
	public synchronized void watchMotion(MotionCB motionCb) {
		this.motionCb = motionCb;
		accelerometerListener = new AccelerometerListener();
		sensorManager.registerListener(accelerometerListener, accelerometerSensor, SensorManager.SENSOR_DELAY_FASTEST);
		lastEventTime = System.currentTimeMillis();
	}

	@Override
	public synchronized void unwatchOrientation() {
		if(orientationListener != null) {
			sensorManager.unregisterListener(orientationListener);
			orientationListener = null;
		}
	}

	@Override
	public synchronized void unwatchMotion() {
		if(accelerometerListener != null) {
			sensorManager.unregisterListener(accelerometerListener);
			accelerometerListener = null;
		}
	}

	/*****************************
	 * IModule methods
	 *****************************/
	@Override
	public IValue startModule(IModuleContext ctx) {
		androidContext = ((AndroidContext)ctx).getAndroidContext();
		sensorManager = (SensorManager)androidContext.getSystemService(Context.SENSOR_SERVICE);
		List<Sensor> sensorList = sensorManager.getSensorList(Sensor.TYPE_ORIENTATION);
		if(sensorList.isEmpty())
			Env.logger.e(TAG, "No orientation device found");
		else
			orientationSensor = sensorList.get(0);
		sensorList = sensorManager.getSensorList(Sensor.TYPE_ACCELEROMETER);
		if(sensorList.isEmpty())
			Env.logger.e(TAG, "No accelerometer device found");
		else
			accelerometerSensor = sensorList.get(0);
		
		if(accelerometerSensor == null && orientationSensor == null) {
			Env.logger.e(TAG, "No orientation or accelerometer device found - aborting");
			return null;
		}
		return this;
	}

	@Override
	public void stopModule() {
		unwatchOrientation();
		unwatchMotion();
	}

	/*****************************
	 * Helpers
	 *****************************/
	
	class OrientationListener implements SensorEventListener {

		@Override
		public void onAccuracyChanged(Sensor arg0, int arg1) {}

		@Override
		public void onSensorChanged(SensorEvent sensorEvent) {
			OrientationEvent ev = new OrientationEvent();
			ev.alpha = sensorEvent.values[0];
			ev.beta = sensorEvent.values[1];
			ev.gamma = sensorEvent.values[2];
			ev.absolute = true;
			synchronized(DeviceorientationImpl.this) {
				if(orientationCb != null)
					orientationCb.onOrientationEvent(ev);
			}
		}
	}
	
	class AccelerometerListener implements SensorEventListener {

		@Override
		public void onAccuracyChanged(Sensor arg0, int arg1) {}

		@Override
		public void onSensorChanged(SensorEvent sensorEvent) {
			MotionEvent ev = new MotionEvent();
			Acceleration acc = new Acceleration();
			Acceleration g_acc = new Acceleration();
			acc.x = g_acc.x = sensorEvent.values[SensorManager.AXIS_X - 1];
			acc.y = g_acc.y = sensorEvent.values[SensorManager.AXIS_Y - 1];
			acc.z = sensorEvent.values[SensorManager.AXIS_Z - 1];
			g_acc.z = acc.z + 1;
			ev.acceleration = acc;
			ev.accelerationIncludingGravity = g_acc;
			/* FIXME: work out how to implement rotation */
			synchronized(DeviceorientationImpl.this) {
				long thisEventTime = System.currentTimeMillis();
				ev.interval = (double)(thisEventTime - lastEventTime);
				if(motionCb != null)
					motionCb.onMotionEvent(ev);
				lastEventTime = thisEventTime;
			}
		}		
	}
}
