(function (exports) {
	"use strict";
	
	var EventEmitter = require("events").EventEmitter;
	
	var utils = require("../../../../../common/rpc/lib/webinos.utils.js");
	
	exports.DOMException = function (type, message) {
		if (typeof type !== "string")
			throw new TypeError("first argument must be a string");

		this.name = type;
		
		if (typeof message !== "string")
			throw new TypeError("second argument must be a string");
		
		this.message = message;
		
		if (typeof exports.DOMException.typeToCodeMap[type] !== "undefined")
			this.code = exports.DOMException.typeToCodeMap[type];
	}
	
	exports.DOMException.INDEX_SIZE_ERR = 1;
	exports.DOMException.DOMSTRING_SIZE_ERR = 2;
	exports.DOMException.HIERARCHY_REQUEST_ERR = 3;
	exports.DOMException.WRONG_DOCUMENT_ERR = 4;
	exports.DOMException.INVALID_CHARACTER_ERR = 5;
	exports.DOMException.NO_DATA_ALLOWED_ERR = 6;
	exports.DOMException.NO_MODIFICATION_ALLOWED_ERR = 7;
	exports.DOMException.NOT_FOUND_ERR = 8;
	exports.DOMException.NOT_SUPPORTED_ERR = 9;
	exports.DOMException.INUSE_ATTRIBUTE_ERR = 10;
	exports.DOMException.INVALID_STATE_ERR = 11;
	exports.DOMException.SYNTAX_ERR = 12;
	exports.DOMException.INVALID_MODIFICATION_ERR = 13;
	exports.DOMException.NAMESPACE_ERR = 14;
	exports.DOMException.INVALID_ACCESS_ERR = 15;
	exports.DOMException.VALIDATION_ERR = 16;
	exports.DOMException.TYPE_MISMATCH_ERR = 17;
	exports.DOMException.SECURITY_ERR = 18;
	exports.DOMException.NETWORK_ERR = 19;
	exports.DOMException.ABORT_ERR = 20;
	exports.DOMException.URL_MISMATCH_ERR = 21;
	exports.DOMException.QUOTA_EXCEEDED_ERR = 22;
	exports.DOMException.TIMEOUT_ERR = 23;
	exports.DOMException.INVALID_NODE_TYPE_ERR = 24;
	exports.DOMException.DATA_CLONE_ERR = 25;
	
	exports.DOMException.typeToCodeMap = {
		"IndexSizeError": exports.DOMException.INDEX_SIZE_ERR,
		"HierarchyRequestError": exports.DOMException.HIERARCHY_REQUEST_ERR,
		"WrongDocumentError": exports.DOMException.WRONG_DOCUMENT_ERR,
		"InvalidCharacterError": exports.DOMException.INVALID_CHARACTER_ERR,
		"NoModificationAllowedError": exports.DOMException.NO_MODIFICATION_ALLOWED_ERR,
		"NotFoundError": exports.DOMException.NOT_FOUND_ERR,
		"NotSupportedError": exports.DOMException.NOT_SUPPORTED_ERR,
		"InvalidStateError": exports.DOMException.INVALID_STATE_ERR,
		"SyntaxError": exports.DOMException.SYNTAX_ERR,
		"InvalidModificationError": exports.DOMException.INVALID_MODIFICATION_ERR,
		"NamespaceError": exports.DOMException.NAMESPACE_ERR,
		"InvalidAccessError": exports.DOMException.INVALID_ACCESS_ERR,
		"TypeMismatchError": exports.DOMException.TYPE_MISMATCH_ERR,
		"SecurityError": exports.DOMException.SECURITY_ERR,
		"NetworkError": exports.DOMException.NETWORK_ERR,
		"AbortError": exports.DOMException.ABORT_ERR,
		"URLMismatchError": exports.DOMException.URL_MISMATCH_ERR,
		"QuotaExceededError": exports.DOMException.QUOTA_EXCEEDED_ERR,
		"TimeoutError": exports.DOMException.TIMEOUT_ERR,
		"InvalidNodeTypeError": exports.DOMException.INVALID_NODE_TYPE_ERR,
		"DataCloneError": exports.DOMException.DATA_CLONE_ERR
	}
	
	exports.DOMException.prototype.code = 0;
	
	exports.DOMError = function (type) {
		if (typeof type !== "string")
			throw new TypeError("first argument must be a string");

		this.name = type;
	}
	
	exports.EventTarget = function () {
		this.__eventEmitter = new EventEmitter();
	}
	
	exports.EventTarget.prototype.addEventListener = function (type, listener, capture /* ignored */) {
		if (listener === null)
			return;
		else if (typeof listener !== "function") // Anything else doesn't make sense.
			throw new TypeError("second argument must be callable");
		
		this.__eventEmitter.addListener(type, utils.bind(listener, this) /* bind to event's currentTarget */);
	}
	
	exports.EventTarget.prototype.removeEventListener = function (type, listener, capture /* ignored */) {
		if (listener === null)
			return;
		else if (typeof listener !== "function") // Anything else doesn't make sense.
			throw new TypeError("second argument must be callable");
		
		this.__eventEmitter.removeListener(type, utils.bind(listener, this) /* bind to event's currentTarget */);
	}
	
	exports.EventTarget.prototype.dispatchEvent = function (event) {
		if (event.dispatch || !event.initialized)
			throw new exports.DOMException("InvalidStateError",
					"event either already dispatched or not yet initialized");
		
		event.isTrusted = false;
		
		event.dispatch = true;
		
		event.target = this;
		event.currentTarget = this;

		this.__eventEmitter.emit(event.type, event);
		
		event.dispatch = false;
		
		event.eventPhase = exports.Event.AT_TARGET;
		
		event.currentTarget = null;
		
		return true /* !event.canceled */;
	}
	
	exports.Event = function (type, eventInitDict) {
		this.initialized = true;
		
		// Skip validation for inheritance support (or rework inheritance).
		// if (typeof type !== "string")
		//	throw new TypeError("first argument must be a string");
		
		this.type = type;
		
		if (typeof eventInitDict === "object") {
			if (typeof eventInitDict.bubbles === "boolean")
				this.bubbles = eventInitDict.bubbles;
			
			if (typeof eventInitDict.cancelable === "boolean")
				this.cancelable = eventInitDict.cancelable;
			
			// TODO Set other event attributes defined in the dictionary? How to check respective types?
		}
	}
	
	exports.Event.CAPTURING_PHASE = 1;
	exports.Event.AT_TARGET = 2;
	exports.Event.BUBBLING_PHASE = 3;
	
	exports.Event.prototype.type = "";
	exports.Event.prototype.target = null;
	exports.Event.prototype.currentTarget = null;
	
	exports.Event.prototype.eventPhase = exports.Event.AT_TARGET;

	// exports.Event.prototype.stopPropagation = false;
	// exports.Event.prototype.stopImmediatePropagation = false;
	// exports.Event.prototype.canceled = false;
	exports.Event.prototype.initialized = false;
	exports.Event.prototype.dispatch = false;
	
	exports.Event.prototype.bubbles = false;
	exports.Event.prototype.cancelable = false;

	exports.Event.prototype.defaultPrevented = false;
	
	exports.Event.prototype.isTrusted = false;
	exports.Event.prototype.timeStamp = 0; // TODO Initialize to Unix time on event creation.
	
	exports.Event.prototype.stopPropagation = function () {
		throw new exports.DOMException("NotSupportedError", "stopping event propagation is not supported");
	}
	
	exports.Event.prototype.stopImmediatePropagation = function () {
		throw new exports.DOMException("NotSupportedError", "immediately stopping event propagation is not supported");
	}
	
	exports.Event.prototype.preventDefault = function () {
		throw new exports.DOMException("NotSupportedError", "event canceling is not supported");
	}
	
	exports.Event.prototype.initEvent = function (type, bubbles, cancelable) {
		this.initialized = true;
		
		if (this.dispatch)
			return;
		
		// this.stopPropagation = false;
		// this.stopImmediatePropagation = false;
		// this.canceled = false;
		
		this.isTrusted = false;
		
		this.target = null;
		
		this.type = type;
		this.bubbles = bubbles;
		this.cancelable = cancelable;
	}

	exports.ProgressEvent = function (type, eventInitDict) {
		exports.Event.call(this, type, eventInitDict);
		
		if (typeof eventInitDict === "object") {
			if (typeof eventInitDict.lengthComputable === "boolean")
				this.lengthComputable = eventInitDict.lengthComputable;
			
			if (typeof eventInitDict.loaded === "number")
				this.loaded = eventInitDict.loaded;
			
			if (typeof eventInitDict.total === "number")
				this.total = eventInitDict.total;
		}
	}
	
	exports.ProgressEvent.prototype = new exports.Event();
	exports.ProgressEvent.prototype.constructor = exports.ProgressEvent;
	
	exports.ProgressEvent.prototype.lengthComputable = false;
	exports.ProgressEvent.prototype.loaded = 0;
	exports.ProgressEvent.prototype.total = 0;
})(module.exports);