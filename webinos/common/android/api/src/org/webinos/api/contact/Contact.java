package org.webinos.api.contact;

import java.util.Date;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.java.Base;

public class Contact extends Base {
	private static short classId = Env.getInterfaceId(Contact.class);
	protected Contact() { super(classId); }

    public String id;
    public String displayName;
    public ContactName name;
    public String nickname;
    public ContactField[] phoneNumbers;
    public ContactField[] emails;
    public ContactAddress[] addresses;
    public ContactField[] ims;
    public ContactOrganization[] organizations;
    public Date revision;
    public Date birthday;
    public String gender;
    public String note;
    public ContactField[] photos;
    public String[] categories;
    public ContactField[] urls;
    public String timezone;
}
