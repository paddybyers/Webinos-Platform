(function (exports) {
	"use strict";
	
	exports.DOMException = {
		serialize: function (exception) {
			return {
				name: exception.name,
				message: exception.message,
				code: exception.code
			}
		}
	}
	
	exports.DOMError = {
		serialize: function (error) {
			return {
				name: error.name
			}
		}
	}
	
	exports.Event = {
		serialize: function (event) {
			return {
				type: event.type,
				// eventPhase: event.eventPhase,
				// stopPropagation: event.stopPropagation,
				// stopImmediatePropagation: event.stopImmediatePropagation,
				// canceled: event.canceled,
				// initialized: event.initialized,
				// dispatch: event.dispatch,
				bubbles: event.bubbles,
				cancelable: event.cancelable,
				// defaultPrevented: event.defaultPrevented,
				// isTrusted: event.isTrusted,
				// timeStamp: event.timeStamp
			}
		}
	}
	
	exports.ProgressEvent = {
		serialize: function (event) {
			var object = exports.Event.serialize(event);
			
			object.lengthComputable = event.lengthComputable;
			object.loaded = event.loaded;
			object.total = event.total;
			
			return object;
		}
	}
})(module.exports);