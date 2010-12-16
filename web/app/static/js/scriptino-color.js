// Scriptino Color
// Copyright 2010 Michael Geary - http://mg.to/
// Use under any Open Source license:
// http://www.opensource.org/licenses/

(function( S, $ ) {
	
	S.Color = {
		
		hexToHsv: function( hex ) {
			var m = hex.match( /^#(\w\w)(\w\w)(\w\w)$/ );
			return S.Color.rgbToHsv(
				parseInt( m[1], 16 ),
				parseInt( m[2], 16 ),
				parseInt( m[3], 16 )
			);
		},
		
		hsvToHex: function( hsv ) {
			function hex( n ) {
				n = Math.floor( n );
				return ( n < 16 ? '0' : '' ) + n.toString( 16 );
			}
			var rgb = S.Color.hsvToRgb( hsv.h, hsv.s, hsv.v );
			return '#' + hex(rgb.r) + hex(rgb.g) + hex(rgb.b);
		},
		
		// Color conversion code from:
		// http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
		// Formulas adapted from:
		// http://en.wikipedia.org/wiki/HSL_color_space
		// http://en.wikipedia.org/wiki/HSV_color_space
		
		// Converts an RGB color value to HSL.
		// Assumes r, g, and b are contained in the set [0, 255] and
		// returns h, s, and l in the set [0, 1].
		rgbToHsl: function(r, g, b){
			r /= 255, g /= 255, b /= 255;
			var max = Math.max(r, g, b), min = Math.min(r, g, b);
			var h, s, l = (max + min) / 2;
			
			if(max == min){
				h = s = 0; // achromatic
			}else{
				var d = max - min;
				s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
				switch(max){
					case r: h = (g - b) / d + (g < b ? 6 : 0); break;
					case g: h = (b - r) / d + 2; break;
					case b: h = (r - g) / d + 4; break;
				}
				h /= 6;
			}
			
			return { h: h, s: s, l: l };
		},
		
		// Converts an HSL color value to RGB.
		// Assumes h, s, and l are contained in the set [0, 1] and
		// returns r, g, and b in the set [0, 255].
		hslToRgb: function(h, s, l){
			var r, g, b;
			
			if(s == 0){
				r = g = b = l; // achromatic
			}else{
				function hue2rgb(p, q, t){
					if(t < 0) t += 1;
					if(t > 1) t -= 1;
					if(t < 1/6) return p + (q - p) * 6 * t;
					if(t < 1/2) return q;
					if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
					return p;
				}
				
				var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
				var p = 2 * l - q;
				r = hue2rgb(p, q, h + 1/3);
				g = hue2rgb(p, q, h);
				b = hue2rgb(p, q, h - 1/3);
			}
			
			return { r: r*255, g: g * 255, b: b * 255 };
		},
		
		// Converts an RGB color value to HSV.
		// Assumes r, g, and b are contained in the set [0, 255] and
		// returns h, s, and v in the set [0, 1].
		rgbToHsv: function(r, g, b){
			r = r/255, g = g/255, b = b/255;
			var max = Math.max(r, g, b), min = Math.min(r, g, b);
			var h, s, v = max;
			
			var d = max - min;
			s = max == 0 ? 0 : d / max;
			
			if(max == min){
				h = 0; // achromatic
			}else{
				switch(max){
					case r: h = (g - b) / d + (g < b ? 6 : 0); break;
					case g: h = (b - r) / d + 2; break;
					case b: h = (r - g) / d + 4; break;
				}
				h /= 6;
			}
			
			return { h: h, s: s, v: v };
		},
		
		// Converts an HSV color value to RGB.
		// Assumes h, s, and v are contained in the set [0, 1] and
		// returns r, g, and b in the set [0, 255].
		hsvToRgb: function(h, s, v){
			var r, g, b;
			
			var i = Math.floor(h * 6);
			var f = h * 6 - i;
			var p = v * (1 - s);
			var q = v * (1 - f * s);
			var t = v * (1 - (1 - f) * s);
			
			switch(i % 6){
				case 0: r = v, g = t, b = p; break;
				case 1: r = q, g = v, b = p; break;
				case 2: r = p, g = v, b = t; break;
				case 3: r = p, g = q, b = v; break;
				case 4: r = t, g = p, b = v; break;
				case 5: r = v, g = p, b = q; break;
			}
			
			return { r: r * 255, g: g * 255, b: b * 255 };
		},
		
		// From: http://stackoverflow.com/questions/2593832
		hsvGradient: function( steps, hsvColors ) {
			steps -= 1;  // one less to leave room for final color
			var parts = hsvColors.length - 1;
			var gradient = new Array(steps);
			var gradientIndex = 0;
			var partSteps = Math.floor(steps / parts);
			var remainder = steps - (partSteps * parts);
			for (var col = 0; col < parts; col++) {
				// get colors
				var c1 = hsvColors[col], c2 = hsvColors[col + 1];
				// determine clockwise and counter-clockwise distance between hues
				var distCCW = (c1.h >= c2.h) ? c1.h - c2.h : 1 + c1.h - c2.h;
						distCW = (c1.h >= c2.h) ? 1 + c2.h - c1.h : c2.h - c1.h;
				 // ensure we get the right number of steps by adding remainder to final part
				if (col == parts - 1) partSteps += remainder; 
				// make gradient for this part
				for (var step = 0; step < partSteps; step ++) {
					var p = step / partSteps;
					// interpolate h, s, v
					var h = (distCW <= distCCW) ? c1.h + (distCW * p) : c1.h - (distCCW * p);
					if (h < 0) h = 1 + h;
					if (h > 1) h = h - 1;
					var s = (1 - p) * c1.s + p * c2.s;
					var v = (1 - p) * c1.v + p * c2.v;
					// add to gradient array
					gradient[gradientIndex++] = {h:h, s:s, v:v};
				}
			}
			gradient[gradientIndex++] = c2;  // complete gradient with final color
			return gradient;
		},
		
		hexGradient: function( steps, hexColors ) {
			var hsvColors = hexColors.map( S.Color.hexToHsv );
			var gradient = S.Color.hsvGradient( steps, hsvColors );
			return gradient.map( S.Color.hsvToHex );
		}
	};
	
})( Scriptino, jQuery );
