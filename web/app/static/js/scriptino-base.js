// Scriptino Base
// Copyright 2008-2010 Michael Geary - http://mg.to/
// Use under any Open Source license:
// http://www.opensource.org/licenses/

var Scriptino, S;

(function() {
	
	var $ = window.jQuery;
	
	// Standard JavaScript [].forEach(), see http://tinyurl.com/js-array-foreach
	if( ! Array.prototype.forEach ) {
		Array.prototype.forEach = function( fun /*, thisp*/ ) {
			var thisp = arguments[1];
			for( var i = 0, n = this.length;  i < n;  ++i ) {
				if( i in this )
					fun.call( thisp, this[i], i, this );
			}
		};
	}
	
	//// Standard JavaScript [].indexOf(), see http://tinyurl.com/js-array-indexof
	//if( ! Array.prototype.indexOf ) {
	//	Array.prototype.indexOf = function( elt /*, from*/ ) {
	//		var len = this.length >>> 0;
	//		
	//		var from = Number(arguments[1]) || 0;
	//		from = ( from < 0 ) ? Math.ceil(from) : Math.floor(from);
	//		if( from < 0 ) from += len;
	//		
	//		for( ; from < len; ++from )
	//			if( from in this  &&  this[from] === elt )
	//				return from;
	//		
	//		return -1;
	//	};
	//}
	
	// Standard JavaScript [].map(), see http://tinyurl.com/js-array-map
	if( ! Array.prototype.map ) {
		Array.prototype.map = function( fun /*, thisp*/ ) {
			var len = this.length;
			var res = new Array( len );
			var thisp = arguments[1];
			for( var i = 0;  i < len;  ++i ) {
				if( i in this )
					res[i] = fun.call( thisp, this[i], i, this );
			}
			
			return res;
		};
	}
	
	// Concatenate all arguments into a single string, e.g.
	// var html = S(
	//     '<div>',
	//         '<a href="test">',
	//             'Test',
	//         '</a>',
	//     '</div>'
	// );
	Scriptino = S = function() {
		return Array.prototype.join.call( arguments, '' );
	};
	
	// Extend the 'to' object by copying all properties from each subsequent argument.
	S.extend = function( to ) {
		for( var i = 1, n = arguments.length;  i < n;  ++i ) {
			var from = arguments[i];
			if( from ) for( var name in from ) to[name] = from[name];
		}
		return to;
	};
	
	S.sessionId = S.sessionId || Math.random().toFixed(16).split('.')[1];
	
	S.extend( S,  {
		
		// Base URL for the current document.
		baseUrl: location.href.replace( /[^/]*$/, '' ),
		
		// Does the string 'str' begin with the string 's'?
		beginsWith: function( str, s ) {
			return str.slice( 0, s.length ) === s;
		},
		
		// Somewhat misnamed, more of a modulo operation than a clamp.
		clamp: function( value, min, max ) {
			while( value < min ) value += max - min;
			while( value >= max )  value -= max - min;
			return value;
		},
		
		// Convert a relative URL to an absolute URL, leave an absolute URL as is.
		fixUrl: function( url ) {
			return url.match( /:/ ) ? url : S.baseUrl + url;
		},
		
		// Convert a plain text string into HTML code representing that text,
		// e.g. "<div>" becomes "&lt;div&gt;".
		htmlEscape: function( text ) {
			var div = document.createElement( 'div' );
			div.appendChild( document.createTextNode(text) );
			return div.innerHTML;
		},
		
		// Given an array of objects and one or more keys (property names
		// in those objects), index the array by each of those keys for fast
		// lookup later. Also adds an 'index' property to each of the objects
		// in the array.
		// Example:
		//     var animals = [
		//         { name:'dog', sound:'bark' },
		//         { name:'cat', sound:'meow' },
		//         { name:'cow', sound:'moo' }
		//     ];
		//     S.indexArray( animals, 'name', 'sound' );
		//     alert( animals.by_name.cat.sound );  // 'meow'
		//     alert( animals.by_name['cat'].sound );  // 'meow'
		//     alert( animals.by_sound['bark'].name );  // 'dog'
		//     alert( animals.by_name.cow.index );  // 2
		// TODO: update or discard unused code for no keys (array of strings).
		indexArray: function( array /* , key, key, ... */ ) {
			//if( arguments.length > 1 ) {
				for( var iArg = 1, nArgs = arguments.length;  iArg < nArgs;  ++iArg ) {
					var field = arguments[iArg];
					var by = array[ 'by_' + field ] = {};
					for( var i = -1, obj;  obj = array[++i]; ) {
						by[obj[field]] = obj;
						obj.index = i;
					}
				}
			//}
			//else {
			//	var by = array.by = {};
			//	for( var i = 0, n = array.length;  i < n;  ++i ) {
			//		var str = array[i];
			//		by[str] = str;
			//		str.index = i;
			//	}
			//}
			return array;
		},
		
		// Shortcut for calling array.map() and .join() on the result,
		// for building strings.
		mapJoin: function( array, fun, delim ) {
			return array.map( fun ).join( delim || '' );
		},
		
		//mapElementsTo: function( array, names ) {
		//	if( names.split ) names = names.split(',');
		//	var result = [];
		//	for( var i = 0, n = array.length;  i < n;  ++i ) {
		//		// Could code:
		//		// result.push( arrayVars( array[i], names ) );
		//		// but inline it for performance:
		//		var element = array[i], obj = {};
		//		for( var j = 0, m = element.length;  j < m;  ++j )
		//			obj[ names[j] ] = element[j];
		//		result.push( obj );
		//	}
		//	return result;
		//},
		
		//mapTo: function( array, names ) {
		//	if( names.split ) names = names.split(',');
		//	var obj = {};
		//	for( var i = 0, n = names.length;  i < n;  ++i )
		//		obj[ names[i] ] = array[i];
		//	return obj;
		//},
		
		// Create a somewhat misnamed "oneshot timer".
		// You can trigger this timer multiple times, but if
		// you trigger it while a previous timer is pending,
		// it cancels that previous timer. So the timer fires
		// only once at the end of a series of triggers.
		// Example:
		//     var update = S.oneshot();
		//     $('#input').keypress( function() {
		//         update( function() {
		//             console.log( 'You stopped typing' );
		//         }, 250 );
		//     });
		oneshot: function () {
			var timer;
			return function( fun, time ) {
				clearTimeout( timer );
				timer = setTimeout( fun, time );
			};
		},
		
		// Parse an XML string and return the XML DOM object.
		parseXML: function( xml ) {
			if( window.ActiveXObject  &&  window.GetObject ) {
				var dom = new ActiveXObject( 'Microsoft.XMLDOM' );
				dom.loadXML( xml );
				return dom;
			}
			if( window.DOMParser )
				return new DOMParser().parseFromString( xml, 'text/xml' );
			return document.createElement( 'div' );
		},
		
		Query: {
			// Decode a query string value.
			decode: function( str ) {
				return decodeURIComponent( str );
			},
			
			// Encode a query string value, but leave commas alone.
			encode: function( str ) {
				return encodeURIComponent( str ).replace( '%2C', ',' );
			},
			
			// Parse the query string in a URL and return an object of
			// the key=value pairs.
			// Example:
			//     var url = 'http://example.com/test?a=b&c=d'
			//     var p = S.Query.parse(url);
			// Now p contains { a:'b', c:'d' }
			parse: function( query ) {
				if( query == null ) return {};
				if( typeof query != 'string' ) return query;
				if( query.charAt(0) == '{') return eval('(' + query + ')');

				var params = {};
				if( query ) {
					var array = query.replace( /^[#?]/, '' ).split( '&' );
					for( var i = 0, n = array.length;  i < n;  ++i ) {
						var p = array[i].split( '=' ),
							key = this.decode( p[0] ),
							value = this.decode( p[1] );
						if( key ) params[key] = value;
					}
				}
				return params;
			},
			
			// Construct a query string from a params object as returned by
			// S.Query.parse(), with optional pair and delimiter characters.
			// Example:
			//     alert( S.Query.string({ a:'b', c:'d' });  // 'a=b&c=d'
			string: function( params, pair, delim ) {
				pair = pair || '=',  delim = delim || '&';
				var array = [];
				for( var key in params ) {
					var value = params[key];
					if( value != null ) array.push(
						this.encode( key ) + pair +
						this.encode( value )
					);
				}
				return array.sort().join( delim );
			},
			
			// Construct an entire URL from a base URL, separator
			// character, params object, and optional pair and delimiters.
			// Example:
			//     alert( S.Query.url(
			//         'http://example.com/test', '?', { a:'b', c:'d' }
			//     ) );  // 'http://example.com/test?a=b&c=d'
			url: function( base, sep, params, pair, delim ) {
				var p = this.string( params, pair, delim );
				return p ? [ base, p ].join( sep || '?' ) : base;
			}
		},
		
		// These two versions of a Queue object both work (one uses plain
		// functions, the other object methods) but are currently unused.
		//Queue: function() {
		//	var queue, timer;
		//	function clear() {
		//		if( ! timer ) return null;
		//		clearTimeout( timer );
		//		var q = queue;
		//		queue = timer = null;
		//		return q;
		//	}
		//	function run() {
		//		var q = clear();
		//		if( ! q ) return;
		//		for( var args, i = -1;  args = q[++i]; ) {
		//			var object = args[0], method = args[1];
		//			object[method].apply( object, Array.prototype.slice.call( args, 2 ) );
		//		}
		//	}
		//	return {
		//		clear: clear,
		//		push: function( object, method ) {
		//			if( ! queue ) {
		//				queue = [];
		//				timer = setTimeout( run, 1 );
		//			}
		//			queue.push( arguments );
		//		},
		//		run: run
		//	}
		//},
		
		//Queue: function() {
		//	var queue, timer;
		//	function clear() {
		//		if( ! timer ) return null;
		//		clearTimeout( timer );
		//		var q = queue;
		//		queue = timer = null;
		//		return q;
		//	}
		//	function run() {
		//		var q = clear();
		//		if( ! q ) return;
		//		for( var args, i = -1;  args = q[++i]; ) {
		//			//var object = args[0], method = args[1];
		//			//object[method].apply( object, Array.prototype.slice.call( args, 2 ) );
		//			args[0].apply( null, Array.prototype.slice.call( args, 1 ) );
		//		}
		//	}
		//	return {
		//		clear: clear,
		//		push: function() {
		//			if( ! queue ) {
		//				queue = [];
		//				timer = setTimeout( run, 1 );
		//			}
		//			queue.push( arguments );
		//		},
		//		run: run
		//	}
		//},
		
		// Attempt to report a JavaScript error in a readable way
		// with a stack trace.
		reportError: function( e ) {
			var msg = S(
				e.name || 'Error', ': ',
				e.message || '(no error message)',' ',
				e.lineNumber || '(no line number)',' ',
				e.fileName && e.fileName.replace(/([^\/]*$)/, '$1') || '(no file name)'
			);
			var console = window.console, trace = console && console.trace;
			if( e.stack )
				msg += trace ? '\nStack trace:' : '\n' + e.stack;
			else if( e.fileName  &&  e.lineNumber )
				msg += S( '\n', e.fileName, ':', e.lineNumber );
			if( console ) {
				console.error( msg );
				trace && console.trace();
			}
			else {
				alert( msg );
			}
		},
		
		// Sort an array of objects by one of the property names in
		// those objects. This is a fast sort for large arrays. Instead
		// of calling [].sort() on the original array, we create an
		// array of strings representing the keys in the original
		// array, sort that string array, and then create a new
		// array with the objects from the original array. This
		// avoids the need for a callback function in [].sort()
		// so it runs much faster for large arrays.
		// 'key' can be either a property name or a function
		// for a custom sort.
		// 'opt' can be { numeric:true } or { caseDependent:true },
		// otherwise the sort is case independent.
		// TODO: is it a good idea for the default sort to be
		// case independent?
		// Example:
		//     var animals = [
		//         { name:'dog', sound:'bark' },
		//         { name:'cat', sound:'meow' },
		//         { name:'cow', sound:'moo' }
		//     ];
		//     var sorted = S.sortArrayBy( animals, 'name' );
		// Result is:
		//     [
		//         { name:'cat', sound:'meow' },
		//         { name:'cow', sound:'moo' },
		//         { name:'dog', sound:'bark' }
		//     ];
		
		sortArrayBy: function( array, key, opt ) {
			opt = opt || {};
			var sep = unescape('%uFFFF');
			var i = 0, n = array.length, sorted = new Array( n );
			
			// Separate loops for each case for speed
			if( opt.numeric ) {
				if( typeof key == 'function' ) {
					for( ;  i < n;  ++i )
						sorted[i] = [ ( 1000000000000000 + key(array[i]) + '' ).slice(-15), i ].join(sep);
				}
				else {
					for( ;  i < n;  ++i )
						sorted[i] = [ ( 1000000000000000 + array[i][key] + '' ).slice(-15), i ].join(sep);
				}
			}
			else {
				if( typeof key == 'function' ) {
					for( ;  i < n;  ++i )
						sorted[i] = [ key(array[i]), i ].join(sep);
				}
				else if( opt.caseDependent ) {
					for( ;  i < n;  ++i )
						sorted[i] = [ array[i][key], i ].join(sep);
				}
				else {
					for( ;  i < n;  ++i )
						sorted[i] = [ array[i][key].toLowerCase(), i ].join(sep);
				}
			}
			
			sorted.sort();
			
			var output = new Array( n );
			for( i = 0;  i < n;  ++i )
				output[i] = array[ sorted[i].split(sep)[1] ];
			
			return output;
		},
		
		// Deprecated
		str: function () {
			return Array.prototype.join.call( arguments, '' );
		},
		
		// String constants
		Str: {
			ellipsis: '&#8230;',
			enDash: '&#8211;',
			nbsp: '&#160;'
		},
		
		//template: function( name, values, give) {
		//	function success( data, status ) {
		//		var a = data.replace( /\r\n/g, '\n' ).split( /\n::/g );
		//		var o = S.templateUrls[url] = {};
		//		for( var i = 1, n = a.length;  i < n;  ++i ) {
		//			var s = a[i], k = s.match(/^\S+/), v = s.replace( /^.*\n/, '' );
		//			o[k] = $.trim(v);
		//		}
		//		ready();
		//	}
		//	
		//	function error( xhr, status, thrown ) {
		//		//onError( status );
		//	}
		//	
		//	function ready() {
		//		var text = S.templateUrls[url][part].replace(
		//			/\{\{(\w+)\}\}/g,
		//			function( match, name ) {
		//				var value = values[name];
		//				return value != null ? value : match;
		//			});
		//		give && give(text);
		//		return text;
		//	}
		//	
		//	name = name.split(':');
		//	var url = name[0] + '.html', part = name[1];
		//	return S.templateUrls[url] ?
		//		ready() :
		//		$.ajax({ url:url, dataType:'text', success:success, error:error });
		//},
		//
		//templateUrls: {},
		
		// Truncate a string on a word boundary with a proper ellipsis
		// if truncated. Esscape the output string if 'escape' is true.
		truncateString: function( text, n, escape) {
			var len = text.length;
			if( typeof n != 'number'  ||  len <= n ) return text + '';
			var s = text.substring( 0, n + 1 ).replace( / +[^ ]+$/, '' ).replace( /[ :;,.]*$/, '' );
			if( escape ) s = htmlEscape( s );
			return s + Str.ellipsis;
		},
		
		uniqueId: function() {
			function h( n ) { return n.toString(16); }
			return [ S.sessionId, h(+new Date), h(++S.uniqueIdCounter) ].join('-').toUpperCase();
		},
		
		uniqueIdCounter: 0,
		
		// Escape an XML attribute value - do an HTML escape and then
		// change quotes to &quot; entities.
		xmlAttrEscape: function( text ) {
			return htmlEscape( text ).replace( /"/g, '&quot;' );
		},
		
		_: 0
	});
	
	window.jQuery && (function() {
		
		$.extend({
			
			// Given an event and a selector, return either the event.target
			// if it matches the selector, or the nearest parent element that
			// matches the selector.
			eventTarget: function( event, selector ) {
				var $target = $(event.target);
				return $target.is(selector) ? $target[0] : $target.parents(selector)[0];
			},
			
			// Load an image temporarily to get its dimensions,
			// then call the callback function with those dimensions.
			// Example:
			//     $.imageDimensions(
			//         'http://example.com/test.jpg',
			//         function( width, height ) {
			//             alert( width + ' x ' + height );
			//         }
			//     );
			imageDimensions: function( src, callback ) {
				$('<img />')
					.css({ position:'absolute', left:-100000, top:-100000 })
					.appendTo('body')
					.load( function() {
						var width = this.width;
						var height = this.height;
						$(this).remove();
						callback( width, height );
					})
					.attr({ src:src });
			},
			
			// Return the width of a native browser scroll bar.
			scrollBarWidth: function() {
				var $outer = $('<div style="visibility:hidden; position:absolute; left:0; top:0; width:200px; height:200px; overflow:scroll;"><div></div></div>').appendTo('body');
				var width = $outer.width() - $outer.children().width();
				$outer.remove();
				return width;
			},
			
			S: function() {
				return $( Array.prototype.join.call( arguments, '' ) );
			}
			
		});
		
		$.fn.extend({
			
			cssCopy: function( from, styles ) {
				var $to = this, $from = $(from);
				styles.split(' ').forEach( function( style ) {
			        $to.css( style, $from.css(style) );
			    });
				return this;
			},
			
			each$: function( callback ) {
				for( var e, i = -1;  e = this[++i]; ) {
					if( callback( $(e), i ) === false ) break;
				}
			},
			
			// Toggle a classname on or off, and return whether the
			// classname was previously on.
			hadClass: function( cls, state ) {
				var had = this.hasClass( cls );
				this.toggleClass( cls, typeof state == 'boolean' ? state : ! had );
				return had;
			},
			
			//html: function( a ) {
			//	return a == null ?
			//		this[0] && this[0].innerHTML :
			//		this.empty().append( Array.prototype.join.call( a.charAt ? arguments : a ) );
			//},
			
			// Like .appendTo() but replaces existing content instead
			// of appending the new content.
			into: function( s ) {
				$(s).html( this );
				return this;
			},
			
			//sniffImage: function( callback ) {
			//	return this
			//		.css({ visibility:'hidden' })
			//		.appendTo('body')
			//		.load( function() {
			//			callback.call( this, this );
			//			image.width = this.width;
			//			image.height = this.height;
			//			$(this).remove();
			//			ready();
			//		});
			//},
			
			// Toggle an attribute on or off depending on whether 'on' is true.
			toggleAttr: function( name, value, on ) {
				return on ? this.attr( name, value ) : this.removeAttr( name );
			},
			
			// Do a .slideDown() or .slideUp() to toggle visibility.
			toggleSlide: function( speed, callback ) {
				return this[ this.is(':hidden') ? 'slideDown' : 'slideUp' ]( speed, callback );
			}
			
		});
		
	})( jQuery );
	
})();
