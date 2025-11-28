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

    // 3. Fix for Android Mobile Search Lag (IME Composition)
    var $searchInput = $( '#searchInput' );
    
    if ( $searchInput.length ) {
        // We bind to 'input' because it catches everything (typing, pasting, voice dictation)
        $searchInput.on( 'input', function () {
            
            // The Search module only listens to 'keydown' or 'keypress'.
            // Android often sends keycode 229 (buffer) which MW ignores.
            // We manually trigger a fake 'keydown' with a harmless key (Space: 32)
            // to force the search module to look at the current .val()
            
            var e = $.Event( 'keydown' );
            e.which = 32; // 32 = Space
            e.keyCode = 32;
            $searchInput.trigger( e );
        } );
    }
} );
