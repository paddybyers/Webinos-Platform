package org.webinos.api.sensor;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.java.Base;
import org.webinos.api.PendingOperation;

public abstract class FindSensorsManager extends Base {
  private static short classId = Env.getInterfaceId(FindSensorsManager.class);
  protected FindSensorsManager() { super(classId); }

  public abstract PendingOperation findSensors(String sensorType, SensorFindCB successCB, SensorErrorCB errorCB);
}
