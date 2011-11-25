(function (exports) {
	var EventEmitter = require('events').EventEmitter;
	
	var utils = require('./webinos.utils.js');
	
	var events = exports;
	
	events.EventTarget = function () {
		this.__eventEmitter = new EventEmitter();
	}
	
	events.EventTarget.prototype.addEventListener = function (type, listener, useCapture) {
		this.__eventEmitter.addListener(type, utils.bind(listener, this));
	}
	
	events.EventTarget.prototype.removeEventListener = function (type, listener, useCapture) {
		this.__eventEmitter.removeListener(type, utils.bind(listener, this));
	}
	
	events.EventTarget.prototype.dispatchEvent = function (evt) {
		if (!evt.type)
			throw new events.EventExcetopn(events.EventException.UNSPECIFIED_EVENT_TYPE_ERR);
		
		evt.target = this;
		evt.currentTarget = this;
		evt.eventPhase = events.Event.AT_TARGET;

		this.__eventEmitter.emit(evt.type, evt);
	}
	
	events.Event = function (eventTypeArg, canBubbleArg, cancelableArg) {
		this.initEvent(eventTypeArg, canBubbleArg, cancelableArg);
	}
	
	events.Event.CAPTURING_PHASE = 1;
	events.Event.AT_TARGET = 2;
	events.Event.BUBBLING_PHASE = 3;
	
	events.Event.prototype.type = '';
	events.Event.prototype.target = null;
	events.Event.prototype.currentTarget = null;
	events.Event.prototype.eventPhase = events.Event.AT_TARGET;
	events.Event.prototype.bubbles = false;
	events.Event.prototype.cancelable = false;
	events.Event.prototype.timeStamp = 0;
	
	events.Event.prototype.stopPropagation = function () {
		// Unsupported operation.
	}
	
	events.Event.prototype.preventDefault = function () {
		// Unsupported operation.
	}
	
	events.Event.prototype.initEvent = function (eventTypeArg, canBubbleArg, cancelableArg) {
		this.type = eventTypeArg;
		
		// Neither event bubbling nor event cancellation is supported. Hence, canBubbleArg and cancelableArg may be
		// ignored.
	}

	events.ProgressEvent = function (typeArg, canBubbleArg, cancelableArg, lengthComputableArg, loadedArg, totalArg) {
		events.Event.call(this);
		
		this.initProgressEvent(typeArg, canBubbleArg, cancelableArg, lengthComputableArg, loadedArg, totalArg);
	}
	
	events.ProgressEvent.prototype = new events.Event();
	events.ProgressEvent.prototype.constructor = events.ProgressEvent;
	
	events.ProgressEvent.prototype.lengthComputable = false;
	events.ProgressEvent.prototype.loaded = 0;
	events.ProgressEvent.prototype.total = 0;
	
	events.ProgressEvent.prototype.initProgressEvent = function (typeArg, canBubbleArg, cancelableArg, lengthComputableArg, loadedArg, totalArg) {
		this.initEvent(typeArg, canBubbleArg, cancelableArg);
		
		this.lengthComputable = lengthComputableArg;
		this.loaded = loadedArg;
		this.total = totalArg;
	}
	
	events.EventException = function (codeArg) {
		this.code = codeArg;
	}
	
	events.EventException.UNSPECIFIED_EVENT_TYPE_ERR = 0;
})(module.exports);