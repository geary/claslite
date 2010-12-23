// Scriptino Tabs
// By Michael Geary - http://mg.to/
// See UNLICENSE or http://unlicense.org/ for public domain notice.

(function( S, $ ) {
	
	S.Combo = function( a ) {
		function onchange() {
			a.onchange && a.onchange( inlist() );
		}
		
		function inlist() {
			var val = $input.val();
			var match = false;
			$list.find('li').each( function() {
				if( val == $(this).text() ) {
					match = true;
					return false;
				}
				return true;
			});
			return match;
		}
		
		var $input = $(a.input), $list = $(a.list);
		var combo = {
			$input: $input,
			$list: $list,
			inlist: inlist
			//select: select
		};
		
		$input.bind( 'change keyup', function() {
			onchange();
		});
		$list
			.delegate( 'li', 'mouseenter', function( event ) {
				$(this).addClass('hover');
			})
			.delegate( 'li', 'mouseleave', function( event ) {
				$(this).removeClass('hover');
			})
			.delegate( 'li', 'click', function( event ) {
				$input.val( $(this).text() );
				onchange();
			});
		onchange();
		return combo;
	};
	
})( Scriptino, jQuery );
