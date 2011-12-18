package org.webinos.api.messaging;

import java.util.Date;

import org.meshpoint.anode.idl.Dictionary;

public class MessageFilter implements Dictionary {
    public String id;
    public int[] type;
    public int[] folder;
    public Date startTimestamp;
    public Date endTimestamp;   
    public String from;
    public String[] to;
    public String[] cc;
    public String[] bcc;
    public String body;
    public Boolean isRead;
    public Boolean messagePriority;
    public String subject;
}