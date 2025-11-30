const config = require( './config.json' );
const searchHistory = require( './searchHistory.js' )( config );

function searchPresults() {
	return {
		renderHistory: function ( results, templates ) {
			const items = [];
			results.forEach( ( result, index ) => {
				items.push( {
					id: index,
					href: `${ config.wgScriptPath }/index.php?title=Special:Search&search=${ result }`,
					text: result,
					icon: 'history'
				} );
			} );

			const data = {
				type: 'history',
				'array-list-items': items
			};

			const partials = {
				TypeaheadListItem: templates.TypeaheadListItem
			};

			document.getElementById( 'citizen-typeahead-list-history' ).outerHTML = templates.TypeaheadList.render( data, partials ).html();
			document.getElementById( 'citizen-typeahead-group-history' ).hidden = false;
		},
		render: function ( templates ) {
			// Clear any existing placeholder
			const placeholderEl = document.getElementById( 'citizen-typeahead-placeholder' );
			if ( placeholderEl ) {
				placeholderEl.innerHTML = '';
				placeholderEl.hidden = true;
			}

			// Only render history if it exists
			const historyResults = searchHistory.get();
			if ( historyResults && historyResults.length > 0 ) {
				this.renderHistory( historyResults, templates );
			}
			
			// REMOVED: The 'else' block that rendered the "Search Bahaipedia" banner
		},
		clear: function () {
			const historyList = document.getElementById( 'citizen-typeahead-list-history' );
			if ( historyList ) historyList.innerHTML = '';
			
			const historyGroup = document.getElementById( 'citizen-typeahead-group-history' );
			if ( historyGroup ) historyGroup.hidden = true;
		}
	};
}

module.exports = searchPresults;
