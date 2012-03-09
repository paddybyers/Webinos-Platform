package org.webinos.api.discovery;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.java.Base;
import org.webinos.api.PendingOperation;
import org.webinos.api.messaging.Message;

public abstract class Service extends Base {

	private static short classId = Env.getInterfaceId(Service.class);
	protected Service() { super(classId); }
	
	public static final int SERVICE_INITATING = 0;             
	public static final int SERVICE_AVAILABLE = 1;
	public static final int SERVICE_UNAVAILABLE = 2;
    
    public int  state;
    public String api;
    public String id;
    public String displayName;
    public String description;
    public String icon;
    
    //added to collect HRM data
    public long[] values;
    
    public abstract PendingOperation bind(BindCallback bindCallBack, String serviceId) 
    		throws DiscoveryError;
    public abstract void unbind() throws DiscoveryError;
    
    public void finalize() {
    	System.out.println("finalize");
    }
}
