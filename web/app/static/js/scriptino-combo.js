// Scriptino Combo
// By Michael Geary - http://mg.to/
// See UNLICENSE or http://unlicense.org/ for public domain notice.

(function( S, $ ) {
	
	S.Combo = function( a ) {
		function onchange() {
			a.onchange && a.onchange( inlist() );
		}
		
		function inlist() {
			var text = $input.val();
			for(
				var match,  i = -1,  $items = $list.find('li');
				match = $items[ ++i ];
			) {
				var $match = $(match);
				if( text == $match.find('.text').text() )
					return $match;
			}
			return null;
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
				$input.val( $(this).find('.text').text() );
				onchange();
			})
			.delegate( 'div.delete', 'click', function( event ) {
				var $li = $(this).parent();
				$li.addClass('deleted');
				a.ondelete && a.ondelete( $li );
			})
			.delegate( 'div.undelete', 'click', function( event ) {
				var $li = $(this).parent();
				$li.removeClass('deleted');
				a.onundelete && a.onundelete( $li );
			});
		onchange();
		return combo;
	};
	
})( Scriptino, jQuery );
