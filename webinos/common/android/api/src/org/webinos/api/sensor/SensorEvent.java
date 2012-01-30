package org.webinos.api.sensor;

import org.meshpoint.anode.idl.Dictionary;

public class SensorEvent implements Dictionary {
	public static final int SENSOR_STATUS_ACCURACY_HIGH = 4;
	public static final int SENSOR_STATUS_ACCURACY_MEDIUM = 3;
	public static final int SENSOR_STATUS_ACCURACY_LOW = 2;
	public static final int SENSOR_STATUS_UNRELIABLE = 1;
	public static final int SENSOR_STATUS_UNAVAILABLE = 0;
	
	public String sensorType;
	public String sensorId;
	public int accuracy;
	public int rate;
	public boolean interrupt;
	public float[] sensorValues;
}
