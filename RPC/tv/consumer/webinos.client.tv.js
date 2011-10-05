//implementation at client side, includes RPC massage invokation
/**
 * Interface for TV control and managment.
 * 
 * 
 * The interface provides means to acquire a list of tv sources, channels and
 * their streams.
 * 
 * The TV channel streams can be displayed in HTMLVideoElement object
 * (http://dev.w3.org/html5/spec/video.html). Alternatively the API provides
 * means to control channel management of the native hardware TV, by allowing to
 * set a channel or watch for channel changes that are invoked otherwise.
 * 
 * The tv object is made available under the webinos namespace, i.e. webinos.tv.
 * 
 */
(function() {

	// making namespaces
	if (typeof webinos === "undefined") {
		webinos = {};
	}
	if (!webinos.tv) {
		webinos.tv = {};
	}

	var WebinosTV, TVManager, TVDisplayManager, TVDisplaySuccessCB, TVTunerManager, TVSuccessCB, TVErrorCB, TVError, TVSource, Channel, ChannelChangeEvent;

	/**
	 * Creates tv object.
	 * 
	 */
	WebinosTV = function() {
		// TODO implement constructor logic if needed!

		// TODO initialize attributes

		this.tv = new TVManager();
	};
	WebinosTV.prototype.tv = null;

	/**
	 * Interface to manage what's currently displayed on TV screen.
	 * 
	 * 
	 * This interface is useful when an app doesn't want to show the broadcast
	 * itself, but let the TV natively handle playback, i.e. not in a web
	 * context. Useful to build an control interface that allows channel
	 * switching.
	 * 
	 */
	TVDisplayManager = function() {
		// TODO implement constructor logic if needed!

	};

	/**
	 * Switches the channel natively on the TV (same as when a hardware remote
	 * control would be used).
	 * 
	 */
	TVDisplayManager.prototype.setChannel = function(channel, successCallback,
			errorCallback) {
		var rpc = webinos.rpc.createRPC("TVManager", "display.setChannel",
				arguments);
		webinos.rpc.executeRPC(rpc, function(params) {
			successCallback(params);
		}, function(error) {
		});
		return;
	};

	/**
	 * Callback function when current channel changed successfully.
	 * 
	 */
	TVDisplaySuccessCB = function() {
		// TODO implement constructor logic if needed!

	};
	TVDisplaySuccessCB.prototype.onSuccess = function(channel) {
		// TODO: Add your application logic here!

		return;
	};

	// TODO: does not conform API Spec, but needs to be added!
	TVDisplayManager.prototype.addEventListener = function(eventname,
			channelchangeeventhandler, useCapture) {
		var rpc = webinos.rpc.createRPC("TVManager", "display.addEventListener",
				arguments);
		rpc.fromObjectRef = Math.floor(Math.random() + (new Date().getTime())); // random
																				// object
																				// ID

		// create the result callback
		callback = {};
		callback.onchannelchangeeventhandler = function(params,
				successCallback, errorCallback) {

			channelchangeeventhandler(params);

		};

		// register the object as being remotely accessible
		webinos.rpc.registerObject(rpc.fromObjectRef, callback);

		webinos.rpc.executeRPC(rpc);
		return;
	};

	/**
	 * Get a list of all available TV tuners.
	 * 
	 */
	TVTunerManager = function() {
		// TODO implement constructor logic if needed!

	};

	/**
	 * Get a list of all available TV tuners.
	 * 
	 */
	TVTunerManager.prototype.getTVSources = function(successCallback,
			errorCallback) {
		var rpc = webinos.rpc.createRPC("TVManager", "tuner.getTVSources",
				arguments);
		webinos.rpc.executeRPC(rpc, function(params) {
			successCallback(params);
		}, function(error) {
		});
		return;
	};

	/**
	 * Callback for found TV tuners.
	 * 
	 */
	TVSuccessCB = function() {
		// TODO implement constructor logic if needed!

	};

	/**
	 * Callback that is called with the found TV sources.
	 * 
	 */
	TVSuccessCB.prototype.onSuccess = function(sources) {
		// TODO: Add your application logic here!

		return;
	};

	/**
	 * Error callback for errors when trying to get TV tuners.
	 * 
	 */
	TVErrorCB = function() {
		// TODO implement constructor logic if needed!

	};

	/**
	 * Callback that is called when an error occures while getting TV sources
	 * 
	 */
	TVErrorCB.prototype.onError = function(error) {
		// TODO: Add your application logic here!

		return;
	};

	/**
	 * Error codes.
	 * 
	 */
	TVError = function() {
		// TODO implement constructor logic if needed!

		// TODO initialize attributes

		this.code = Number;
	};

	/**
	 * An unknown error.
	 * 
	 */
	TVError.prototype.UNKNOWN_ERROR = 0;

	/**
	 * Invalid input channel.
	 * 
	 */
	TVError.prototype.ILLEGAL_CHANNEL_ERROR = 1;

	/**
	 * Code.
	 * 
	 */
	TVError.prototype.code = Number;

	/**
	 * TV source: a list of channels with a name.
	 * 
	 */
	TVSource = function() {
		// TODO implement constructor logic if needed!

		// TODO initialize attributes

		this.name = String;
		this.channelList = Number;
	};

	/**
	 * The name of the source.
	 * 
	 * 
	 * The name should describe the kind of tuner this source represents, e.g.
	 * DVB-T, DVB-C.
	 * 
	 */
	TVSource.prototype.name = String;

	/**
	 * List of channels for this source.
	 * 
	 */
	TVSource.prototype.channelList = Number;

	/**
	 * The Channel Interface
	 * 
	 * 
	 * Channel objects provide access to the video stream.
	 * 
	 */
	Channel = function() {
		// TODO implement constructor logic if needed!

		// TODO initialize attributes

		this.channelType = Number;
		this.name = String;
		this.longName = String;
		this.stream = "new Stream()";
		this.tvsource = new TVSource();
	};

	/**
	 * Indicates a TV channel.
	 * 
	 */
	Channel.prototype.TYPE_TV = 0;

	/**
	 * Indicates a radio channel.
	 * 
	 */
	Channel.prototype.TYPE_RADIO = 1;

	/**
	 * The type of channel.
	 * 
	 * 
	 * Type of channel is defined by one of the TYPE_* constants defined above.
	 * 
	 */
	Channel.prototype.channelType = Number;

	/**
	 * The name of the channel.
	 * 
	 * 
	 * The name of the channel will typically be the call sign of the station.
	 * 
	 */
	Channel.prototype.name = String;

	/**
	 * The long name of the channel.
	 * 
	 * 
	 * The long name of the channel if transmitted. Can be undefined if not
	 * available.
	 * 
	 */
	Channel.prototype.longName = String;

	/**
	 * The video stream.
	 * 
	 * 
	 * This stream is a represents a valid source for a HTMLVideoElement.
	 * 
	 */
	Channel.prototype.stream = null;

	/**
	 * The source this channels belongs too.
	 * 
	 */
	Channel.prototype.tvsource = null;

	/**
	 * Event that fires when the channel is changed.
	 * 
	 * 
	 * Changing channels could also be invoked by other parties, e.g. a hardware
	 * remote control. A ChannelChange event will be fire in these cases which
	 * provides the channel that was switched to.
	 * 
	 */
	ChannelChangeEvent = function() {
		// TODO implement constructor logic if needed!

		// TODO initialize attributes

		this.channel = new Channel();
	};

	/**
	 * The new channel.
	 * 
	 */
	ChannelChangeEvent.prototype.channel = null;

	/**
	 * Initializes a new channel change event.
	 * 
	 */
	ChannelChangeEvent.prototype.initChannelChangeEvent = function(type,
			bubbles, cancelable, channel) {
		// TODO: Add your application logic here!

		return;
	};

	/**
	 * Access to tuner and display managers.
	 * 
	 */
	TVManager = function() {
		// TODO implement constructor logic if needed!

		// TODO initialize attributes

		this.display = new TVDisplayManager();
		this.tuner = new TVTunerManager();
	};
	webinos.tv = new TVManager();
	webinos.tv.display = new TVDisplayManager();
	webinos.tv.tuner = new TVTunerManager();
}());
