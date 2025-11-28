/* JavaScript for the Ridvan skin */
$( function () {

    /* --- MENU LOGIC --- */
    // 1. If a click hits the window, close ALL menus.
    $( window ).on( 'click', function () {
        $( '.mw-portlet input[type="checkbox"]' ).prop( 'checked', false );
    } );

    // 2. If the user clicked INSIDE a menu (label, dropdown, etc.),
    // don't let that click bubble up to the window (prevents rule #1 from running).
    $( '.mw-portlet' ).on( 'click', function ( e ) {
        e.stopPropagation();
    } );

    // 3. If a menu is opened, close all OTHER menus.
    $( '.mw-portlet input[type="checkbox"]' ).on( 'change', function () {
        if ( $( this ).is( ':checked' ) ) {
            $( '.mw-portlet input[type="checkbox"]' ).not( this ).prop( 'checked', false );
        }
    } );

    /* --- ANDROID SEARCH FIX --- */
    var $searchInput = $( '#searchInput' );
    if ( $searchInput.length ) {
        $searchInput.on( 'input', function () {
            $searchInput.trigger( 'keydown' );
        } );
    }

} );
