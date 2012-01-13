package org.webinos.api.discovery;

public interface FindCallback {
	 public void onFound(Service service);        
     public void onLost(Service service);
     public void onError(DiscoveryError error);
}

