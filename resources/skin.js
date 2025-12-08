/**
 * Core Skin Logic
 * Handles Menus, Toggles, and Layout interactions.
 */
( function ( $ ) {
    $( function () {
        /* ==================================================================
           MENU LOGIC (Close on click-away, Exclusive opening)
           ================================================================== */
        
        // 1. If a click hits the window (background), close ALL menus.
        $( window ).on( 'click', function () {
            $( '.mw-portlet input[type="checkbox"]' ).prop( 'checked', false );
        } );

        // 2. If the user clicked INSIDE a menu, stop the bubble 
        // (so Rule #1 doesn't run).
        $( '.mw-portlet' ).on( 'click', function ( e ) {
            e.stopPropagation();
        } );

        // 3. If a menu is opened, close all OTHER menus.
        $( '.mw-portlet input[type="checkbox"]' ).on( 'change', function () {
            if ( $( this ).is( ':checked' ) ) {
                $( '.mw-portlet input[type="checkbox"]' ).not( this ).prop( 'checked', false );
            }
        } );

    } );
}( jQuery ) );
