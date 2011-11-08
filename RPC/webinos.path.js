if (typeof module === 'undefined') {
	if (typeof webinos === 'undefined')
		webinos = {};
	
	if (typeof webinos.path === 'undefined')
		webinos.path = {};
	
	var exports = webinos.path;
} else
	var exports = module.exports;

/**
 * Node.js -- Path {@link https://github.com/joyent/node/blob/master/lib/path.js} module extract.
 * 
 * @author Felix-Johannes Jendrusch <felix-johannes.jendrusch@fokus.fraunhofer.de>
 */
(function (exports) {
	"use strict";
	
	exports.utils = {};
	
	exports.utils.split = function (path) {
		var result = /^(\/?)([\s\S]+\/(?!$)|\/)?((?:[\s\S]+?)?(\.[^.]*)?)$/.exec(path);
		
		// [root, directory, basename, extension]
		return [result[1] || '', result[2] || '', result[3] || '', result[4] || ''];
	}
	
	/**
	 * Normalizes a path array, i.e., an array without slashes, empty elements, or device names (C:\), by resolving
	 * . and .. elements. Relative and absolute paths are not distinguished.
	 * 
	 * @param {String[]} parts The path array.
	 * @param {Boolean} [allowAboveRoot=false] Whether the path is allowed to go above the root.
	 * @returns {String[]} A normalized path array.
	 */
	exports.utils.normalizeArray = function (parts, allowAboveRoot) {
		var up = 0;

		for (var i = parts.length - 1; i >= 0; i--) {
			var last = parts[i];

			if (last == '.')
				parts.splice(i, 1);
			else if (last == '..') {
				parts.splice(i, 1);

				up++;
			} else if (up) {
				parts.splice(i, 1);

				up--;
			}
		}

		if (allowAboveRoot)
			for (; up--;)
				parts.unshift('..');

		return parts;
	}
	
	exports.dirname = function (path) {
		var result = exports.utils.split(path),
			root = result[0],
			dir = result[1];

		if (!root && !dir)
			return '.';

		if (dir)
			dir = dir.substring(0, dir.length - 1);

		return root + dir;
	}

	exports.basename = function(path, ext) {
		var base = exports.utils.split(path)[2];

		if (ext && base.substr(-1 * ext.length) === ext)
			base = base.substr(0, base.length - ext.length);
			
		return base;
	}
	
	exports.extname = function(path) {
		return splitPath(path)[3];
	}

	/**
	 * Normalizes a path by resolving . and .. parts, and removes any trailing slashes (default behaviour).
	 * 
	 * @param {String} path The path.
	 * @param {Boolean} [preserveTrailingSlash=false] Whether a single trailing slash should be preserved.
	 * @returns {String} A normalized path.
	 * 
	 * @see exports.utils.normalizeArray
	 */
	exports.normalize = function (path, preserveTrailingSlash) {
		var isAbsolute = path.charAt(0) == '/',
			trailingSlash = path.charAt(path.length - 1) == '/';

		path = exports.utils.normalizeArray(path.split('/').filter(function (p) {
			return !!p;
		}), !isAbsolute).join('/');

		if (!path && !isAbsolute)
			path = '.';

		if (path && trailingSlash && preserveTrailingSlash)
			path += '/';

		return (isAbsolute ? '/' : '') + path;
	}

	/**
	 * Checks if the given paths refer to the same entry. Both paths are normalized prior to comparison.
	 * 
	 * @param {String} path1 First path.
	 * @param {String} path2 Second path.
	 * @returns {Boolean} True if <pre>path1</pre> and <pre>path2</pre> refer to the same entry, false otherwise.
	 */
	exports.equals = function (path1, path2) {
		return exports.normalize(path1, false) == exports.normalize(path2, false);
	}

	/**
	 * Joins all arguments together and normalizes the resulting path.
	 * 
	 * @returns {String} The joined and normalized path.
	 */
	exports.join = function () {
		var paths = Array.prototype.slice.call(arguments, 0);

		return exports.normalize(paths.filter(function (p) {
			return typeof p === 'string' && p;
		}, false).join('/'));
	}
	
	/**
	 * Checks if <pre>path</pre> is absolute.
	 * 
	 * @param {String} path The path.
	 * @returns {Boolean} True if <pre>path</pre> is absolute, false otherwise.
	 * 
	 * TODO Use it, also internally!
	 */
	exports.isAbsolute = function (path) {
		return path.charAt(0) == '/';
	}
	
	/**
	 * Given two absolute paths, checks if <pre>path2</pre> contains a path prefix of <pre>path1</pre> (e.g., in case
	 * of directories, checks if <pre>path2</pre> is a subdirectory of <pre>path1</pre>). Both paths are normalized
	 * prior to comparison.
	 * 
	 * @param {String} path1 First path.
	 * @param {String} path2 Second path.
	 * @returns {Boolean} True if <pre>path2</pre> contains a path prefix of <pre>path1</pre>, false otherwise.
	 * 
	 * TODO Check if paths are absolute.
	 */
	exports.isPrefixOf = function (path1, path2) {
		var path1Parts = exports.normalize(path1).split('/');
		var path2Parts = exports.normalize(path2).split('/');

		if (path2Parts.length < path1Parts.length)
			return false;

		for (var i = 0; i < path1Parts.length; i++)
			if (path1Parts[i] != path2Parts[i])
				return false;

		return true;
	}
	
	/**
	 * Resolves the last argument to an absolute path by prepending preceding arguments in right to left order, until
	 * an absolute path is found.
	 * 
	 * @returns {String} The resolved path (normalized, and without any trailing slashes unless the path gets resolved
	 * 		to the root directory).
	 */
	exports.resolve = function () {
		var resolvedPath = '',
			resolvedAbsolute = false;

		for (var i = arguments.length - 1; i >= 0 && !resolvedAbsolute; i--) {
			var path = arguments[i];

			if (typeof path !== 'string' || !path)
				continue;

			resolvedPath = path + '/' + resolvedPath;
			resolvedAbsolute = path.charAt(0) == '/';
		}
		
		resolvedPath = exports.utils.normalizeArray(resolvedPath.split('/').filter(function (p) {
			return !!p;
		}), !resolvedAbsolute).join('/');

		return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
	}

	/**
	 * Given two absolute paths, solves the relative path from <pre>from</pre> to <pre>to</pre>. Both paths are
	 * normalized prior to solving.
	 * 
	 * @param {String} from Origin path.
	 * @param {String} to Target path;
	 * @returns {String} The relative path.
	 * 
	 * TODO Check if paths are absolute (resolve if not?).
	 */
	exports.relative = function (from, to) {
		var fromParts = exports.normalize(from).split('/');
		var toParts = exports.normalize(to).split('/');

		var length = Math.min(fromParts.length, toParts.length);
		var samePartsLength = length;

		for (var i = 0; i < length; i++)
			if (fromParts[i] != toParts[i]) {
				samePartsLength = i;

				break;
			}

		var outputParts = [];

		for (var i = samePartsLength; i < fromParts.length; i++)
			outputParts.push('..');

		outputParts = outputParts.concat(toParts.slice(samePartsLength));

		return outputParts.join('/');
	}
})(exports);