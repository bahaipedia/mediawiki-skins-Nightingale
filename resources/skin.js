/**
 * Core Skin Logic for Skin:Nightingale
 * Handles Menus, Sticky Headers, and Reading Progress Indicators.
 */
( function ( $ ) {
    $( function () {

        /* ==================================================================
           1. MENU LOGIC (Close on click-away, Exclusive opening)
           ================================================================== */
        
        // If a click hits the window (background), close ALL menus.
        $( window ).on( 'click', function () {
            $( '.mw-portlet input[type="checkbox"]' ).prop( 'checked', false );
        } );

        // If the user clicked INSIDE a menu, stop the bubble so Rule #1 doesn't run.
        $( '.mw-portlet' ).on( 'click', function ( e ) {
            e.stopPropagation();
        } );

        // If a menu is opened, close all OTHER menus.
        $( '.mw-portlet input[type="checkbox"]' ).on( 'change', function () {
            if ( $( this ).is( ':checked' ) ) {
                $( '.mw-portlet input[type="checkbox"]' ).not( this ).prop( 'checked', false );
            }
        } );


        /* ==================================================================
           2. COLUMN CONFIGURATION MAPPING
           Defines default column counts for specific publications based on URL.
           ================================================================== */
        
        function getPageColumnCount() {
            var pageName = mw.config.get('wgPageName');

            var config = [
                // EXCLUSIONS (Complex layouts)
                { pattern: /^The_American_Bahá’í/, cols: 0 },

                // Regex Pattern for URL          // Default Columns
                { pattern: /^World_Order/,        cols: 2 },
                { pattern: /^Star_of_the_West/,   cols: 2 },
                { pattern: /^Bahai_News/,         cols: 2 },
                // Add more publications here as needed
            ];

            for (var i = 0; i < config.length; i++) {
                if (config[i].pattern.test(pageName)) {
                    return config[i].cols;
                }
            }
            
            // Fallback for standard books or unmapped content
            return 1; 
        }

        // Calculate this ONCE on load, not every scroll event
        var globalPageColumns = getPageColumnCount();


        /* ==================================================================
           3. STICKY PAGE TRACKER & READING INDICATOR
           ================================================================== */
        
        var $window = $(window);
        var $tracker = $('#sticky-page-tracker');
        var $stickyLeft = $('#sticky-left');
        var $stickyRight = $('#sticky-right');
        var $indicator = $('#reading-indicator'); // The Green Box
        
        // Find all page markers in the content area
        var $markers = $('.mw-parser-output .opage');

        // Only run this logic if the page actually has markers
        if ($markers.length > 0) {
            
            function updateStickyHeader() {
                var scrollTop = $window.scrollTop();
                var activeIndex = -1;

                // A. Find which page we are currently reading
                $markers.each(function(index) {
                    var $this = $(this);
                    // Buffer: We switch to the next page when the marker is 150px from top
                    if ($this.offset().top < scrollTop + 150) { 
                        activeIndex = index;
                    }
                });

                if (activeIndex > -1) {
                    $tracker.addClass('active');
                    
                    var $currentMarker = $markers.eq(activeIndex);
                    var $nextMarker = $markers.eq(activeIndex + 1);

                    // --- B. CONTENT CLONING ---
                    // Grab HTML from the current marker
                    var pageHtml = $currentMarker.html();
                    
                    // Grab HTML from the sibling image (assuming .otright is next sibling)
                    var $imgContainer = $currentMarker.next('.otright');
                    var imgHtml = $imgContainer.length ? $imgContainer.html() : '';

                    // Only update DOM if content changed (performance + anti-flicker)
                    if ($stickyLeft.html() !== pageHtml) {
                        $stickyLeft.html(pageHtml);
                        
                        // We must re-inject the indicator div because overwriting innerHTML wipes it
                        // So we wrap the image HTML + the indicator div
                        $stickyRight.html(imgHtml).append($indicator); 
                    }

                    // --- C. COLUMN MAPPING & CHECK ---
                    var attrCols = $currentMarker.attr('data-cols');
                    var cols = attrCols ? parseInt(attrCols) : globalPageColumns;

                    // IF COLS IS 0, HIDE INDICATOR AND STOP
                    if (cols <= 0) {
                        $indicator.hide();
                        return; 
                    }

                    // --- D. PROGRESS CALCULATION ---
                    var startY = $currentMarker.offset().top;
                    
                    // If no next marker, use bottom of content area
                    var endY = $nextMarker.length ? 
                               $nextMarker.offset().top : 
                               $('.mw-parser-output').height() + $('.mw-parser-output').offset().top;
                    
                    // Total pixel height of this page section
                    var sectionHeight = Math.max(endY - startY, 1);
                    
                    // Linear progress (0.0 to 1.0) through this specific section
                    var progress = (scrollTop - startY) / sectionHeight;
                    
                    // Clamp values to stay inside bounds
                    progress = Math.min(Math.max(progress, 0), 1);

                    // Map linear progress to grid coordinates
                    // e.g. 50% through a 2-col page = Top of Column 2
                    var totalGeoProgress = progress * cols;
                    var colIndex = Math.floor(totalGeoProgress);
                    
                    // Edge case: if exactly 100%, clamp to last column
                    if (colIndex >= cols) colIndex = cols - 1;
                    
                    // How far down the specific column are we?
                    var verticalProgress = totalGeoProgress - colIndex;

                    // --- E. UPDATE GREEN BOX POSITION ---
                    var boxWidth = 100 / cols;
                    var boxLeft = colIndex * boxWidth;
                    var boxTop = verticalProgress * 100;

                    $indicator.css({
                        'width': boxWidth + '%',
                        'left': boxLeft + '%',
                        'top': boxTop + '%',
                        'display': 'block'
                    });

                } else {
                    // We are at the top of the article, before Page 1
                    $tracker.removeClass('active');
                }
            }

            // Run on scroll and resize
            $window.on('scroll resize', updateStickyHeader);
            
            // Run once immediately to set initial state
            updateStickyHeader();
        }

    } );
}( jQuery ) );
