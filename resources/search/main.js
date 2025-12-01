console.log( 'Ridvan: search js v3 loaded successfully.' );

function initSearchLoader() {
	const searchForm = document.getElementById( 'searchform' );
	const searchInput = document.getElementById( 'searchInput' );

	if ( searchForm && searchInput ) {
		// 1. Kill default MediaWiki search suggestions
		if ( window.jQuery ) {
			$( searchInput ).off( 'keydown.suggestions keypress.suggestions keyup.suggestions' );
			// Depending on MW version, this might also be needed:
			$( searchInput ).searchSuggest( 'disable' );
		}

		// 2. Initialize our custom search
		const typeahead = require( './typeahead.js' );
		typeahead.init( searchForm, searchInput );
	}
}

initSearchLoader();
