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
                    var endY = $nextMarker.length ? 
                               $nextMarker.offset().top : 
                               $('.mw-parser-output').offset().top + $('.mw-parser-output').outerHeight();

                    var sectionHeight = Math.max(endY - startY, 1);
                    
                    // 2. Calculate Progress (0.0 to 1.0)
                    var progressRaw = (scrollTop - startY) / sectionHeight;
                    var progress = Math.min(Math.max(progressRaw, 0), 1); // Clamp 0-1

                    // 3. Map to Columns
                    var totalGeoProgress = progress * cols;
                    var colIndex = Math.floor(totalGeoProgress);
                    
                    // Edge case: if exactly 100%, clamp to last column
                    if (colIndex >= cols) colIndex = cols - 1;

                    var verticalProgress = totalGeoProgress - colIndex; // 0.0 to 1.0 within the column

                    // 4. PIXEL MATH (The Fix)
                    // Get the actual height of the image displayed in the sticky tracker
                    var $img = $stickyRight.find('img');
                    var imgHeight = $img.height();
                    
                    // If image isn't loaded yet, fallback to container height
                    if (!imgHeight) imgHeight = $stickyRight.height();

                    // USER SETTING: Fixed Green Box Height
                    var boxHeightPx = 100; 
                    
                    // Calculate the maximum "Top" value allowed
                    // (Image Height - Box Height). This ensures the bottom of the box 
                    // never goes past the bottom of the image.
                    var maxTopPx = imgHeight - boxHeightPx;
                    
                    // Allow negative maxTop if image is tiny (prevents broken math), 
                    // though usually image > 100px.
                    if (maxTopPx < 0) maxTopPx = 0; 

                    var boxTopPx = verticalProgress * maxTopPx;

                    // 5. Apply CSS
                    var boxWidth = 100 / cols;
                    var boxLeft = colIndex * boxWidth;

                    $indicator.css({
                        'display': 'block',
                        'width': boxWidth + '%',
                        'height': boxHeightPx + 'px', // Fixed 100px
                        'left': boxLeft + '%',
                        'top': boxTopPx + 'px'        // Pixel positioned
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
