/**
 * Skin:Nightingale Core Logic
 * Reconciles "Alpha" (Visual Tracking) and "Beta" (Layout/Columns)
 */
(function ($) {
    $(function () {

        /* ==================================================================
           1. MENU LOGIC
           ================================================================== */
        $(window).on('click', function () {
            $('.mw-portlet input[type="checkbox"]').prop('checked', false);
        });

        $('.mw-portlet').on('click', function (e) {
            e.stopPropagation();
        });

        $('.mw-portlet input[type="checkbox"]').on('change', function () {
            if ($(this).is(':checked')) {
                $('.mw-portlet input[type="checkbox"]').not(this).prop('checked', false);
            }
        });

        /* ==================================================================
           2. COLUMN CONFIGURATION
           ================================================================== */
        function getPageColumnCount() {
            var pageName = mw.config.get('wgPageName');
            var config = [
                { pattern: /^The_American_Bahá’í/, cols: 0 }, // Disable tracker
                { pattern: /^World_Order/, cols: 2 },
                { pattern: /^Star_of_the_West/, cols: 2 },
                { pattern: /^Bahá’í_News/, cols: 2 }
            ];

            for (var i = 0; i < config.length; i++) {
                if (config[i].pattern.test(pageName)) {
                    return config[i].cols;
                }
            }
            return 1; // Default
        }

        var globalPageColumns = getPageColumnCount();

        /* ==================================================================
           3. STICKY TRACKER & GREEN BOX LOGIC
           ================================================================== */
        var $window = $(window);
        var $tracker = $('#sticky-page-tracker');
        var $stickyLeft = $('#sticky-left');
        var $stickyRight = $('#sticky-right');
        
        // Ensure the green box exists in memory to be appended later
        var $indicator = $('<div id="reading-indicator"></div>');

        var $markers = $('.mw-parser-output .opage');
        var lastActiveIndex = -1;

        if ($markers.length > 0) {

            function updateStickyHeader() {
                var scrollTop = $window.scrollTop();
                var viewportHeight = $window.height();
                var activeIndex = -1;

                // --- A. FIND ACTIVE PAGE ---
                // We consider a page "active" if its top is above the reading line
                // (Screen Top + 150px buffer)
                $markers.each(function (index) {
                    var $this = $(this);
                    if ($this.offset().top < scrollTop + 150) {
                        activeIndex = index;
                    }
                });

                // --- B. HANDLE TRANSITIONS (The "Swap") ---
                if (activeIndex > -1) {
                    var $currentMarker = $markers.eq(activeIndex);
                    var $nextMarker = $markers.eq(activeIndex + 1);

                    // If we switched pages, handle the DOM visibility swap
                    if (activeIndex !== lastActiveIndex) {
                        // 1. Unhide the PREVIOUS marker (so it scrolls up naturally)
                        if (lastActiveIndex > -1) {
                            var $oldMarker = $markers.eq(lastActiveIndex);
                            $oldMarker.css('visibility', 'visible');
                            $oldMarker.next('.otright').css('visibility', 'visible');
                        }

                        // 2. Hide the CURRENT marker (so the sticky one takes its place visually)
                        $currentMarker.css('visibility', 'hidden');
                        $currentMarker.next('.otright').css('visibility', 'hidden');

                        // 3. Update Sticky Content
                        $stickyLeft.html($currentMarker.html());
                        
                        var $imgContainer = $currentMarker.next('.otright');
                        var imgHtml = $imgContainer.length ? $imgContainer.html() : '';
                        
                        // Inject image and re-append the indicator div
                        $stickyRight.html(imgHtml).append($indicator);

                        // Show the tracker
                        $tracker.addClass('active');
                        lastActiveIndex = activeIndex;
                    }

                    // --- C. CALCULATE GREEN BOX ---
                    
                    // 1. Get Geometry
                    var attrCols = $currentMarker.attr('data-cols');
                    var cols = attrCols ? parseInt(attrCols) : globalPageColumns;

                    if (cols <= 0) {
                        $indicator.hide();
                        return;
                    }

                    var startY = $currentMarker.offset().top;
                    // End Y is either the next marker or the end of the content block
                    var endY = $nextMarker.length ? 
                               $nextMarker.offset().top : 
                               $('.mw-parser-output').offset().top + $('.mw-parser-output').outerHeight();

                    var sectionHeight = Math.max(endY - startY, 1);
                    
                    // 2. Calculate Progress (0.0 to 1.0)
                    var progressRaw = (scrollTop - startY) / sectionHeight;
                    // We want to track the *middle* of the viewport for reading, roughly
                    // But for the green box to encompass what is ON SCREEN, we need the viewport ratio.
                    
                    // Clamp progress
                    var progress = Math.min(Math.max(progressRaw, 0), 0.9999);

                    // 3. Map to Columns
                    var totalGeoProgress = progress * cols;
                    var colIndex = Math.floor(totalGeoProgress);
                    var verticalProgress = totalGeoProgress - colIndex; // 0.0 to 1.0 within the column

                    // 4. Calculate Height of the Green Box (From Alpha Logic)
                    // How much of the section fits in the viewport?
                    // If section is 2000px and viewport is 1000px, we see 50% at a time.
                    // Divided by columns, because the image represents the WHOLE height compressed into columns.
                    
                    // Effective height of one column of text
                    var columnHeight = sectionHeight / cols;
                    var ratioVisible = Math.min(viewportHeight / columnHeight, 1);
                    
                    // The box height as a percentage of the thumbnail height
                    var boxHeightPercent = ratioVisible * 100;
                    
                    // 5. Apply CSS
                    var boxWidth = 100 / cols;
                    var boxLeft = colIndex * boxWidth;
                    var boxTop = verticalProgress * 100;

                    $indicator.css({
                        'display': 'block',
                        'width': boxWidth + '%',
                        'height': boxHeightPercent + '%',
                        'left': boxLeft + '%',
                        'top': boxTop + '%'
                    });

                } else {
                    // We are above the first page
                    if (lastActiveIndex > -1) {
                         var $oldMarker = $markers.eq(lastActiveIndex);
                         $oldMarker.css('visibility', 'visible');
                         $oldMarker.next('.otright').css('visibility', 'visible');
                         lastActiveIndex = -1;
                    }
                    $tracker.removeClass('active');
                }
            }

            // Throttle scroll for performance
            var ticking = false;
            $window.on('scroll resize', function () {
                if (!ticking) {
                    window.requestAnimationFrame(function () {
                        updateStickyHeader();
                        ticking = false;
                    });
                    ticking = true;
                }
            });

            // Init
            updateStickyHeader();
        }
    });
})(jQuery);
