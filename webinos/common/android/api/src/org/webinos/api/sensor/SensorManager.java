package org.webinos.api.sensor;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.java.Base;
import org.webinos.api.PendingOperation;

public abstract class SensorManager extends Base {
	private static short classId = Env.getInterfaceId(SensorManager.class);
	protected SensorManager() { super(classId); }
	
	public Double maximumRange;
    public Integer minDelay;
    public Float power;
    public Float resolution;
    public String vendor;  
    public Integer version; 

    public abstract PendingOperation configureSensor(ConfigureSensorOptions options, ConfigureSensorCB successCB, SensorErrorCB errorCB)
        throws SensorError;
}
