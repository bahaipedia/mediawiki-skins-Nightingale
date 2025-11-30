// const config = require( './config.json' );
const searchAction = require( './searchAction.js' )();

function searchResults() {
	const textCache = {};
	const redirectMessageCache = {};
	const regexCache = {};

	return {
		getRedirectLabel: function ( title, matchedTitle, queryValue ) {
			// ... (Same as before, keep this logic) ...
			const normalizeText = ( text ) => {
				if ( !textCache[ text ] ) {
					textCache[ text ] = text.replace( /[-\s]/g, ( match ) => match.toLowerCase() ).toLowerCase();
				}
				return textCache[ text ];
			};
			const getRedirectMessage = () => {
				if ( !redirectMessageCache[ matchedTitle ] ) {
					redirectMessageCache[ matchedTitle ] = mw.message( 'search-redirect', matchedTitle ).plain();
				}
				return redirectMessageCache[ matchedTitle ];
			};
			const isRedirectUseful = () => {
				const cleanTitle = normalizeText( title );
				const cleanMatchedTitle = normalizeText( matchedTitle );
				return !( cleanTitle.includes( cleanMatchedTitle ) || cleanMatchedTitle.includes( cleanTitle ) );
			};
			const generateRedirectHtml = () => {
				const div = document.createElement( 'div' );
				div.classList.add( 'citizen-typeahead__labelItem' );
				div.title = getRedirectMessage();
				const spanIcon = document.createElement( 'span' );
				spanIcon.classList.add( 'citizen-ui-icon', 'mw-ui-icon-wikimedia-articleRedirect' );
				div.appendChild( spanIcon );
				const spanText = document.createElement( 'span' );
				spanText.textContent = this.highlightTitle( matchedTitle, queryValue );
				div.appendChild( spanText );
				return div.outerHTML;
			};
			let html = '';
			if ( matchedTitle && isRedirectUseful() ) {
				html = generateRedirectHtml();
			}
			return html;
		},
		highlightTitle: function ( title, match ) {
			if ( !match ) return title;
			if ( !regexCache[ match ] ) regexCache[ match ] = new RegExp( mw.util.escapeRegExp( match ), 'i' );
			return title.replace( regexCache[ match ], '<span class="citizen-typeahead__highlight">$&</span>' );
		},
		
		// --- CHANGED: Return empty string instead of placeholder HTML ---
		getPlaceholderHTML: function ( queryValue, templates ) {
			return '';
		},

		getResultsHTML: function ( results, queryValue, templates ) {
			const items = [];
			results.forEach( ( result, index ) => {
				const item = {
					id: index,
					href: result.url,
					title: this.highlightTitle( result.title, queryValue ),
					description: result.description,
					'html-end': this.getRedirectLabel( result.title, result.label ),
					image: {}
				};
				if ( result.thumbnail && result.thumbnail.url ) {
					item.image.url = result.thumbnail.url;
				} else {
					item.image.class = 'citizen-typeahead-list-item-image--placeholder citizen-ui-icon mw-ui-icon-wikimedia-image';
				}
				items.push( item );
			} );

			const data = {
				type: 'page',
				'array-list-items': items
			};

			const partials = {
				TypeaheadListItem: templates.TypeaheadListItem
			};

			return templates.TypeaheadList.render( data, partials ).html();
		},
		fetch: function ( queryValue, activeSearchClient ) {
			return activeSearchClient.fetchByTitle( queryValue );
		},
		render: function ( searchQuery, templates ) {
			searchAction.render( searchQuery, templates );
		},
		clear: function () {
			document.getElementById( 'citizen-typeahead-list-page' ).innerHTML = '';
			document.getElementById( 'citizen-typeahead-group-page' ).hidden = true;
			searchAction.clear();
		},
		init: function () {
			searchAction.init();
		}
	};
}

module.exports = searchResults;
