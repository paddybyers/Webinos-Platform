package org.webinos.api.geolocation;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.java.Base;

public abstract class GeolocationManager extends Base {
	private static short classId = Env.getInterfaceId(GeolocationManager.class);
	protected GeolocationManager() { super(classId); }

	public abstract void getCurrentPosition(PositionCallback successCallback, PositionErrorCallback errorCallback, PositionOptions options);
	public abstract long watchPosition(PositionCallback successCallback, PositionErrorCallback errorCallback, PositionOptions options);
	public abstract void clearWatch(long id);
}
