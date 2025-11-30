/**
 * Ridvan search integration:
 * - upgrades #searchInput to mediawiki.widgets.SearchInputWidget
 * - uses mediawiki.searchSuggest for robust suggestions
 */
( function ( mw, $ ) {
	$( function () {
		var $input = $( '#searchInput' );
		if ( !$input.length ) {
			return;
		}

		// Get the surrounding form
		var $form = $input.closest( 'form' );
		var searchTitle = mw.config.get( 'wgPageName' ) || '';

		// Create the SearchInputWidget
		// See: resources/src/mediawiki.widgets/SearchInputWidget.js in core
		var searchWidget = new mw.widgets.SearchInputWidget( {
			// Reuse existing attributes so behaviour is consistent
			name: $input.attr( 'name' ) || 'search',
			placeholder: $input.attr( 'placeholder' ) || '',
			value: $input.val() || '',
			// Attach autocomplete / suggestions
			// Note: Source is configured via core (wgScriptPath, etc.)
			// This uses the same backend as Vector.
			autocomplete: true
		} );

		// Replace original input with the widget
		searchWidget.$element.insertBefore( $input );
		$input.remove();

		// Wire widget to the form so pressing Enter submits correctly
		if ( $form.length ) {
			searchWidget.on( 'enter', function () {
				$form.trigger( 'submit' );
			} );
		}

		// Ensure suggestions work even on touch/mobile devices.
		// mediawiki.searchSuggest hooks into inputs with .mw-searchInput
		searchWidget.$input
			.addClass( 'mw-searchInput' )
			.attr( 'id', 'searchInput' ); // maintain ID for accessibility & labels

		// Trigger core searchSuggest binding if not already done
		if ( $.fn.suggestions && !$form.data( 'suggestions' ) ) {
			// This mirrors what core does on page load
			// Options: https://doc.wikimedia.org/mediawiki-core/master/js/#!/api-jQuery.suggestions
			searchWidget.$input.suggestions( {
				fetch: function ( query, callback ) {
					// Default behaviour: delegate to the builtin suggester
					// (mediawiki.searchSuggest attaches $.suggestions.fn.suggest)
					$( this ).suggestions( 'suggest', query, callback );
				}
			} );
		}
	} );
}( mediaWiki, jQuery ) );
