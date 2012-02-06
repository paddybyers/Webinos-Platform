package org.webinos.api.discovery;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.idl.IDLInterface;
import org.meshpoint.anode.java.Base;

import org.webinos.api.PendingOperation;

public abstract class DiscoveryManager extends Base {

	private static short classId = Env.getInterfaceId(DiscoveryManager.class);
	protected DiscoveryManager() { super(classId); }
	
	public abstract PendingOperation findServices(ServiceType serviceType, FindCallback findCallBack, Options options, Filter filter) throws DiscoveryError;  
    public abstract String getServiceId(String serviceType) throws DiscoveryError;
	public abstract Service createService() throws DiscoveryError;
}
