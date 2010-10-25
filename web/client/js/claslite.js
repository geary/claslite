// claslite.js
// Copyright 2010 Carnegie Institution for Science and Michael Geary
// Use under any Open Source license:
// http://www.opensource.org/licenses/

(function() {
	
	var app;
	var layout = {
		sidebarWidth: 350
	};
	
	var monthNames = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];
	S.extend( $.fn.mColorPicker.defaults, {
		imageFolder: 'images/mColorPicker/'
	});
	S.extend( $.fn.mColorPicker.init, {
		replace: '.color-picker',
		showLogo: false
	});

	$().ready( initUI );
	
	function initUI() {
		initVars();
		initTabs();
		initRangeInputs();
		initDateSelectors();
		initLegends();
		initSizer();
		resize();
		initMap();
		$('#outermost').show();
		resize();
	}
	
	function initVars() {
		app = {
			$window: $(window),
			$main: $('#main'),
			$tabs: $('#tabs'),
			$sidebarOuter: $('#sidebar-outer'),
			$sidebar: $('#sidebar'),
			$mapwrap: $('#mapwrap'),
			_: null
		};
	}
	
	function initTabs() {
		app.tabs = S.Tabs({
			parent: '#tabs',
			panels: '#sidebar',
			tabs: {
				location: 'Location',
				forestcover: 'Forest Cover',
				forestchange: 'Forest Change',
				help: 'Help'
			},
			click: function( id ) {
				//$('#sidebar').html( this.tabs[id] );
			}
		});
		
		app.tabs.select( 'location' );
	}
	
	function initRangeInputs() {
		$("input:range").rangeinput();
	}
	
	function initDateSelectors() {
		var options = [];
		for( var year = 2000;  year <= 2010;  ++year ) {
			for( var month = 1;  month <= 12;  ++month ) {
				options.push(
					'<option value="', year, '-', padDigits( month, 2 ), '">',
						monthNames[ month - 1 ], ' ', year,
					'</option>'
				);
			}
		}
		$('select.forestchange-date').html( options.join('') );
	}
	
	function padDigits( value, digits ) {
		return ( '' + ( value + 100000000 ) ).slice( -digits );
	}
	
	function initLegends() {
		addLegend( '#deforestation-legend' );
		addLegend( '#disturbance-legend' );
	}
	
	function addLegend( legend ) {
		var colors = [ '#FF0000', '#FF4400', '#FF8800', '#FFCC00', '#FFFF00' ];
		$.S(
			'<div class="legend-colors">',
				colors.map( function( color, i ) {
					return S(
						'<div class="legend-color" style="background-color:', color, '">',
						'</div>',
						'<div class="legend-label">',
							i == 0 ? 'Recent' : i == colors.length - 1 ? 'Oldest' : '',
						'</div>',
						'<div class="clear-both">',
						'</div>'
					)
				}).join(''),
			'</div>'
		).appendTo( legend );
	}
	
	function initMap() {
		//var bounds = [ -26, -80, 5, -35 ];
		var bounds = [ -13.186159, -70.962916, -10.960249, -68.705582 ];
		app.map = new S.Map( app.$mapwrap );
		app.map.fitBounds.apply( app.map, bounds );
		// HACK FOR V2 MAPS API:
		setTimeout( function() {
			app.map.fitBounds.apply( app.map, bounds );
		}, 100 );
		// END HACK
		
		app.map.geoclick({
			form: '#location-search-form',
			input: '#location-search-input',
			list: '#location-results-list',
			onclick: function() {
				app.tabs.select( 'location' );
			}
		});
		
		app.map.addLayer({
			minZoom: 6,
			maxZoom: 14,
			//tiles: 'http://claslite.geary.joyeurs.com/tiles/peru_redd_2007_mosaic_frac_tif/{Z}/{X}/{Y}.png'
			tiles: 'http://claslite.geary.joyeurs.com/tiles/peru_redd_2009_peru_redd_forestcover_geotiff_rgb/{Z}/{X}/{Y}.png'
		});
	}
	
	function initSizer() {
		$(window).resize( resize );
	}
	
	function resize() {
		var ww = app.$window.width(), wh = app.$window.height();
		app.$main.css({ height: wh - app.$main.offset().top });
		app.$mapwrap.css({ width: ww - layout.sidebarWidth - 1 });
		app.map && app.map.resize();
	}
	
})();
