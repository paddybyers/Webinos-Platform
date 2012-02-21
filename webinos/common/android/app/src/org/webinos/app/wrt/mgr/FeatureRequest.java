package org.webinos.app.wrt.mgr;

import org.meshpoint.anode.idl.Dictionary;

public class FeatureRequest implements Dictionary {
	public String name;
	public boolean required;
	public Param[] params;
}
