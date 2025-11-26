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
    // (This part of your code was correct and can stay)
    $( '.mw-portlet input[type="checkbox"]' ).on( 'change', function () {
        if ( $( this ).is( ':checked' ) ) {
            $( '.mw-portlet input[type="checkbox"]' ).not( this ).prop( 'checked', false );
        }
    } );
} );
