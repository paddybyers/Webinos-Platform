if (typeof module === "undefined") {
	if (typeof webinos === "undefined")
		webinos = {}
	
	if (typeof webinos.utils === "undefined")
		webinos.utils = {}
	
	var exports = webinos.utils;
} else
	var exports = module.exports;

(function (exports) {
	"use strict";

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

	exports.bind = function (fun, thisArg) {
		return fun.bind(thisArg);
	}

	exports.callback = function (fun, thisArg) {
		if (typeof fun !== "function")
			return function () {
			}

		return exports.bind(fun, thisArg);
	}
	
	exports.DoublyLinkedList = function (compare) {
		this.compare = compare;
	}
	
	exports.DoublyLinkedList.prototype.head = null;
	exports.DoublyLinkedList.prototype.tail = null;
	
	exports.DoublyLinkedList.prototype.append = function (data) {
		var node = new exports.DoublyLinkedNode(data, this.tail, null);
		
		if (this.head === null)
			this.head = node;
		
		if (this.tail !== null)
			this.tail.next = node;
		
		this.tail = node;
		
		return node;
	}
	
	exports.DoublyLinkedList.prototype.insert = function (data) {
		var current = this.head;
		
		while (current !== null && this.compare(data, current.data) > 0)
			current = current.next;

		if (current === null)
			return this.append(data);
		
		var node = new exports.DoublyLinkedNode(data, current.prev, current);
		
		if (current.prev === null)
			this.head = node;
		else
			current.prev.next = node;
		
		current.prev = node;
		
		return node;
	}
	
	exports.DoublyLinkedList.prototype.find = function (data) {
		var current = this.head;
		
		while (current !== null && this.compare(data, current.data) != 0)
			current = current.next;
		
		return current;
	}
	
	exports.DoublyLinkedList.prototype.remove = function (node) {
		if (node.prev === null)
			this.head = node.next;
		else
			node.prev.next = node.next;
		
		if (node.next === null)
			this.tail = node.prev;
		else
			node.next.prev = node.prev;
	}
	
	exports.DoublyLinkedList.prototype.empty = function () {
		this.head = null;
		this.tail = null;
	}
	
	exports.DoublyLinkedNode = function (data, prev, next) {
		this.data = data;
		this.prev = prev;
		this.next = next;
	}
})(exports);