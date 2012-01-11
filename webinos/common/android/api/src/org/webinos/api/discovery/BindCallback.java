package org.webinos.api.discovery;

public interface BindCallback {

	public void onBind(Service service);
    public void onUnbind(Service service);
    public void onServiceAvailable(Service service);
    public void onServiceUnavailable(Service service);
    public void onError(DiscoveryError error); 
}
