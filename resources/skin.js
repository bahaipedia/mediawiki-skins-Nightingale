/* JavaScript for the Ridvan skin */
$( function () {
    
    // 1. Handle "Click Outside" to close menus
    $( document ).on( 'click', function ( e ) {
        // Check if the click happened INSIDE a portlet/dropdown
        if ( !$( e.target ).closest( '.mw-portlet' ).length ) {
            // If not, uncheck ALL dropdown checkboxes
            $( '.mw-checkbox-hack-checkbox' ).prop( 'checked', false );
        }
    } );

    // 2. Handle "Exclusive" behavior (Close others when one opens)
    $( '.mw-checkbox-hack-checkbox' ).on( 'change', function () {
        // If this specific checkbox was just checked (menu opened)...
        if ( $( this ).is( ':checked' ) ) {
            // ...find all OTHER checkboxes and uncheck them.
            $( '.mw-checkbox-hack-checkbox' ).not( this ).prop( 'checked', false );
        }
    } );

} );
