function initSearchLoader() {
	const searchForm = document.getElementById( 'searchform' );
	const searchInput = document.getElementById( 'searchInput' );

	if ( searchForm && searchInput ) {
		// 1. Kill default MediaWiki search suggestions safely
		if ( window.jQuery ) {
			// Remove the event listeners that trigger the default search
			$( searchInput ).off( 'keydown.suggestions keypress.suggestions keyup.suggestions' );
			
			// Only try to disable the plugin if it actually exists
			if ( typeof $( searchInput ).searchSuggest === 'function' ) {
				$( searchInput ).searchSuggest( 'disable' );
			}
		}

		// 2. Initialize our custom search
		const typeahead = require( './typeahead.js' );
		typeahead.init( searchForm, searchInput );
	}
}

initSearchLoader();
