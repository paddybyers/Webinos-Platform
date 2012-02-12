package org.webinos.api.sensor;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.java.Base;
import org.webinos.api.PendingOperation;

public abstract class SensorManager extends Base {
  private static short classId = Env.getInterfaceId(SensorManager.class);
  protected SensorManager() { super(classId); }


  public static final int SERVICE_INITATING = 0;
  public static final int SERVICE_AVAILABLE = 1;
  public static final int SERVICE_UNAVAILABLE = 2;
		
  public int    state;
  public String api;
  public String id;
  public String displayName;
  public String description;
  public String icon;

  public Double maximumRange;
  public Integer minDelay;
  public Double power;
  public Double resolution;
  public String vendor;  
  public Integer version; 

  public abstract void watchSensor(String api, int rate, SensorCB sensorCb, SensorErrorCB errorCB);
  public abstract void unwatchSensor();

}
