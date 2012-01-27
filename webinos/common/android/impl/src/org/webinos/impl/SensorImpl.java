/****************
* TODO!!!
*
* Implement configureSensor ().
* Use configured rate when androidSensorManager.registerListener is called.
* Let service discovery decide which sensors are searched for with androidSensorManager.getSensorList().
*
*
*********************/



package org.webinos.impl;

import java.util.List;

import org.webinos.api.PendingOperation;
import org.webinos.api.sensor.SensorCB;
import org.webinos.api.sensor.ConfigureSensorCB;
import org.webinos.api.sensor.ConfigureSensorOptions;
import org.webinos.api.sensor.SensorError;
import org.webinos.api.sensor.SensorErrorCB;
import org.webinos.api.sensor.FindSensorsManager;
import org.webinos.api.sensor.SensorFindCB;
import org.webinos.api.sensor.SensorFindErrorCB;
import org.webinos.api.sensor.SensorFindError;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEventListener;
import android.util.Log;

public class SensorImpl extends org.webinos.api.sensor.SensorManager implements IModule {

	private Context androidContext;
	private android.hardware.SensorManager androidSensorManager;
	
	private WebinosSensorListener webinosSensorListener;
	private List<Sensor> androidSensorList;
	
	private static final String TAG = "org.webinos.impl.SensorImpl";
	
	
	/*****************************
	 * Webinos Sensor methods
	 *****************************/
	@Override
	public PendingOperation configureSensor(ConfigureSensorOptions options,
			ConfigureSensorCB successCB, SensorErrorCB errorCB)
			throws SensorError {
		// TODO Auto-generated method stub
		return null;
	}
	
	/*
	 * Temporary solution. The first sensor found matching the requested sensor type is registered.
	 * TODO: Connect this with service discovery instead
	 */
  @Override
	public synchronized void watchSensor(String api, SensorCB sensorCb) {
		  
	  int sensorType = -100;
	  
	  if ("http://webinos.org/api/sensors.accelerometer".equals(api))
	    sensorType = Sensor.TYPE_ACCELEROMETER;
 	  else if ("http://webinos.org/api/sensors.gravity".equals(api))
	    sensorType = Sensor.TYPE_GRAVITY;
 	  else if ("http://webinos.org/api/sensors.orientation".equals(api))
	    sensorType = Sensor.TYPE_ORIENTATION;	    
 	  else if ("http://webinos.org/api/sensors.gyro".equals(api))
	    sensorType = Sensor.TYPE_GYROSCOPE;	  
 	  else if ("http://webinos.org/api/sensors.light".equals(api))
	    sensorType = Sensor.TYPE_LIGHT;
 	  else if ("http://webinos.org/api/sensors.linearacceleration".equals(api))
	    sensorType = Sensor.TYPE_LINEAR_ACCELERATION;	    
 	  else if ("http://webinos.org/api/sensors.magneticfield".equals(api))
	    sensorType = Sensor.TYPE_MAGNETIC_FIELD;
 	  else if ("http://webinos.org/api/sensors.pressure".equals(api))
	    sensorType = Sensor.TYPE_PRESSURE;	    	    
 	  else if ("http://webinos.org/api/sensors.proximity".equals(api))
	    sensorType = Sensor.TYPE_PROXIMITY;	 	    
 	  else if ("http://webinos.org/api/sensors.rotationvector".equals(api))
	    sensorType = Sensor.TYPE_ROTATION_VECTOR;	 	    
 	  else if ("http://webinos.org/api/sensors.temperature".equals(api))
	    sensorType = Sensor.TYPE_TEMPERATURE; 
 	  else if ("http://webinos.org/api/sensors".equals(api))
	    sensorType = Sensor.TYPE_ALL; 	    	  
 	  else
	    Log.e(TAG, "Ilegal sensor type selected");  
	  
	  if ((sensorType != -100)&&(sensorType != Sensor.TYPE_ALL)){  

  		  for (Sensor androidSensor : androidSensorList) {
	  	     if (androidSensor.getType() == sensorType) {
	  	       (webinosSensorListener = new WebinosSensorListener(sensorCb)).start();
		         androidSensorManager.registerListener(webinosSensorListener, androidSensor, android.hardware.SensorManager.SENSOR_DELAY_UI);
	  	       return;
	  	     }	
	  	  }	
	  }	
		else if ((sensorType != -100) && (sensorType == Sensor.TYPE_ALL)) {
		   
		    for (Sensor androidSensor : androidSensorList) {
		  	  (webinosSensorListener = new WebinosSensorListener(sensorCb)).start();
		      androidSensorManager.registerListener(webinosSensorListener, androidSensor, android.hardware.SensorManager.SENSOR_DELAY_UI);
	  	  }			   		   
		}
	}
	
