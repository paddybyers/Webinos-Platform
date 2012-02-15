package org.webinos.api.widgetmanager;

import org.meshpoint.anode.idl.Dictionary;

public class FeatureRequest implements Dictionary {
	public String name;
	public boolean required;
	public Param[] params;
}
