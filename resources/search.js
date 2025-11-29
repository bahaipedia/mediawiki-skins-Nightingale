/**
 * Ridvan Search Module
 * Handles Vector-style REST API search and Android IME fixes.
 */
( function ( $ ) {
    $( function () {
        var $searchInput = $( '#searchInput' );
        var $searchForm = $( '#p-search form' );
        
        // 1. Create the results container dynamically
        var $resultsBox = $( '<div>' ).addClass( 'ridvan-search-results' ).hide();
        $searchForm.append( $resultsBox );

        var searchTimeout;
        var currentController = null;

        // 2. INPUT HANDLER (Solves Android Bug)
        $searchInput.on( 'input focus', function () {
            var query = $( this ).val().trim();
            clearTimeout( searchTimeout );

            if ( query.length === 0 ) {
                if ( currentController ) currentController.abort();
                $resultsBox.hide();
                return;
            }

            // Debounce: Wait 250ms
            searchTimeout = setTimeout( function() {
                performSearch( query );
            }, 250 );
        } );

        // 3. REST API FETCHER
        function performSearch( query ) {
            if ( currentController ) currentController.abort();
            currentController = new AbortController();

            var apiLink = mw.util.wikiScript('rest') + '/v1/search/title?q=' + encodeURIComponent(query) + '&limit=10';

            fetch( apiLink, { signal: currentController.signal } )
                .then( function(response) { return response.json(); } )
                .then( function(data) { renderResults( data.pages, query ); } )
                .catch( function(err) {
                    if ( err.name !== 'AbortError' ) console.error( err );
                } );
        }

        // 4. RENDERER
        function renderResults( pages, query ) {
            $resultsBox.empty();

            if ( !pages || pages.length === 0 ) {
                $resultsBox.hide();
                return;
            }

            pages.forEach( function ( page ) {
                var $row = $( '<a>' )
                    .attr( 'href', mw.util.getUrl( page.key ) )
                    .addClass( 'ridvan-result-row' );

                var $thumbContainer = $( '<div>' ).addClass( 'ridvan-thumb-container' );
                if ( page.thumbnail ) {
                    var $img = $( '<img>' )
                        .attr( 'src', page.thumbnail.url )
                        .addClass( 'ridvan-result-thumb' );
                    $thumbContainer.append( $img );
                } else {
                    $thumbContainer.addClass( 'ridvan-thumb-placeholder' );
                }
                $row.append( $thumbContainer );

                var $textDiv = $( '<div>' ).addClass( 'ridvan-result-text' );
                var $title = $( '<div>' ).addClass( 'ridvan-result-title' ).text( page.title );
                $textDiv.append( $title );

                if ( page.description ) {
                    var $desc = $( '<div>' ).addClass( 'ridvan-result-desc' ).text( page.description );
                    $textDiv.append( $desc );
                }

                $row.append( $textDiv );
                $resultsBox.append( $row );
            } );

            // Footer
            var $footer = $( '<a>' )
                .addClass( 'ridvan-result-footer' )
                .attr( 'href', mw.util.getUrl( 'Special:Search' ) + '?search=' + encodeURIComponent(query) + '&fulltext=1' )
                .html( 'Search for pages containing <strong>' + mw.html.escape(query) + '</strong>' );
            
            $resultsBox.append( $footer );
            $resultsBox.show();
        }

        // 5. CLOSE HANDLER & MOBILE FIX
        $( window ).on( 'click', function ( e ) {
            if ( !$( e.target ).closest( '#p-search' ).length ) {
                $resultsBox.hide();
            }
        } );
        
        $searchInput.on( 'focus', function() {
            if ( $searchInput.val().length > 0 ) $resultsBox.show();
        });
    } );
}( jQuery ) );