	@Override
	public synchronized void unwatchSensor() {
		if(webinosSensorListener != null) {
			androidSensorManager.unregisterListener(webinosSensorListener);
			webinosSensorListener.kill();
			webinosSensorListener = null;
		}
	}
	

	/*****************************
	 * IModule methods
	 *****************************/
	@Override
	public Object startModule(IModuleContext ctx) {
		Log.e(TAG, "Sensor module started");
		androidContext = ((AndroidContext)ctx).getAndroidContext();
		androidSensorManager = (android.hardware.SensorManager)androidContext.getSystemService(Context.SENSOR_SERVICE);
		
		/* Get sensor list for all sensors in device 
		 * TODO Need to be connected with Webinos service discovery
		 */
		androidSensorList = androidSensorManager.getSensorList(Sensor.TYPE_ALL);
		if(androidSensorList.isEmpty())
			Log.e(TAG, "No sensor found");
					
		return this;
	}

	@Override
	public void stopModule() {
		Log.e(TAG, "Sensor module stopped");
		unwatchSensor();
		
	}
	
	
	/*****************************
	 * Helpers
	 *****************************/
	 
	 class WebinosSensorListener extends Thread implements SensorEventListener {
	 
	 	private SensorCB sensorCb;
		private org.webinos.api.sensor.SensorEvent webinosPendingEvent;
		private boolean isKilled;
		private Sensor androidSensor;
		private int sensorType;
		
		
	  private WebinosSensorListener(SensorCB sensorCb) {
			this.sensorCb = sensorCb;
		}

		private void kill() {
			isKilled = true;
			interrupt();
		}
		
		private synchronized void postSensor(org.webinos.api.sensor.SensorEvent webinosSensorEvent) {
			webinosPendingEvent = webinosSensorEvent;
			/* Execute thread */
			notify();  
		}
	 
	 /* run() excutes the active part of the class' code */
	 	@Override
		public void run() {
			while(!isKilled) {
				synchronized(this) {
					try {
						wait();
					} catch(InterruptedException ie) { break; }
					if(webinosPendingEvent != null) {
						org.webinos.api.sensor.SensorEvent webinosSensorEvent = webinosPendingEvent;
						webinosPendingEvent = null;
						if(sensorCb != null)
							sensorCb.onSensorEvent(webinosSensorEvent);
					}
				}
			}
		}
		
		/* 
		 * TBD what to do here 
		 */		
		@Override
		public void onAccuracyChanged(Sensor arg0, int arg1) {}

