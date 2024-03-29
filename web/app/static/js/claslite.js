// claslite.js
// By Michael Geary - http://mg.to/
// See UNLICENSE or http://unlicense.org/ for public domain notice.

//(function() {
	
	var app;
	var layout = {
		sidebarWidth: 350
	};
	
	$.jsonRPC.setup({
		endPoint: '/rpc'
	});
	
	S.extend( $.fn.mColorPicker.defaults, {
		imageFolder: 'images/mColorPicker/'
	});
	S.extend( $.fn.mColorPicker.init, {
		replace: false,
		showLogo: false
	});
	
	//var monthNames = [
	//	'January', 'February', 'March', 'April', 'May', 'June',
	//	'July', 'August', 'September', 'October', 'November', 'December'
	//];
	
	$.fn.fillSelect = function( list, initial, changed ) {
		this
			.html( list.map( function( item ) {
				return S(
					//'<option value="', year, '-', padDigits( month, 2 ), '">',
					//	monthNames[ month - 1 ], ' ', year,
					//'</option>'
					'<option value="', item.value, '">',
						item.text,
					'</option>'
				);
			}).join('') )
			.bind( 'change keyup', function( event ) {
				changed && changed.apply( this, arguments );
			});
		if( initial != null )
			this.val( initial );
	}
	
	$().ready( initUI );
	
	function initUI() {
		initGoogleTranslate();
		initVars();
		initHelp();
		initTabs();
		initHider();
		initProject();
		initShapeForm();
		initViewButtons();
		initDownloadButtons();
		initCalcButtons();
		initRangeInputs();
		initDateSelects();
		initUnitSelects();
		initColorPickers();
		initForestChangeColorPanels();
		initSizer();
		resize();
		initMap();
		activateDefaultTab();
		app.$outermost.show();
		resize();
	}
	
	function initVars() {
		app = {
			layers: {},
			units: {
				//area:
			},
			fractcover: {
				map: {
				},
				stats: {
					dates: {}
				}
			},
			forestcover: {
				map: {
				},
				stats: {
					dates: {}
				}
			},
			forestchange: {
				map: {
				},
				stats: {
					//ranges: {}
				}
			},
			viewed: {},
			$window: $(window),
			$outermost: $('#outermost'),
			$main: $('#main'),
			$tabs: $('#tabs'),
			$sidebarHider: $('#sidebar-hider'),
			$sidebarOuter: $('#sidebar-outer'),
			$tabPanels: $('#sidebar-top-panel, #sidebar-padder'),
			$sidebarTopPanel: $('#sidebar-top-panel'),
			$sidebarScrolling: $('#sidebar-scrolling'),
			$fractCoverDate: $('#fractcover-date'),
			$forestCoverDate: $('#forestcover-date'),
			$forestChangeDateStart: $('#forestchange-date-start'),
			$forestChangeDateEnd: $('#forestchange-date-end'),
			$deforestationRadio: $('#deforestation-radio'),
			$disturbanceRadio: $('#disturbance-radio'),
			$bothRadio: $('#both-radio'),
			$units: $('#statistics-units-select'),
			$mapwrap: $('#mapwrap'),
			$statswrap: $('#statswrap'),
			$mapstatswrap: $('#mapwrap,#statswrap'),
			_: null
		};
	}
	
	function clickTab( id, full ) {
		id = getSubTab( id );
		var activate = activateTab[id];
		activate && activate( id, /*full*/true );
		if( $('#help-content').is(':visible') ) loadSidebarHelp();
		// TODO: without the setTimeout, it doesn't get the correct height
		// the first time, not sure why
		setTimeout( resizeSidebarHeight, 1 );
	}
	
	// TODO: use tab hiders to simplify this code
	var activateTab = {
		project: function() {
			disableGeoclick();
			removeLayers();
			autoSaveProject();
		},
		location: function() {
			enableGeoclick();
			removeLayers();
		},
		// TODO: refactor!
		fractcover: function( id, full ) {
			disableGeoclick();
			removeLayers();
			if( full ) loadDateSelects();
			if( app.$outermost.is('.stats') ) {
				//addStatistics( id );
			}
			else if( app.viewed.fractcover ) {
				viewFractCoverLayer( 'tiles' );
			}
		},
		forestcover: function( id, full ) {
			disableGeoclick();
			removeLayers();
			if( full ) loadDateSelects();
			if( app.$outermost.is('.stats') ) {
				//addStatistics( id );
				viewForestCoverLayer( 'stats' );
			}
			else if( app.viewed.forestcover ) {
				viewForestCoverLayer( 'tiles' );
			}
		},
		forestchange: function( id, full ) {
			function view( mode ) {
				var t = getForestChangeTypes();
				if( t.deforestation ) viewForestChangeLayer( mode, 'deforestation' );
				if( t.disturbance ) viewForestChangeLayer( mode, 'disturbance' );
			}
			disableGeoclick();
			removeLayers();
			if( full ) loadDateSelects();
			if( app.$outermost.is('.stats') ) {
				//addStatistics( id );
				view( 'stats' );
			}
			else {
				if( app.viewed.forestchange ) {
					view( 'tiles' );
				}
			}
		},
		help: function() {
			disableGeoclick();
			removeLayers();
		}
	};
	
	function getForestChangeTypes() {
		// TODO: there's probably a simpler way to do this:
		var both = app.$bothRadio.is(':checked');
		return {
			deforestation: both || app.$deforestationRadio.is(':checked'),
			disturbance: both || app.$disturbanceRadio.is(':checked')
		}
	}
	
	function getSubTab( id ) {
		var subst = app.tabOpts.subst[id] || id;
		var $outer = app.$outermost;
		$outer.removeClass().addClass( id ).addClass( subst );
		function addView( view ) {
			$outer
				.addClass( view )
				.addClass( id + '-' + view )
				.addClass( subst + '-' + view );
		}
		var button = $('#'+subst+'-input-form-top button.submit')[0];
		var split = button && button.id.split('-')[2];
		addView( split );
		if( subst != 'forestview' )
			addView( 'map' );
		return id;
	}
	
	function initTabs() {
		app.tabOpts = {
			parent: '#tabs',
			panels: app.$tabPanels,
			alwaysShow: '#help-section',
			tabs: {
				project: 'Project',
				location: 'Location',
				forestcover: 'Forest Cover',
				forestchange: 'Forest Change',
				fractcover: 'Fractional Cover',
				help: 'Help'
			},
			subst: {
				fractcover: 'forestview',
				forestcover: 'forestview',
				forestchange: 'forestview'
			},
			click: function( id ) {
				clickTab( id, true );
			}
		};
		app.tabs = S.Tabs( app.tabOpts );
		
		$('form.input-form').submit( function( event ) {
			event.preventDefault();
			// TODO: this could be cleaner
			if( app.$outermost.is('.map') )
				app.viewed[app.tabs.selected] = true;
			clickTab( app.tabs.selected, false );
		});
	}
	
	function activateDefaultTab() {
		var tab = location.hash.replace( /^#/, '' );
		app.tabs.select( app.tabOpts.tabs[tab] ? tab : 'location' );
	}
	
	function initHider() {
		app.$sidebarHider.click( toggleSidebar );
	}
	
	function toggleSidebar( show ) {
		app.$main.toggleClass( 'show-sidebar', show );
		resize();
	}
	
	function initProject() {
		var $projectDeleteButton = $('#project-delete-button');
		var combo = S.Combo({
			input: '#project-input',
			list: '#project-list',
			onchange: onchange,
			ondelete: ondelete,
			onundelete: ondelete
		});
		app.project = { combo: combo }
		
		$('#project-form').submit( function() {
			var name = combo.$input.val();
			var $match = combo.inlist();
			if( $match ) {
				$.jsonRPC.request(
					'project_get',
					[ $match[0].getAttribute('value') ], {
					success: function( rpc ) {
						applySettings( rpc.result.settings );
					},
					error: function( result ) {
						alert( 'Error loading project' );  // TODO: better errors
					}
				});
			}
			else {
				$.jsonRPC.request(
					'project_new',
					[ name, getSettingsJSON() ], {
					success: function( rpc ) {
						load();  // TODO: optimize
						//$('<li>').text( combo.$input.val() ).appendTo( combo.$list );
					},
					error: function( result ) {
						alert( 'Error creating project' );  // TODO: better errors
					}
				});
			}
			return false;
		});
		
		load();
		
		function load() {
			$.jsonRPC.request( 'project_list', [], {
				success: function( rpc ) {
					var list = rpc.result.projects.map( function( project ) {
						return S(
							'<li value="', project.key, '">',
								'<div class="text project-name">',
									project.name,
								'</div>',
								'<div class="delete inline-block sprite icon16 icon16-cross">',
								'</div>',
								'<div class="undelete inline-block">',
									'Undo',
								'</div>',
							'</li>'
						);
					});
					combo.$list.html( list.join('') );
					onchange();
				},
				error: function(result) {
					combo.$list.html( '<li><i>Error loading project list</i></li>' );
				}
			});
		}
		function onchange() {
			$('#project-form').toggleClass( 'inlist', !! combo.inlist() );
		}
		function ondelete() {
			$projectDeleteButton.toggle(
				$('#project-list > li.deleted').length > 0
			);
		}
		
		$projectDeleteButton.click( function() {
			function error() {
				$projectDeleteButton.show();
				$('#project-list > li.deleted').show();
				alert( 'Error deleting projects' );  // TODO: better errors
			}
			$projectDeleteButton.hide();
			var keys = $('#project-list > li.deleted')
				.hide()
				.map( function( i, e ) { return e.getAttribute('value'); })
				.toArray();
			$.jsonRPC.request(
				'project_delete',
				[ keys ], {
				success: function( rpc ) {
					if( rpc.result.error ) error();
				},
				error: function( result ) {
					error();
				}
			});
			return false;
		});
	}
	
	function initShapeForm() {
		$('#location-shape-form').iform({
			success: function( data ) {
				var geo = data.geo;
				if( geo.type != 'FeatureCollection' ) return;
				var b, f;
				geo.features.forEach( function( feature ) {
					f = feature;
					b = feature.bbox;
					feature.fillColor = '#000000';
					feature.fillOpacity = .1;
					feature.strokeColor = '#000000';
					feature.strokeOpacity = .7;
					feature.strokeWidth = 1;
				});
				// TODO: let user select from list. For now, just use one.
				if( geo.features.length == 1 ) {
					app.map.fitBounds( b[1], b[0], b[3], b[2] );
					app.gonzo = new PolyGonzo.PgOverlay({
						map: app.map.map,
						geo: geo,
						events: {
							mousemove: function( event, where ) {
								var feature = where && where.feature;
								// TODO: add mouseenter/leave to PG and
								// use instead of mousemove/overFeature
								if( feature != app.overFeature ) {
									//if( feature ) feature.container = geo;
									//trigger( 'over', feature );
									app.overFeature = feature;
								}
							},
							click: function( event, where ) {
								var feature = where && where.feature;
								//if( feature ) feature.container = geo;
								//trigger( 'click', feature );
							}
						}
					});
					app.gonzo.setMap( app.map.map );
				}
			}
		});
	}
	
	// Temp
	
	function twoDigits( n ) {
		return ( n < 10 ? '0' : '' ) + n;
	}
	
	function formatDateTime( date ) {
		return S(
			date.getFullYear(),
			'-',
			date.getMonth() + 1,
			'-',
			date.getDate(),
			' ',
			twoDigits( date.getHours() ),
			':',
			twoDigits( date.getMinutes() ),
			':',
			twoDigits( date.getSeconds() )
		);
	}
	
	function autoSaveProject() {
		var $input = $('#project-input');
		$input.val( S(
			'My Project ', formatDateTime( new Date )
		) );
		setTimeout( function() {
			$input.focus().select();
		}, 20 );
	}
	
	// TODO: refactor initViewButtons() and dirtyView() into a button manager
	function initViewButtons() {
		$('button.view-button').click( function() {
			$button = $(this);
			$button
				.blur()
				.parent()
					.find('button.submit')
						.removeClass('submit')
					.find('div.icon16')
						.removeClass('icon16-tick icon16-arrow-circle')
						.addClass('hide');
			$button
				.addClass( 'submit' )
				.find('div.icon16')
					.addClass('icon16-tick')
					.removeClass('hide');
		});
	}
	
	function dirtyView() {
		//$('button.view-button.submit div.icon16')
		//	.removeClass('icon16-tick')
		//	.addClass('icon16-arrow-circle');
	}
	
	function initCalcButtons() {
		$('#view-forestview-add').click( function( event ) {
			// TODO: refactor
			if( app.$outermost.is('.fractcover') ) {
				var index = app.$fractCoverDate.val();
				var set = app.fractcover.stats.dates;
			}
			else if( app.$outermost.is('.forestcover') ) {
				var index = app.$forestCoverDate.val();
				var set = app.forestcover.stats.dates;
			}
			else {  // forest change
				return;
			}
			if( set[index] ) {
				//event.preventDefault();
			}
			set[index] = true;
		});
	}
	
	function initDownloadButtons() {
		$('#view-forestview-download').click( function( event ) {
			// TODO: refactor
			if( app.$outermost.is('.fractcover') ) {
				viewFractCoverLayer( 'download' );
			}
			else if( app.$outermost.is('.forestcover') ) {
				viewForestCoverLayer( 'download' );
			}
			else {
				var t = getForestChangeTypes();
				if( t.deforestation ) viewForestChangeLayer( 'download', 'deforestation' );
				if( t.disturbance ) viewForestChangeLayer( 'download', 'disturbance' );
			}
			return false;
		});
	}
	
	function initRangeInputs() {
		$('input:range').rangeinput({ precision: 0 });
	}
	
	function initDateSelects() {
		// TODO: refactor
		$('select.date-start')
			.fillSelect( [], null, function( event ) {
				var end = $(this).parent().find('.date-end')[0];
				if( end  &&  this.selectedIndex > end.selectedIndex )
					end.selectedIndex = this.selectedIndex;
				updateForestChangeColorPanels();
				dirtyView();
			});
		
		$('select.date-end')
			.fillSelect( [], null, function( event ) {
				var start = $(this).parent().find('.date-start')[0];
				if( this.selectedIndex < start.selectedIndex )
					start.selectedIndex = this.selectedIndex;
				updateForestChangeColorPanels();
				dirtyView();
			});
		
		clearDateSelects();
		
		$('#sat-select').bind( 'change keyup', function() {
			// TODO: don't do this if the selection hasn't really changed
			clearDateSelects();
			loadDateSelects();
		});
	}
	
	function initUnitSelects() {
		app.$units.bind( 'change keyup', function() {
			$(this).closest('form').submit();
		});
	}
	
	function padDigits( value, digits ) {
		return ( '' + ( value + 100000000 ) ).slice( -digits );
	}
	
	function initColorPickers( root ) {
		var $root = $( root || 'body' );
		$root.find('input.color-picker').mColorPicker()
		$root.find('input.mColorPickerInput').click( function( event ) {
			$(this).next().trigger( 'click', event );
		});
	}
	
	function updateForestChangeColorPanels() {
		if( app.$outermost.is('.forestchange.map') ) {
			updateForestChangeColorPanel( 'deforestation', true );
			updateForestChangeColorPanel( 'disturbance', true );
		}
	}
	
	function makeColorPicker( id, name, value, label, check ) {
		return S(
			'<div class="color-picker-row">',
				check ? '<input type="checkbox" class="color-picker-check" checked="checked" />' : '',
				'<input class="color-picker" data-hex="true" name="', name, '" id="', id, '" value="#', value, '">',
				'<label for="', id, '">', label, '</label>',
			'</div>'
		);
	}
	
	function initForestChangeColorPanels() {
		initForestChangeColorPanel( 'deforestation' );
		initForestChangeColorPanel( 'disturbance' );
	}
	
	function initForestChangeColorPanel( id ) {
		var $legend = $( '#' + id + '-legend' );
		$legend.delegate( 'input[type="checkbox"]', 'click', function( event ) {
			var $checkbox = $(this);
			$checkbox.parent().toggleClass( 'disabled', ! $checkbox.is(':checked') );
		});
		$legend.setHider( '.legend-hider', '.legend-colors', function( expand ) {
			if( expand ) {
				updateForestChangeColorPanel( id );
			}
		});
	}
	
	function updateForestChangeColorPanel( id, reset ) {
		var $colors = $('#'+id+'-legend-colors');
		if( reset ) $colors.empty();
		else if( ! $colors.is(':empty') ) return;
		$colors.html( getForestChangeColorPanel(id) );
		initColorPickers( $colors );
	}
	
	function opacitySlider( id ) {
		return S(
			'<div class="opacity-slider">',
				'<label for="', id, '-opacity" class="slider-label">Opacity</label>',
				'<input type="range" class="range layer-slider" min="0" max="100" value="50" id="', id, '-opacity" />',
				'<div class="clear-both">',
				'</div>',
			'</div>'
		);
	}
	
	function getOpacity( id ) {
		return $('#'+id+'-opacity').data('rangeinput').getValue() / 100;
	}
	
	function setOpacity( id, value ) {
		$('#'+id+'-opacity').data('rangeinput').setValue( value * 100 );
	}
	
	$.fn.setHider = function( hider, content, callback ) {
		var $wrapper = $(this),
			$hider = $wrapper.find(hider),
			$icon = $hider.find('.icon16'),
			$content = $wrapper.find(content);
		function expanded() {
			return $icon.is('.icon16-toggle');
		}
		$hider.click( function() {
			var expand = ! expanded();
			$icon
				.removeClass( 'icon16-toggle icon16-toggle-expand' )
				.addClass( expand ? 'icon16-toggle' : 'icon16-toggle-expand' );
			$content.toggle( expand );
			callback && callback( expand );
		});
	};
	
	function getForestChangeYears( withStart ) {
		var iStart = app.$forestChangeDateStart[0].selectedIndex +
			( withStart ? 0 : 1 );
		var iEnd = app.$forestChangeDateEnd[0].selectedIndex + 1;
		var years = [];
		for( var i = iStart;  i <= iEnd;  ++i )
			years.push( app.years[i] );
		return years;
	}
	
	var tempForestChangeColorLimits = { oldest:'FFFF00', newest:'FF0000' };
	
	function getForestChangeColorPanel( id ) {
		var years = getForestChangeYears();
		if( years.length < 1 ) return '';
		
		var gradient = S.Color.hexGradient( years.length, [ tempForestChangeColorLimits.oldest, tempForestChangeColorLimits.newest ] );
		return S(
			'<div>',
				gradient.map( function( color, i ) {
					var year = years[i];
					return makeColorPicker( id + '-' + year, id, color, year, true );
				}).join(''),
			'</div>'
		);
	}
	
	function getForestChangeStaticPanel( id, label, checked ) {
		return S(
			'<div id="', id, '-layer">',
				'<input type="radio" name="forestchange-layer-radio" id="', id, '-radio" ', checked ? 'checked="checked" ' : '', '/>',
				'<label for="', id, '-radio">', label, '</label>',
				'<div id="', id, '-legend">',
					'<div class="legend-wrapper">',
						opacitySlider( id ),
						'<div>',
							'<span class="legend-hider hider">',
								'<div class="inline-block sprite icon16 icon16-toggle-expand">',
								'</div>',
								' ',
								'Set Colors',
							'</span>',
							'<div id="', id, '-legend-colors" class="legend-colors">',
							'</div>',
						'</div>',
					'</div>',
				'</div>',
			'</div>'
		);
	}
	
	function enableGeoclick() {
		if( app.$outermost.is('.searchmap') ) {
			app.geoclick && app.geoclick.enable();
		}
		else {
			app.gonzo && app.gonzo.setMap( app.map.map );
		}
	}
	
	function disableGeoclick() {
		app.geoclick && app.geoclick.disable();
		app.gonzo && app.gonzo.setMap( null );
	}
	
	function EarthImage() {
		//if( this == window ) return new EarthImage();
		S.extend( this, {
			step: function( creator ) {
				return {
					creator: creator,
					args: Array.prototype.slice.call( arguments, 1 )
				};
			}
		});
	}
	
	function callEarthEngine( action, opt, on ) {
		function ee() {
			$.jsonRPC.request( 'earthengine_map', [ action, opt ], {
				success: function( rpc ) {
					var error = rpc.result.error;
					if( error ) {
						console.log('error: ' + error.type);
						if( error.type == 'DeadlineExceededError' ) {
							setTimeout( ee, 10000 );
							return;
						}
						// TODO: better error reporting
						alert(
							error.type == 'no_images' ?
								'No images available for the selected year.' :
							error.code && error.message ?
								'Error ' + error.code + ':\n' + error.message :
							// else
								'Error'
						);
						return;
					}
					on.success && on.success( rpc.result );
				},
				error: function( result ) {
					window.console && console.log( S(
						'Server error on ',  action, ' - ', result && result.error
					) );  // TODO: better errors
					on.error && on.error( result );
				}
			});
		}
		
		ee();
	}
	
	function viewEarthEngineLayer( action, opt ) {
		var download = ( action == 'download' );
		var g = getMapEdges();
		// TODO: duplicate code
		opt = S.extend(
			{
				sat: $('#sat-select').val().split('|'),
				bbox: getMapBbox()
			},
			download && {
				crs: $('#projection-select').val(),
				region: JSON.stringify({
					type: 'LinearRing',
					coordinates: [
						[ g.w, g.s ], [ g.w, g.n ], [ g.e, g.n ], [ g.e, g.s ]
					]
				})
			},
			opt
		);
		
		callEarthEngine( action, opt, download ? {
			success: function( result ) {
				window.location = S(
					'https://earthengine.googleapis.com/api/download?',
					'docid=', result.data.docid,
					'&token=', result.data.token
				);
			},
			error: function( result ) {
			}
		} : action == 'tiles' ? {
			success: function( result ) {
				addLayer( opt.type || opt.mode, result.tiles );
			},
			error: function( result ) {
			}
		} : action == 'stats' ? {
			success: function( result ) {
				addStatistics( result.stats, opt );
			},
			error: function( result ) {
				//debugger;
				// TODO: retry
			}
		} : {
		});
	}
	
	//function listEarthEngineAssets( year, bounds, callback ) {
	//	var ne = bounds.getNorthEast(), sw = bounds.getSouthWest(),
	//		n = ne.lat(), e = ne.lng(), s = sw.lat(), w = sw.lng();
	//	//console.log( S( 'bbox=', w.toFixed(2), ',', s.toFixed(2), ',', e.toFixed(2), ',', n.toFixed(2) ) );
	//	var ee = new S.EarthEngine;
	//	var request = {
	//		sat: $('#sat-select').val(),
	//		region: [ e, s, w, n ].join(),
	//		fields: 'ACQUISITION_DATE'
	//	};
	//	ee.list( request, function( assets ) {
	//		//console.dir( assets );
	//		//$('#assets-list').html( S(
	//		//	'<div class="assets">',
	//		//		assets.map( function( asset ) {
	//		//			return S(
	//		//				'<div class="asset">',
	//		//					asset
	//		//				'</div>'
	//		//			);
	//		//		}).join(''),
	//		//	'</div>'
	//		//) );
	//	});
	//}
	
	function makeFractCoverPalette() {
		return [
			/* TODO */
			'000000',
			'888888',
			'FFFFFF'
		];
	}
	
	function makeForestCoverPalette() {
		return makePalette([
			$('#unobserved-color')[0],
			$('#nonforest-color')[0],
			$('#forest-color')[0]
		]);
	}
	
	function makeForestChangePalette( type ) {
		var $pickers = $('#'+type+'-legend-colors input.color-picker');
		if( $pickers.length )
			return makePalette( $pickers.toArray() );
		// Kind of a hack for when palette is not expanded
		var years = getForestChangeYears();
		if( years.length < 1 ) return '';
		return S.Color.hexGradient( years.length, [ tempForestChangeColorLimits.oldest, tempForestChangeColorLimits.newest ] );
		
	}
	
	function makePalette( pickers ) {
		return pickers.map( function( input ) {
			return input.value.slice(1);
		});
	}
	
	function getMapCenterTinyBbox() {
		var c = app.map.getCenter(), d = .00001;
		return [ c.lng - d, c.lat - d, c.lng + d, c.lat + d ];
	}
	
	function fillDateSelectsDisabled( text ) {
		$('select.date-select').html( S(
			'<option style="color:white;" class="select-disabled" selected="selected" disabled="disabled">',
				text,
			'</option>'
		) );
	}
	function clearDateSelects() {
		makeDateSelectsDotty( false );
		fillDateSelectsDisabled( '&nbsp;' );
	}
	
	function fillDateSelectsNone() {
		makeDateSelectsDotty( false );
		fillDateSelectsDisabled( 'None' );
	}
	
	function makeDateSelectsDotty( dotty ) {
		var dot = '&bull;';
		var my = makeDateSelectsDotty;
		if( my.timer ) {
			clearInterval( my.timer );
			delete my.timer;
		}
		if( dotty ) {
			my.dots = dot;
			my.timer = setInterval( function() {
				fillDateSelectsDisabled( my.dots );
				my.dots += dot;
				if( my.dots.length / dot.length > 6 ) my.dots = dot;
			}, 500 );
		}
	}
	
	var satboxLatest;
	//var satboxesDateSelects = {};
	function loadDateSelects() {
		
		function fill( $select, years ) {
			var save = $select.val();
			$select.html(
				S.mapJoin( years, function( year ) {
					return S(
						'<option value="', year, '" ',
							year == save ? 'selected="selected"' : '',
						'>',
							year,
						'</option>'
					);
				})
			);
		}
		
		function fillSelects( years ) {
			makeDateSelectsDotty( false );
			fill( app.$fractCoverDate, years );
			fill( app.$forestCoverDate, years );
			if( years.length > 1 ) {
				fill( app.$forestChangeDateStart,
					years.slice( 0, years.length - 1 ) );
				fill( app.$forestChangeDateEnd,
					years.slice( 1 ) );
			}
		}
		
		var sat =  $('#sat-select').val().split('|');
		
		var bbox = getMapCenterTinyBbox();
		var satbox = sat[1] + bbox.join();
		
		if( satbox == satboxLatest ) return;
		satboxLatest = satbox;
		
		//if( satboxesDateSelects[satbox] ) {
		//	fillSelects( satboxesDateSelects[satbox] );
		//}
		//else {
			makeDateSelectsDotty( true );
			$.jsonRPC.request(
				'earthengine_getyears', [{ sat:sat, bbox:bbox }],
				{
					success: function( rpc ) {
						if( rpc.result.error ) {
							fillDateSelectsNone();
						}
						else {
							var years = app.years = rpc.result.years;
							//satboxesDateSelects[satbox] = years;
							fillSelects( years );
						}
					},
					error: function( result ) {
						fillDateSelectsNone();
					}
				}
			);
		//}
	}
	
	// TODO: refactor
	function viewFractCoverLayer( action, opt ) {
		var year = +app.$fractCoverDate.val();
		viewEarthEngineLayer( action, S.extend({
			mode: 'fractcover',
			times: [ getYearTimes(year) ],
			palette: makeFractCoverPalette(),
			bias: $('#fractcover-bias').val(),
			gain: $('#fractcover-gain').val(),
			gamma: $('#fractcover-gamma').val()
		}, opt ) );
	}
	
	function viewForestCoverLayer( action, opt ) {
		var year = +app.$forestCoverDate.val();
		viewEarthEngineLayer( action, S.extend({
			mode: 'forestcover',
			times: [ getYearTimes(year) ],
			palette: makeForestCoverPalette()
		}, opt ) );
	}
	
	function viewForestChangeLayer( action, type ) {
		viewEarthEngineLayer( action, {
			mode: 'forestchange',
			type: type,
			times: getForestChangeYears( true ).map( getYearTimes ),
			palette: makeForestChangePalette( type )
		});
	}
	
	function getYearTimes( year ) {
		return {
			year: year,
			starttime: Date.UTC( year, 0, 1 ),
			endtime: Date.UTC( year+1, 0, 1 )
		}
	}
	
	function addLayer( id, tiles ) {
		console.log('tiles')
		console.log(tiles)
		console.log('mapid: ' + tiles.mapid);
		console.log('token: ' + tiles.token);
		app.layers[id] = app.map.addLayer({
			minZoom: 3,
			maxZoom: 14,
			opacity: getOpacity( id ),
			spinner: {
				img: 'images/spinner32.gif',
				opacity: .5
			},
			tiles: S(
				'https://earthengine.googleapis.com/map/', tiles.mapid,
				'/{Z}/{X}/{Y}?token=', tiles.token
			)
		});
	}
	
	function removeLayers() {
		for( var id in app.layers ) {
			app.layers[id].remove();
			delete app.layers[id];
		}
	}
	
	function initMap() {
		var bounds = [ -26, -80, 5, -35 ];
		var mt = google.maps.MapTypeId;
		app.map = new S.Map( app.$mapwrap, {
			v3: {
				mapTypeId: mt.TERRAIN,
				scaleControl: true,
				streetViewControl: false,
				mapTypeControlOptions: {
					mapTypeIds: [
						mt.ROADMAP, mt.SATELLITE, mt.HYBRID, mt.TERRAIN,
						'black', 'white'
					]
				}
			}
		});
		
		if( S.Map.v3 ) {
			addSolidMapType( 'black', '#000000', 'Black', 'Show solid black background' );
			addSolidMapType( 'white', '#FFFFFF', 'White', 'Show solid white background' );
		}
		
		app.map.fitBounds.apply( app.map, bounds );
		if( app.map.v2 ) {
			// HACK FOR V2 MAPS API:
			setTimeout( function() {
				app.map.fitBounds.apply( app.map, bounds );
			}, 100 );
			// END HACK
		}
		else {
			//var ftl = new google.maps.FusionTablesLayer( 400828 );
			//ftl.setMap( app.map.map );
		}
		
		app.geoclick = new app.map.Geoclick({
			form: '#location-search-form',
			input: '#location-search-input',
			list: '#location-results-list',
			onclick: function() {
				app.tabs.select( 'location' );
			},
			onselect: function( name, bounds ) {
				app.location = { name:name, bounds:bounds };
			}
		});
		
		opacity( 'fractcover' );
		opacity( 'forestcover' );
		opacity( 'deforestation' );
		opacity( 'disturbance' );
		function opacity( id ) {
			$('#'+id+'-opacity').bind( 'onSlide change', function( event, value ) {
				app.layers[id] && app.layers[id].setOpacity( value / 100 );
			});
		}
	}
	
	function addSolidMapType( id, color, name, alt ) {
		app.map.map.mapTypes.set( id,
			new S.Map.v3.SolidMapType({ color:color, name:name, alt:alt })
		);
	}
	
	function setChart( sel, table, url, width, height, title ) {
		var chart = ! url ? '' : S(
			'<div class="statistics-chart" style="width:', width, 'px; height:', height, 'px; background-image:url(', url, ')">',
			'</div>'
		);
		table = ! table ? '' : S(
			'<div class="statistics-table-wrap">',
				table,
			'</div>'
		);
		setChartContent( sel, title, S( chart, table ) );
	}
	
	function setEmptyChart( sel, table, url, width, height, title ) {
		setChartContent( sel, title,
			'Select years and use the <b>Calculate</b> button on the left to add statistics'
		);
	}
	
	function setChartContent( sel, title, content ) {
		$(sel).html( S(
			'<div>',
				'<h2>',
					title || '',
				'</h2>',
				'<div class="statistics-block">',
					content || '',
				'</div>',
			'</div>'
		) );
	}
	
	var statLists = { forestCover: [] };
	statLists.forestCover.by_date = {};
	
	function addStatistics( stats, opt ) {
		var pixelSize = { width: 30, height: 30 };
		var units = app.$units.val().split('|'),
			unit = { value:units[0], abbr:units[1], name:units[2] },
			factor = pixelSize.width * pixelSize.height / unit.value;
		function U( value ) { return value * factor; }
		function num( value ) { return S.formatNumber( value, 2 ); }
		
		var height = 150, width = 600;
		
		var charts = {
			fractcover: function() {
			},
			
			forestcover: function() {
				var values = stats.count.values;
				var date = '' + opt.times[0].year;
				var pix = {
					date: date,
					forest: values.forest_pixel_count,
					nonforest: values.non_forest_pixel_count,
					unobserved: values.masked_pixel_count
				};
				pix.total = pix.forest + pix.nonforest + pix.unobserved;
				
				statLists.forestCover.push( pix );
				statLists.forestCover.by_date[date] = pix;
				app.forestcover.stats.dates[date] = true;
				
				var scaleMax = 0, labels = [], rows = [],
					forests = [], nonforests = [], unobserveds = [];
				S.sortSet(app.forestcover.stats.dates).forEach( function( date ) {
					var cover = statLists.forestCover.by_date[date];
					if( ! cover ) return;
					var
						forest = U(cover.forest),
						nonforest = U(cover.nonforest),
						unobserved = U(cover.unobserved);
					// Table
					rows.push( S(
						'<tr>',
							'<td>', date, '</td>',
							'<td>', num(forest), '</td>',
							'<td>', num(nonforest), '</td>',
							'<td>', num(unobserved), '</td>',
						'</tr>'
					) );
					// Chart
					labels.push( date );
					scaleMax = Math.max( scaleMax, forest + nonforest + unobserved );
					forests.push( forest );
					nonforests.push( nonforest );
					unobserveds.push( unobserved );
				});
				
				var container = '#forest-cover-chart', title = 'Forest Cover';
				if( ! rows.length ) {
					setEmptyChart( container, title );
					return;
				}
				
				var table = S(
					'<table class="stats-table">',
						'<thead>',
							'<tr>',
								'<th class="stats-table-topleft">&nbsp;</th>',
								'<th colspan="3">Area (', unit.name, ')</th>',
							'</tr>',
							'<tr>',
								'<th class="stats-table-x">Year</th>',
								'<th>Forest</th>',
								'<th>Non-Forest</th>',
								'<th>Unobserved</th>',
							'</tr>',
						'</thead>',
						'<tbody>',
							rows.join(''),
						'</tbody>',
					'</table>'
				);
				
				var url = S.ChartApi.barV({
					width: width,
					height: height,
					labels: labels,
					colors: [ '00FF00', 'EE9A00', '000000' ],
					data: [ [ forests.join(), nonforests.join(), unobserveds.join() ].join('|') ],
					scale: [ 0, scaleMax ],
					barWidth: [ 25, 20 ],
					legend: 'Forest|Non-Forest|Unobserved',
					legendPos: '|r',
					axes: 'x,y',
					axisRange: [ 1, 0, scaleMax ],
					axisFormat: '0,222222,13|1N*s*,222222,13'
				});
				
				setChart( container, table, url, width, height, title );
			},
			
			forestchange: function() {
				var scaleMax = 0, labels = [], rows = [],
					deforestations = [], disturbances = [];
				var totalpix = stats.TOTAL_PIX_CNT.values.counts;
				for( var i = 1;  i < opt.times.length;  ++i ) {
					var year = opt.times[i].year,
						startdate = '' + ( year - 1 ),
						enddate = '' + year,
						deforestation = stats.DEFORESTATION_PIX_CNT[i],
						disturbance = stats.DISTURBANCE_PIX_CNT[i];
					// Table
					function pct( value ) {
						return S.formatNumber( value / totalpix * 100, 3 ) + '%';
					}
					rows.push( S(
						'<tr>',
							'<td>', startdate, '</td>',
							'<td>', enddate, '</td>',
							'<td>', num(U(deforestation)), '</td>',
							'<td>', pct(deforestation), '</td>',
							'<td>', num(U(disturbance)), '</td>',
							'<td>', pct(disturbance), '</td>',
						'</tr>'
					) );
					
					// Chart
					labels.push( S( startdate.slice(-2), '-', enddate.slice(-2) ) );
					//labels.push( S( '-', enddate.slice(-2) ) );
					scaleMax = Math.max( scaleMax, deforestation, disturbance );
					deforestations.push( deforestation );
					disturbances.push( disturbance );
				}
				
				var container = '#forest-change-chart',
					title = S('Forest Change - Total Area ', num(U(totalpix)), ' ', unit.name );
				if( ! rows.length ) {
					setEmptyChart( container, title );
					return;
				}
				
				var table = S(
					'<table class="stats-table">',
						'<thead>',
							'<tr>',
								'<th class="stats-table-topleft">&nbsp;</th>',
								'<th class="stats-table-topleft">&nbsp;</th>',
								'<th colspan="2">Deforestation</th>',
								'<th colspan="2">Disturbance</th>',
							'</tr>',
							'<tr>',
								'<th class="stats-table-x">Start</th>',
								'<th class="stats-table-x">End</th>',
								'<th>Area (', unit.abbr, ')</th>',
								'<th>Rate</th>',
								'<th>Area (', unit.abbr, ')</th>',
								'<th>Rate</th>',
							'</tr>',
						'</thead>',
						'<tbody>',
							rows.join(''),
						'</tbody>',
					'</table>'
				);
				
				var url = S.ChartApi.barV({
					width: width,
					height: height,
					labels: labels,
					colors: [ 'FF0000', 'FFD000' ],
					data: [ [ deforestations.join(), disturbances.join() ].join('|') ],
					scale: [ 0, scaleMax ],
					//barWidth: [ 22, 10 ],
					barWidth: [ 25, 20 ],
					legend: 'Deforestation|Disturbance',
					legendPos: '|r',
					axes: 'x,y',
					axisRange: [ 1, 0, scaleMax ],
					axisFormat: '0,222222,13|1N*s*,222222,13'
				});
				
				setChart( container, table, url, width, height, title );
			}
		};
		
		charts[opt.mode]();
		
		// Old test code, save it for color bits
		//S.chart({
		//	container: '#statistics-chart' + ( suffix || '' ),
		//	list: json.statistics.images.map( function( image) {
		//		function get( sel, prop ) {
		//			return {
		//				color: $(sel).val(),
		//				value: image[prop]
		//			}
		//		}
		//		return {
		//			label: image.date,
		//			values: [
		//				get( '#statistics-forest-color', 'forestPixels' ),
		//				get( '#statistics-unobserved-color', 'unobservedPixels' ),
		//				get( '#statistics-nonforest-color', 'nonForestPixels' )
		//			]
		//		}
		//	})
		//});
	}
	
	function initSizer() {
		$(window).resize( resize );
	}
	
	function resize() {
		app.ww = app.$window.width();
		app.wh = app.$window.height();
		var mh = app.wh - app.$main.offset().top;
		app.$main.css({ height: mh });
		
		if( app.$main.is('.show-sidebar') ) {
			var sbw = layout.sidebarWidth + $.scrollBarWidth();
			app.$sidebarHider.css({ left: sbw + 1 });
			app.$sidebarOuter.css({ width: sbw, height: mh });
			app.$sidebarScrolling.css({ width: sbw });
			resizeSidebarHeight();
		}
		else {
			sbw = 0;
			app.$sidebarHider.css({ left: 0 });
		}
		
		app.$mapstatswrap.css({ left: sbw, width: app.ww - sbw - 1 });
		app.map && app.map.resize();
	}
	
	function resizeSidebarHeight() {
		var sbh = app.$window.height() - app.$sidebarScrolling.offset().top;
		app.$sidebarScrolling.css({ height: sbh });
	}
	
	function getSettings() {
		var s = {
			map: {
				type: app.map.getType(),
				center: app.map.getCenter(),
				zoom: app.map.getZoom()
			},
			// TODO: refactor
			fractcover: {
				map: {
					date: app.$fractCoverDate.val(),
					opacity: getOpacity( 'fractcover' )
				},
				stats: {
					dates: app.fractcover.stats.dates
				}
			},
			forestcover: {
				map: {
					date: app.$forestCoverDate.val(),
					opacity: getOpacity( 'forestcover' )
				},
				stats: {
					dates: app.forestcover.stats.dates
				}
			},
			forestchange: {
				map: {
					range: [
						app.$forestChangeDateStart.val(),
						app.$forestChangeDateEnd.val()
					],
					deforestation: {
						opacity: getOpacity( 'deforestation' )
					},
					disturbance: {
						opacity: getOpacity( 'disturbance' )
					}
				},
				stats: {
					ranges: app.forestchange.stats.ranges
				}
			}
		};
		return s;
	}
	
	function getSettingsJSON() {
		return JSON.stringify( getSettings() );
	}
	
	function applySettings( s ) {
		if( typeof s == 'string' )  s = JSON.parse( s );
		if( typeof s != 'object' ) return;
		
		app.map.setType( s.map.type );
		app.map.setCenter( s.map.center );
		app.map.setZoom( s.map.zoom );
		
		// TODO: refactor
		var map = s.fractcover.map, stats = s.fractcover.stats;
		app.$fractCoverDate.val( map.date );
		if( stats.dates ) app.fractcover.stats.dates = stats.dates;
		setOpacity( 'fractcover', map.opacity );
		
		var map = s.forestcover.map, stats = s.forestcover.stats;
		app.$forestCoverDate.val( map.date );
		if( stats.dates ) app.forestcover.stats.dates = stats.dates;
		setOpacity( 'forestcover', map.opacity );
		
		var map = s.forestchange.map, stats = s.forestchange.stats;
		app.$forestChangeDateStart.val( map.range[0] );
		app.$forestChangeDateEnd.val( map.range[1] );
		if( stats.ranges ) app.forestchange.stats.ranges = stats.ranges;
		setOpacity( 'deforestation', map.deforestation.opacity );
		setOpacity( 'disturbance', map.disturbance.opacity );
	}
	
	// TODO: move getMap* to scriptino-map
	function getMapBounds() {
		//return app.location.bounds;
		return app.map.map.getBounds();
	}
	
	function getMapBbox() {
		var bounds = getMapBounds();
		return S.Map.boundsToBbox( bounds );
		//return getMapCenterTinyBbox().join();
	}
	
	function getMapEdges() {
		var bounds = getMapBounds();
		return S.Map.boundsToEdges( bounds );
	}
	
	function initGoogleTranslate() {
		googleTranslateInit = function() {
			new google.translate.TranslateElement({
				pageLanguage: 'en',
				layout: google.translate.TranslateElement.InlineLayout.SIMPLE
			}, 'google-translator' );
		};
		$.getScript( '//translate.google.com/translate_a/element.js?cb=googleTranslateInit' );
	}
	
	var hoverClass = 'icon16-question-hover';
	var helpOneshot = S.oneshot();
	var $tip, $iconHelp;
	
	function helpOn( $icon ) {
		helpOneshot( function() {
			if( $iconHelp  &&  ! $icon ) return;
			$iconHelp = $icon;
			$iconHelp.addClass( hoverClass );
			var sel = $iconHelp[0].id.replace( 'help-icon', '#tip' );
			showTip( $(sel).html(), $iconHelp );
		}, 250 );
	}
	
	function helpOff() {
		helpOneshot( function() {
			if( ! $iconHelp ) return;
			$iconHelp.removeClass( hoverClass );
			$iconHelp = null;
			showTip( false );
		}, 250 );
	}
	
	function initHelp() {
		// Tooltip
		$tip = $('#tip');
		$('div.help-icon').each$( function( $icon ) {
			$icon.hover(
				function() { helpOn( $icon ); },
				helpOff
			);
		});
		$('#tip').hover(
			function() { helpOn(); },
			helpOff
		);
		
		// Help expando
		$('#help-section').setHider(
			'.help-hider', '.help-content',
			function( expand ) {
				if( expand ) loadSidebarHelp();
			}
		);
	}
	
	var tipOffset = { x:20, y:20 };
	var tipHtml, tipLeft, tipTop;
	
	function showTip( html, $element ) {
		tipHtml = html;
		if( html ) {
			$tip.html( html ).show();
			var offset = $element.offset();
			moveTip( offset.left, offset.top );
		}
		else {
			$tip.hide();
		}
	}
	
	function moveTip( x, y ) {
		if( ! tipHtml ) return;
		x += tipOffset.x;
		y += tipOffset.y;
		var pad = 2;
		var width = $tip.width(), height = $tip.height();
		var offsetLeft = width + tipOffset.x * 1.5;
		var offsetTop = height + tipOffset.y * 1.5;
		if( tipLeft ) {
			if( x - offsetLeft < pad )
				tipLeft = false;
			else
				x -= offsetLeft;
		}
		else {
			if( x + width > app.ww - pad )
				tipLeft = true,  x -= offsetLeft;
		}
		if( tipTop ) {
			if( y - offsetTop < pad )
				tipTop = false;
			else
				y -= offsetTop;
		}
		else {
			if( y + height > app.wh - pad )
				tipTop = true,  y -= offsetTop;
		}
		$tip.css({ left:x, top:y });
	}
	
	// Help
	
	var helpCache = {};
	
	function loadHelp( id, callback ) {
		var path = 'en/' + id;
		var cached = helpCache[path];
		if( cached ) {
			callback( cached );
		}
		else {
			$.jsonRPC.request(
				'fetch_content',
				[ path ], {
				success: function( rpc ) {
					var content = rpc.result.content;
					// Avoid error pages
					if( content.match(/casecapturetest/) )
						content = '<div>Missing: ' + path + '</div>';
					helpCache[path] = content
					callback( content );
				},
				error: function( result ) {
					alert( 'Error loading content' );  // TODO: better errors
				}
			});
		}
	}

	function loadSidebarHelp() {
		function load( content ) {
			$('#help-section .help-content').html( content );
		}
		load( '<div style="width:32px; height:32px; filter:alpha(opacity=50); opacity:0.50; -moz-opacity:0.50; background-image:url(images/spinner32.gif)"></div>' );
		loadHelp( app.tabs.selected + 'sidebar', load );
	}
	
//})();
