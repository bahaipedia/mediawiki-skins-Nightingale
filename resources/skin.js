/* JavaScript for the Ridvan skin */
$( function () {
    // 1. Handle "Click Outside" to close menus
    $( document ).on( 'click', function ( e ) {
        
        // Find all menus that are currently OPEN
        var $openMenus = $( '.mw-portlet input[type="checkbox"]:checked' );

        $openMenus.each( function () {
            var $checkbox = $( this );
            // Find the container for THIS specific menu
            var $portlet = $checkbox.closest( '.mw-portlet' );

            // If the click target is NOT inside this specific portlet...
            if ( !$portlet.is( e.target ) && $portlet.has( e.target ).length === 0 ) {
                // ...close it.
                $checkbox.prop( 'checked', false );
            }
        });
    } );

    // 2. Handle "Exclusive" behavior (Close others when one opens)
    $( '.mw-portlet input[type="checkbox"]' ).on( 'change', function () {
        if ( $( this ).is( ':checked' ) ) {
            $( '.mw-portlet input[type="checkbox"]' ).not( this ).prop( 'checked', false );
        }
    } );

    // 3. Fix for Android Mobile Search Lag (IME Composition)
    var $searchInput = $( '#searchInput' );
    if ( $searchInput.length ) {
        $searchInput.on( 'input', function () {
            // Force MediaWiki's search suggestions to wake up.
            // The "input" event fires on every character change, unlike "keyup/keydown" 
            // which are often suppressed by Android keyboards during composition.
            $searchInput.trigger( 'keydown' );
        } );
    }
} );