		@Override
		public void onSensorChanged(android.hardware.SensorEvent androidSensorEvent) {
			org.webinos.api.sensor.SensorEvent webinosSensorEvent = new org.webinos.api.sensor.SensorEvent();
			webinosSensorEvent.sensorValues = new double[3];
			Sensor androidSensor = androidSensorEvent.sensor;
			sensorType = androidSensor.getType();
			
			/* Match Android sensor type to Webinos sensor type */			
			if (sensorType == Sensor.TYPE_ACCELEROMETER)
			  webinosSensorEvent.sensorType = "http://webinos.org/api/sensors.accelerometer";
			else if (sensorType == Sensor.TYPE_GRAVITY)
			  webinosSensorEvent.sensorType = "http://webinos.org/api/sensors.gravity";
			else if (sensorType == Sensor.TYPE_ORIENTATION)
			  webinosSensorEvent.sensorType = "http://webinos.org/api/sensors.orientation";			  
			else if (sensorType == Sensor.TYPE_GYROSCOPE)
			  webinosSensorEvent.sensorType = "http://webinos.org/api/sensors.gyro";			  
			else if (sensorType == Sensor.TYPE_LIGHT)
			  webinosSensorEvent.sensorType = "http://webinos.org/api/sensors.light";
			else if (sensorType == Sensor.TYPE_LINEAR_ACCELERATION)
			  webinosSensorEvent.sensorType = "http://webinos.org/api/sensors.linearacceleration";
			else if (sensorType == Sensor.TYPE_MAGNETIC_FIELD)
			  webinosSensorEvent.sensorType = "http://webinos.org/api/sensors.magneticfield";
			else if (sensorType == Sensor.TYPE_PRESSURE)
			  webinosSensorEvent.sensorType = "http://webinos.org/api/sensors.pressure";
			else if (sensorType == Sensor.TYPE_PROXIMITY)
			  webinosSensorEvent.sensorType = "http://webinos.org/api/sensors.proximity";		
			else if (sensorType == Sensor.TYPE_ROTATION_VECTOR)
			  webinosSensorEvent.sensorType = "http://webinos.org/api/sensors.rotationvector";		
			else if (sensorType == Sensor.TYPE_TEMPERATURE)
			  webinosSensorEvent.sensorType = "http://webinos.org/api/sensors.temperature"; 			  
			  
			/* Set to same as sensor type temporary. Should be a unique sensor id */  
			webinosSensorEvent.sensorId = webinosSensorEvent.sensorType;  
			
			/* Set accuracy */
			if (androidSensorEvent.accuracy == android.hardware.SensorManager.SENSOR_STATUS_ACCURACY_HIGH)
			  webinosSensorEvent.accuracy = org.webinos.api.sensor.SensorEvent.SENSOR_STATUS_ACCURACY_HIGH;
			else if (androidSensorEvent.accuracy == android.hardware.SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM)
			  webinosSensorEvent.accuracy = org.webinos.api.sensor.SensorEvent.SENSOR_STATUS_ACCURACY_MEDIUM;
			else if (androidSensorEvent.accuracy == android.hardware.SensorManager.SENSOR_STATUS_ACCURACY_LOW)
			  webinosSensorEvent.accuracy = org.webinos.api.sensor.SensorEvent.SENSOR_STATUS_ACCURACY_LOW;
			else if (androidSensorEvent.accuracy == android.hardware.SensorManager.SENSOR_STATUS_UNRELIABLE)
			  webinosSensorEvent.accuracy = org.webinos.api.sensor.SensorEvent.SENSOR_STATUS_UNRELIABLE;
			  
			/* Set rate to configured rate, temporary set to SENSOR_DELAY_UI */
			webinosSensorEvent.rate = ConfigureSensorOptions.SENSOR_DELAY_UI;  
			
			/* Set to true, i.e. events fired when value changes */
			webinosSensorEvent.interrupt = true;						  
			  			   
			/* Set sensor values. Specification also defined normalized values between 0 and 1 but 
			   consider skipping this in the specification */  
	
			webinosSensorEvent.sensorValues[0] = androidSensorEvent.values[0];
			webinosSensorEvent.sensorValues[1] = androidSensorEvent.values[1];
			webinosSensorEvent.sensorValues[2] = androidSensorEvent.values[2];

			postSensor(webinosSensorEvent);
		}
	 
	 }
	
}
