package org.webinos.app.wrt.mgr;

import org.meshpoint.anode.idl.Dictionary;

public class Signature implements Dictionary {
	public String name;
	public String signatureId;
	public Certificate key;
	public Certificate root;
}
