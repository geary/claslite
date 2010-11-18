// Scriptino Chart
// Copyright 2010 Michael Geary - http://mg.to/
// Use under any Open Source license:
// http://www.opensource.org/licenses/

(function( S, $ ) {
	
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
	
})( Scriptino, jQuery );
