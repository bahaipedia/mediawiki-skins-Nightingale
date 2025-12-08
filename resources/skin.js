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

        /* ==================================================================
           STICKY PAGE TRACKER LOGIC
           ================================================================== */
        
        var $window = $(window);
        var $tracker = $('#sticky-page-tracker');
        var $stickyLeft = $('#sticky-left');
        var $stickyRight = $('#sticky-right');
        
        // Find all page markers in the content area
        var $markers = $('.mw-parser-output .opage');

        if ($markers.length > 0) {
            function updateStickyHeader() {
                var scrollTop = $window.scrollTop();
                var currentMarker = null;

                // Loop to find the last marker that has scrolled past the top
                $markers.each(function() {
                    var $this = $(this);
                    // Use a small buffer (50px) so it switches just as it leaves view
                    if ($this.offset().top < scrollTop + 50) {
                        currentMarker = $this;
                    }
                });

                if (currentMarker) {
                    $tracker.addClass('active');
                    
                    // Grab HTML from the current marker
                    var pageHtml = currentMarker.html();
                    
                    // Grab HTML from the sibling image (assuming it is the immediate next .otright)
                    var $imgContainer = currentMarker.next('.otright');
                    var imgHtml = $imgContainer.length ? $imgContainer.html() : '';

                    // Only update DOM if content changed (performance + anti-flicker)
                    if ($stickyLeft.html() !== pageHtml) {
                        $stickyLeft.html(pageHtml);
                        $stickyRight.html(imgHtml);
                    }
                } else {
                    // We are at the top of the article, before Page 1
                    $tracker.removeClass('active');
                }
            }

            // Run on scroll and resize
            $window.on('scroll resize', updateStickyHeader);
            
            // Run once immediately
            updateStickyHeader();
        }

    } );
}( jQuery ) );
