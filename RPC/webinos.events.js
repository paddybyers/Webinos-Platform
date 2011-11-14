(function (exports) {
	"use strict";
	
	var EventEmitter = require('events').EventEmitter;
	
	var utils = require('./webinos.utils.js');
	
	exports.EventTarget = function () {
		this.__eventEmitter = new EventEmitter();
	}
	
	exports.EventTarget.prototype.addEventListener = function (type, listener, useCapture) {
		this.__eventEmitter.addListener(type, utils.bind(listener, this));
	}
	
	exports.EventTarget.prototype.removeEventListener = function (type, listener, useCapture) {
		this.__eventEmitter.removeListener(type, utils.bind(listener, this));
	}
	
	exports.EventTarget.prototype.dispatchEvent = function (evt) {
		if (!evt.type)
			throw new exports.EventExcetopn(exports.EventException.UNSPECIFIED_EVENT_TYPE_ERR);
		
		evt.target = this;
		evt.currentTarget = this;
		evt.eventPhase = exports.Event.AT_TARGET;

		this.__eventEmitter.emit(evt.type, evt);
	}
	
	exports.Event = function (eventTypeArg, canBubbleArg, cancelableArg) {
		this.initEvent(eventTypeArg, canBubbleArg, cancelableArg);
	}
	
	exports.Event.CAPTURING_PHASE = 1;
	exports.Event.AT_TARGET = 2;
	exports.Event.BUBBLING_PHASE = 3;
	
	exports.Event.prototype.type = '';
	exports.Event.prototype.target = null;
	exports.Event.prototype.currentTarget = null;
	exports.Event.prototype.eventPhase = exports.Event.AT_TARGET;
	exports.Event.prototype.bubbles = false;
	exports.Event.prototype.cancelable = false;
	exports.Event.prototype.timeStamp = 0;
	
	exports.Event.prototype.stopPropagation = function () {
		// Unsupported operation.
	}
	
	exports.Event.prototype.preventDefault = function () {
		// Unsupported operation.
	}
	
	exports.Event.prototype.initEvent = function (eventTypeArg, canBubbleArg, cancelableArg) {
		this.type = eventTypeArg;
		
		// Neither event bubbling nor event cancellation is supported. Hence, canBubbleArg and cancelableArg may be
		// ignored.
	}

	exports.ProgressEvent = function (typeArg, canBubbleArg, cancelableArg, lengthComputableArg, loadedArg, totalArg) {
		exports.Event.call(this);
		
		this.initProgressEvent(typeArg, canBubbleArg, cancelableArg, lengthComputableArg, loadedArg, totalArg);
	}
	
	exports.ProgressEvent.prototype = new exports.Event();
	exports.ProgressEvent.prototype.constructor = exports.ProgressEvent;
	
	exports.ProgressEvent.prototype.lengthComputable = false;
	exports.ProgressEvent.prototype.loaded = 0;
	exports.ProgressEvent.prototype.total = 0;
	
	exports.ProgressEvent.prototype.initProgressEvent = function (typeArg, canBubbleArg, cancelableArg, lengthComputableArg, loadedArg, totalArg) {
		this.initEvent(typeArg, canBubbleArg, cancelableArg);
		
		this.lengthComputable = lengthComputableArg;
		this.loaded = loadedArg;
		this.total = totalArg;
	}
	
	exports.EventException = function (codeArg) {
		this.code = codeArg;
	}
	
	exports.EventException.UNSPECIFIED_EVENT_TYPE_ERR = 0;
})(module.exports);