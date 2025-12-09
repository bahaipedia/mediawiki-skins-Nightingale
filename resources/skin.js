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
                $markers.each(function (index) {
                    var $this = $(this);
                    // Active if top is above reading line
                    if ($this.offset().top < scrollTop + 150) {
                        activeIndex = index;
                    }
                });

                // --- B. HANDLE TRANSITIONS (Image Only) ---
                if (activeIndex > -1) {
                    var $currentMarker = $markers.eq(activeIndex);
                    var $nextMarker = $markers.eq(activeIndex + 1);

                    if (activeIndex !== lastActiveIndex) {
                        // 1. Reset PREVIOUS image visibility
                        if (lastActiveIndex > -1) {
                            var $oldMarker = $markers.eq(lastActiveIndex);
                            $oldMarker.next('.otright').css('visibility', 'visible');
                        }

                        // 2. Hide CURRENT image (so sticky takes over)
                        // Note: We do NOT hide $currentMarker (the page number) anymore
                        $currentMarker.next('.otright').css('visibility', 'hidden');

                        // 3. Update Sticky Content (Right Side Only)
                        var $imgContainer = $currentMarker.next('.otright');
                        var imgHtml = $imgContainer.length ? $imgContainer.html() : '';
                        
                        $stickyRight.html(imgHtml).append($indicator);

                        // Show the tracker
                        $tracker.addClass('active');
                        lastActiveIndex = activeIndex;
                    }

                    // --- C. CALCULATE GREEN BOX (With Timing Fix) ---
                    
                    // CONFIG 1: Vertical Margin (White space on scan edges)
                    var scanMarginY = 0.08; 
                    
                    // CONFIG 2: Split Threshold (Fixes the "Late Switch" issue)
                    // 0.5 = Even split. 
                    // 0.42 = Switch to Col 2 when 42% through the section (Jump earlier).
                    var splitThreshold = 0.42; 

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
                    
                    // 2. Calculate Linear Progress (0.0 to 1.0)
                    var progressRaw = (scrollTop - startY) / sectionHeight;
                    var linearProgress = Math.min(Math.max(progressRaw, 0), 1); 

                    // 3. APPLY SKEW (The Timing Fix)
                    // If we have 2 columns, we distort time to make Col 1 faster and Col 2 longer
                    var skewedProgress = linearProgress;
                    
                    if (cols === 2) {
                        if (linearProgress < splitThreshold) {
                            // Map 0 -> 0.42  TO  0 -> 0.5 (Accelerate first half)
                            skewedProgress = (linearProgress / splitThreshold) * 0.5;
                        } else {
                            // Map 0.42 -> 1.0  TO  0.5 -> 1.0 (Stretch second half)
                            skewedProgress = 0.5 + ((linearProgress - splitThreshold) / (1 - splitThreshold)) * 0.5;
                        }
                    }

                    // 4. Map to Columns
                    var totalGeoProgress = skewedProgress * cols;
                    var colIndex = Math.floor(totalGeoProgress);
                    
                    if (colIndex >= cols) colIndex = cols - 1;

                    var verticalProgress = totalGeoProgress - colIndex; 

                    // 5. PIXEL MATH (Vertical Position)
                    var $img = $stickyRight.find('img');
                    var imgHeight = $img.height() || $stickyRight.height();
                    var boxHeightPx = 100; // Fixed height

                    // Vertical Margin Logic
                    var effectiveImgHeight = imgHeight * (1 - (scanMarginY * 2));
                    var topMarginPx = imgHeight * scanMarginY;
                    var maxTravelPx = effectiveImgHeight - boxHeightPx;
                    
                    if (maxTravelPx < 0) maxTravelPx = 0;

                    var boxTopPx = topMarginPx + (verticalProgress * maxTravelPx);

                    // 6. HORIZONTAL MATH
                    var boxWidth = 100 / cols;
                    var boxLeft = colIndex * boxWidth;

                    $indicator.css({
                        'display': 'block',
                        'width': boxWidth + '%',
                        'height': boxHeightPx + 'px', 
                        'left': boxLeft + '%',
                        'top': boxTopPx + 'px'
                    });

                } else {
                    // Reset if scrolled to top
                    if (lastActiveIndex > -1) {
                         var $oldMarker = $markers.eq(lastActiveIndex);
                         $oldMarker.next('.otright').css('visibility', 'visible');
                         lastActiveIndex = -1;
                    }
                    $tracker.removeClass('active');
                }
            }

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

            updateStickyHeader();
        }
    });
})(jQuery);
