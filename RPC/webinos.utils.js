(function (exports) {
	"use strict";

	var utils = exports;

	// MDN {@link https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind}
	if (!Function.prototype.bind) {
		Function.prototype.bind = function (oThis) {
			if (typeof this !== "function") // closest thing possible to the ECMAScript 5 internal IsCallable function
				throw new TypeError("Function.prototype.bind - what is trying to be fBound is not callable");

			var aArgs = Array.prototype.slice.call(arguments, 1), fToBind = this, fNOP = function () {
			}, fBound = function () {
				return fToBind.apply(this instanceof fNOP ? this : oThis || window, aArgs.concat(Array.prototype.slice
						.call(arguments)));
			};

			fNOP.prototype = this.prototype;
			fBound.prototype = new fNOP();

			return fBound;
		};
	}

	utils.bind = function (fun, thisArg) {
		return fun.bind(thisArg);
	}

	utils.callback = function (fun, thisArg) {
		if (typeof fun !== 'function')
			return function () {
			};

		return utils.bind(fun, thisArg);
	}

	utils.conditional = function (trueCallback, falseCallback, thisArg) {
		return function (condition) {
			if (condition)
				utils.callback(trueCallback, thisArg)();
			else
				utils.callback(falseCallback, thisArg)();
		};
	}

	utils.erroneous = function (successCallback, errorCallback, thisArg) {
		return function (error, result) {
			if (error)
				utils.callback(errorCallback, thisArg)(error);
			else
				utils.callback(successCallback, thisArg)(result);
		};
	}
})(typeof module !== 'undefined' ? module.exports : (typeof webinos !== 'undefined' ? webinos : webinos = {}).utils = {});