package org.webinos.impl;
import org.webinos.api.PendingOperation;
import org.webinos.api.discovery.BindCallback;
import org.webinos.api.discovery.DiscoveryError;
import org.webinos.api.discovery.Service;

public class DiscoveryServiceImpl extends Service{

	@Override
    
	public PendingOperation bind(BindCallback bindCallBack, String serviceId) throws DiscoveryError{
		return null;
	}
    public void unbind() throws DiscoveryError{
    }
}