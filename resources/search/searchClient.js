const fetchJson = require( './fetch.js' );
const urlGenerator = require( './urlGenerator.js' );

/**
 * Simplified Search Client for MediaWiki REST API
 * Mimics the structure of Citizen's complex client factory
 */
function searchClient( config ) {
	// Helper to format the API response
	function adaptApiResponse( query, response, showDescription ) {
		const urlGen = urlGenerator( config );
		return {
			query,
			results: response.pages.map( ( page ) => {
				const thumbnail = page.thumbnail;
				return {
					id: page.id,
					label: page.matched_title || page.title,
					key: page.key,
					title: page.title,
					description: showDescription ? page.description : undefined,
					url: urlGen.generateUrl( page ),
					thumbnail: thumbnail ? {
						url: thumbnail.url,
						width: thumbnail.width ?? undefined,
						height: thumbnail.height ?? undefined
					} : undefined
				};
			} )
		};
	}

	// This object mimics the "mwRestApiSearchClient" instance
	const internalClient = {
		fetchByTitle: ( q, limit = config.wgCitizenMaxSearchResults, showDescription = true ) => {
			// Ensure we use the correct script path from MW config
			const scriptPath = mw.config.get( 'wgScriptPath' ) || config.wgScriptPath;
			const searchApiUrl = scriptPath + '/rest.php';
			
			const params = { q, limit: limit.toString() };
			const search = new URLSearchParams( params );
			const url = `${ searchApiUrl }/v1/search/title?${ search.toString() }`;
			
			const result = fetchJson( url, { headers: { accept: 'application/json' } } );
			
			const searchResponsePromise = result.fetch
				.then( ( res ) => adaptApiResponse( q, res, showDescription ) );
				
			return {
				abort: result.abort,
				fetch: searchResponsePromise
			};
		}
	};

	// return the object structure typeahead.js expects
	return {
		// The active client holder
		active: {
			id: 'mwRestApi',
			client: internalClient
		},

		// No-op: We only support one client, so we ignore requests to switch
		setActive: function ( id ) {
			return;
		},

		// No-op: We don't support special command data (like starting search with "/")
		getData: function ( key, value ) {
			return null;
		}
	};
}

module.exports = searchClient;
