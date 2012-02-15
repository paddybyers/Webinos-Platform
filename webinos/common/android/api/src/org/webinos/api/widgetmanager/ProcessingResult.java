package org.webinos.api.widgetmanager;

import org.meshpoint.anode.idl.Dictionary;

public class ProcessingResult implements Dictionary {
    public int status = WidgetConfig.STATUS_OK;
    public Artifact error;
    public Artifact[] warnings;
    public ComparisonResult comparisonResult;
    public ValidationResult validationResult;
    public WidgetConfig widgetConfig;

}
