// Scriptino Chart
// By Michael Geary - http://mg.to/
// See UNLICENSE or http://unlicense.org/ for public domain notice.

(function( S, $ ) {
	
	S.unitSelect = function( a ) {
		$.S(
			
		).appendTo( a.container );
	};
	
	S.chart = function( a ) {
		var chart = {
		};
		var $chart = $(a.container);
		function formatRow( row ) {
			return S(
				'<div class="statistics-bar-label">',
					row.label, ' ',
				'</div>',
				'<div class="statistics-bar-container">',
					formatValues( row.values ),
				'</div>',
				'<div class="clear-both">',
				'</div>'
			);
		}
		function formatValues( values ) {
			var total = 0;
			values.forEach( function( value ) { total += value.value; } );
			var current = 0;
			return S(
				values.map( function( value ) {
					current += value.value;
					var width = ( current / total * 100 ).toFixed( 2 );
					return S(
						'<div class="statistics-bar" style="width:', width, '%; background-color:', value.color, ';">',
						'</div>'
					);
				}).reverse().join('')
			);
		}
		$chart.html( S(
			'<div class="statistics-chart">',
				a.list.map( formatRow ).join(''),
			'</div>'
		) );
		return chart;
	};
	
	S.ChartApi = {
		chart: function(  a ) {
			return this.url( a );
		},
		
		barH: function( a ) {
			return this.chart({
				cht: 'bhs',
				chco: a.colors.join(),
				chd: 't:' + a.data.join(),
				chds: a.scale.join(),
				chl: a.labels.join('|'),
				chs: a.width + 'x' + a.height,
				chtt: a.title
			});
		},
		
		barV: function( a ) {
			return this.chart({
				cht: 'bvs',
				chco: a.colors.join(),
				chd: 't:' + a.data.join(),
				chds: a.scale.join(),
				chl: a.labels.join('|'),
				chs: a.width + 'x' + a.height,
				chtt: a.title,
				chbh: a.barWidth.join(),
				chdl: a.legend,
				chdlp: a.legendPos,
				chxt: a.axes,
				chxs: a.axisFormat,
				chxr: a.axisRange && a.axisRange.join()
			});
		},
		
		line: function( a ) {
			return this.chart({
				cht: 'lc',
				chco: a.colors.join(),
				chd: 't:' + a.data.join(),
				chds: a.scale.join(),
				chl: a.labels.join('|'),
				chs: a.width + 'x' + a.height,
				chtt: a.title,
				chdl: a.legend,
				chdlp: a.legendPos,
				chxt: a.axes,
				chxs: a.axisFormat,
				chxr: a.axisRange && a.axisRange.join()
			});
		},
		
		pie3d: function( a ) {
			return this.chart({
				cht: 'p3',
				chco: a.colors.join(),
				chd: 't:' + a.data.join(),
				chds: a.scale.join(),
				chl: a.labels.join('|'),
				chs: a.width + 'x' + a.height,
				chtt: a.title
			});
		},
		
		rainbow: function( a ) {
			var img = this.chart({
				cht: 'bhs',
				chco: a.colors.join(),
				chd: 't:' + a.data.join('|'),
				chds: a.scale && a.scale.join(),
				chs: [ a.width + 1, a.height + 5 ].join('x')
			});
			var alt = ! a.alt ? '' : S( 'title="', a.alt, '" ' );
			return S(
				'<span style="display:block; ', alt, 'width:', a.width, 'px; height:', a.height, 'px; background-position:-1px 0; background-repeat:no-repeat; background-image:url(\'', img, '\');">',
				'</span>'
			);
		},
		
		sparkbar: function( a ) {
			var img = this.chart({
				cht: 'bhg',
				chbh: [ a.barHeight, a.barSpace, a.groupSpace || a.barSpace ].join(),
				chco: a.colors.join('|'),
				chf: a.background,
				chds: a.scale.join(),
				chd: 't:' + a.data.join(','),
				chs: [ a.width + 1, a.height + 5 ].join('x')
			});
			return S(
				'<span style="display:block; width:', a.width, 'px; height:', a.height, 'px; background-position:-1px -2px; background-repeat:no-repeat; background-image:url(\'', img, '\');">',
				'</span>'
			);
		},
		
		sparkline: function( a ) {
			return this.chart({
				cht: 'ls',
				chco: a.colors.join(),
				chd: 't:' + a.data.join('|'),
				chds: a.scale.join(),
				chl: a.labels && a.labels.join('|'),
				chs: a.width + 'x' + a.height,
				chtt: a.title,
				chf: a.solid,
				chm: a.fill
			});
		},
		
		url: function( a ) {
			var params = [];
			for( k in a )
				if( a[k] != null )
					params.push( k + '=' + /*encodeURIComponent(*/ a[k].replace( '&', '&amp;' ).replace( '+', '%2B' ).replace( ' ', '+' ) /*)*/ );
			params.sort();
			return 'http://chart.apis.google.com/chart?' + params.join('&');
		}
	};

	
})( Scriptino, jQuery );
