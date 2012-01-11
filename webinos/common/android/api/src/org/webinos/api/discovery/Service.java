package org.webinos.api.discovery;

import org.webinos.api.PendingOperation;


public abstract class Service {
	
	public static final int SERVICE_INITATING = 0;             
	public static final int SERVICE_AVAILABLE = 1;
	public static final int SERVICE_UNAVAILABLE = 2;
    
    public int  state;
    public String api;
    public String id;
    public String displayName;
    public String description;
    public String icon;
    
    public abstract PendingOperation bind(BindCallback bindCallBack, String serviceId) 
    		throws DiscoveryError;
    public abstract void unbind() throws DiscoveryError;
}
