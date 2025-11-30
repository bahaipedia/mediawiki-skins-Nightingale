const config = require( './config.json' );
const urlGenerator = require( './urlGenerator.js' );

function searchAction() {
	return {
		urlGeneratorInstance: urlGenerator( config ),
		
		render: function ( searchQuery, templates ) {
			const items = [];

			// 1. "Search for pages containing..." link
			items.push( {
				id: 'fulltext',
				// Generate URL: Special:Search?search=query&fulltext=1
				href: this.urlGeneratorInstance.generateUrl( 'Special:Search', {
					fulltext: '1',
					search: searchQuery.value
				} ),
				icon: 'ridvanSearch',
				text: mw.message( 'czsearch-search-fulltext', searchQuery.value ).text()
			} );

			// 2. (Optional) "Edit/Create page" link - You can remove this block if you don't want it
			items.push( {
				id: 'editpage',
				href: this.urlGeneratorInstance.generateUrl( searchQuery.value, { action: 'edit' } ),
				icon: 'ridvanEdit',
				text: mw.message( 'czsearch-search-editpage', searchQuery.value ).text()
			} );

			const data = {
				type: 'action',
				'array-list-items': items
			};

			const partials = {
				TypeaheadListItem: templates.TypeaheadListItem
			};

			// Inject the HTML
			const actionList = document.getElementById( 'czsearch-typeahead-list-action' );
			const actionGroup = document.getElementById( 'czsearch-typeahead-group-action' );
			
			if ( actionList && actionGroup ) {
				actionList.outerHTML = templates.TypeaheadList.render( data, partials ).html();
				// Show the group
				document.getElementById( 'czsearch-typeahead-group-action' ).hidden = false;
			}
		},
		
		clear: function () {
			const actionList = document.getElementById( 'czsearch-typeahead-list-action' );
			if ( actionList ) actionList.innerHTML = '';

			const actionGroup = document.getElementById( 'czsearch-typeahead-group-action' );
			if ( actionGroup ) actionGroup.hidden = true;
		},
		
		init: function () {
			// No init needed
		}
	};
}

module.exports = searchAction;
