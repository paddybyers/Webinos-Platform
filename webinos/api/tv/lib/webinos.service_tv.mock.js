//implementation at server side
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

	var WebinosTV, TVManager, TVDisplayManager, TVDisplaySuccessCB, TVTunerManager, TVSuccessCB, TVErrorCB, TVError, TVSource, Channel, ChannelChangeEvent;

	var channelChangeHandlers = [];

	/**
	 * Creates tv object.
	 * 
	 */
	WebinosTV = function() {
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

	};

	/**
	 * Switches the channel natively on the TV (same as when a hardware remote
	 * control would be used).
	 * 
	 */
	TVDisplayManager.prototype.setChannel = function(channel, successCallback,
			errorCallback) {
		var i;
		// return the set channel immediatelly
		successCallback(channel);
		// send the channel change information to all registered handlers
		for (i = 0; channelChangeHandlers.length > i; i++) {
			channelChangeHandlers[i](channel);
		}
	};

	/**
	 * Callback function when current channel changed successfully.
	 * 
	 */
	TVDisplaySuccessCB = function() {

	};
	TVDisplaySuccessCB.prototype.onSuccess = function(channel) {

		return;
	};

	/**
	 * Get a list of all available TV tuners.
	 * 
	 */
	TVTunerManager = function() {

	};

	/**
	 * Get a list of all available TV tuners.
	 * 
	 */
	TVTunerManager.prototype.getTVSources = function(successCallback,
			errorCallback) {

		// TODO: The following implementation needs to be modified to fit the
		// focused device, e.g. STB, DVB-Stick

		// Sample videos taken from:
		// http://people.opera.com/patrickl/experiments/webm/fancy-swap/
		var staticExampleTuners = [
				{
					name : "DVB-S",
					channelList : [
							new Channel(
									0,
									'CH01',
									'Long name of channel 1.',
									'http://people.opera.com/patrickl/experiments/webm/videos/fridge.webm',
									new TVSource('DVB-S')),
							new Channel(
									0,
									'CH02',
									'Long name of channel 2.',
									'http://people.opera.com/patrickl/experiments/webm/videos/garden1.webm',
									new TVSource('DVB-S')) ]
				},
				{
					name : "DVB-T",
					channelList : [
							new Channel(
									0,
									'CH100',
									'Long name of channel 1.',
									'http://people.opera.com/patrickl/experiments/webm/videos/garden2.webm',
									new TVSource('DVB-T')),
							new Channel(
									0,
									'CH101',
									'Long name of channel 101.',
									'http://people.opera.com/patrickl/experiments/webm/videos/windowsill.webm',
									new TVSource('DVB-T')) ]
				} ];

		if (typeof successCallback === 'function') {
			successCallback(staticExampleTuners);
			return;
		}

		if (typeof errorCallback === 'function') {
			errorCallback();
		}
	};

	/**
	 * Callback for found TV tuners.
	 * 
	 */
	TVSuccessCB = function() {

	};

	/**
	 * Callback that is called with the found TV sources.
	 * 
	 */
	TVSuccessCB.prototype.onSuccess = function(sources) {

		return;
	};

	/**
	 * Error callback for errors when trying to get TV tuners.
	 * 
	 */
	TVErrorCB = function() {

	};

	/**
	 * Callback that is called when an error occures while getting TV sources
	 * 
	 */
	TVErrorCB.prototype.onError = function(error) {

		return;
	};

	/**
	 * Error codes.
	 * 
	 */
	TVError = function() {

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
	TVSource = function(tvsourcename) {

		this.name = tvsourcename;
		// TODO: get the real channel list from device
		this.channelList = [];
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
	Channel = function(channelType, name, longName, stream, tvsource) {

		if (typeof channelType === 'number') {
			this.channelType = channelType;
		}

		if (typeof name === 'string') {
			this.name = name;
		}

		if (typeof longName === 'string') {
			this.longName = longName;
		}

		this.stream = stream;

		this.tvsource = tvsource;
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

		return;
	};

	/**
	 * Adding a handler for the channel change event.
	 * 
	 */
	// TODO: does not conform API Spec, but needs to be added!
	TVDisplayManager.prototype.addEventListener = function(eventname,
			channelchangeeventhandler, useCapture) {
		if (eventname === 'channelchange'
				&& typeof channelchangeeventhandler === 'function') {
			channelChangeHandlers.push(channelchangeeventhandler);
		}
		return;
	};

	/**
	 * Access to tuner and display managers.
	 * 
	 */
	TVManager = function() {

		this.display = new TVDisplayManager();
		this.tuner = new TVTunerManager();
	};

	exports.tv = new WebinosTV();
}());
