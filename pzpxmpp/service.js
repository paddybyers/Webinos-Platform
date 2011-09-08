/*
 * 'Class' definition of generic webinos service
 *
 * inspiration for subclassing methodology comes from http://www.webreference.com/js/column79/4.html
 */
function GenericService() {
    this.id = null;                           // (app level) unique id, e.g. for use in html user interface
    this.owner = null;                        // person that owns the device the service is running on
    this.device = null;                       // (addressable) id of device the service is running on
    this.name = "(you shouldn't see this!)";  // friendly name, to be overridden
    this.ns = null;                           // name space that (globally) uniquely defines the service type
    
    this.onRemove = null;                     // callback function for 'on removal'
    this.remove = genericRemove;              // function called by WebinosImpl
    this.isLocal = genericIsLocal;            // returns true is the service is running on the local device
    this.isMine = genericIsMine;              // returns true if the service runs on a device of same owner
    this.invoke = function(){alert('oops!');};// execute the service, needs be overridden
}

/*
 * Geolocation Service, defined as subclass of GenericService
 *
 * When an app invokes this service, a query request is sent to the 
 * service (address). The result is passed back through a callback.
 *
 * See the XMPP logging for the details.
 */
function GeolocationService() {
    this.ns = "http://webinos.org/api/geolocation";
    this.name = "geolocation";
    this.invoke = geolocationInvoke;          // as seen from app
    this.onResult = null;                     // callback function for 'on result'
    this.result = function(lat, lon) {        // called by webinosImpl when result is avail
        if (this.onResult) (this.onResult)(lat, lon);
    };
    this.onError = null;                      // callback function for 'on result'
    this.error = function(err) {              // called by webinosImpl when query failed
        if (this.onError) (this.onError)(err);
    };
}
// This statement defines the class hierarchy
GeolocationService.prototype = new GenericService;

function geolocationInvoke() {
    webinosImpl.geolocationInvoke(this);
}
////////////////////////// END Geolocation Service //////////////////////////


/*
 * Remote-alerting Service, defines as subclass of GenericService
 */
function RemoteAlertingService() {
    this.ns = "http://webinos.org/api/remote-alert";
    this.name = "remote-alert";
    this.invoke = remoteAlertingInvoke;
}
// This statement defines the class hierarchy
RemoteAlertingService.prototype = new GenericService;

function remoteAlertingInvoke() {
    webinosImpl.remoteAlertingInvoke(this);
}
///////////////////////// END Remote Alering Service /////////////////////////


/*
 * Generic Service methods, no need to override these
 */
function genericRemove() {
    if (this.onRemove) (this.onRemove)(this);
}
function genericIsLocal() {
    return (this.device == webinos.device);
}
function genericIsMine() {
    return (this.owner == webinos.owner);
}
