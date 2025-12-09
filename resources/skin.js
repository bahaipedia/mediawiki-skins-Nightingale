/**
 * Skin:Nightingale Core Logic
 * Reconciles "Alpha" (Visual Tracking) and "Beta" (Layout/Columns)
 * Final Version: Skewed Timing + Skip First Page
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
           2. COLUMN CONFIGURATION (Enhanced)
           Now supports dynamic logic based on Issue Number
           ================================================================== */
        function getPageColumnCount() {
            var pageName = mw.config.get('wgPageName');

            var config = [
                // 1. COMPLEX PUBLICATIONS (Function-based logic)
                { 
                    pattern: /^Bahá’í_News/, 
                    cols: function(name) {
                        // Extract issue number (e.g. "Issue_499")
                        var match = name.match(/Issue_(\d+)/);
                        if (match && match[1]) {
                            var issueNum = parseInt(match[1], 10);
                            
                            // User Rule: First 300 issues = 3 columns. Afterwards = 2.
                            return (issueNum <= 300) ? 3 : 2; 
                        }
                        return 2; // Fallback if no issue number found
                    }
                },

                // 2. STANDARD PUBLICATIONS (Static counts)
                { pattern: /^The_American_Bahá’í/, cols: 0 },
                { pattern: /^World_Order/,          cols: 2 },
                { pattern: /^Star_of_the_West/,     cols: 2 },
                
                // Fallback for sub-pages or unknown variations
                { pattern: /^Bahá’í_News/,          cols: 2 } 
            ];

            for (var i = 0; i < config.length; i++) {
                if (config[i].pattern.test(pageName)) {
                    // Check if 'cols' is a fixed number or a function
                    if (typeof config[i].cols === 'function') {
                        return config[i].cols(pageName);
                    }
                    return config[i].cols;
                }
            }
            return 1; // Default for books/unknown
        }

        /* ==================================================================
           3. STICKY TRACKER & GREEN BOX LOGIC
           ================================================================== */
        var $window = $(window);
        var $tracker = $('#sticky-page-tracker');
        var $stickyRight = $('#sticky-right');
        
        var $indicator = $('<div id="reading-indicator"></div>'); // Styling moved to CSS

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
                    if ($this.offset().top < scrollTop + 150) {
                        activeIndex = index;
                    }
                });

                // --- B. ACTIVATION LOGIC (SKIP FIRST PAGE) ---
                // We only activate if we are past the first page (Index > 0).
                // This prevents the "Jump" at the top and ignores the Cover Page.
                if (activeIndex > 0) {
                    var $currentMarker = $markers.eq(activeIndex);
                    var $nextMarker = $markers.eq(activeIndex + 1);

                    // If we just switched to a new page (or entered sticky mode)
                    if (activeIndex !== lastActiveIndex) {
                        
                        // 1. Unhide the previous marker (if valid)
                        if (lastActiveIndex > -1) {
                            var $oldMarker = $markers.eq(lastActiveIndex);
                            $oldMarker.next('.otright').css('visibility', 'visible');
                        }

                        // 2. Hide the CURRENT static image (so sticky takes over)
                        $currentMarker.next('.otright').css('visibility', 'hidden');

                        // 3. Clone content into Sticky Header
                        var $imgContainer = $currentMarker.next('.otright');
                        var imgHtml = $imgContainer.length ? $imgContainer.html() : '';
                        
                        $stickyRight.html(imgHtml).append($indicator);

                        // 4. Show the tracker
                        $tracker.addClass('active');
                        lastActiveIndex = activeIndex;
                    }

                    // --- C. CALCULATE GREEN BOX (With Timing Fix) ---
                    
                    // CONFIG:
                    var scanMarginY = 0.07; // 7% vertical margins
                    var splitThreshold = 0.39; // Switch columns at 39% progress

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
                    
                    // 2. Calculate Progress
                    var progressRaw = (scrollTop - startY) / sectionHeight;
                    var linearProgress = Math.min(Math.max(progressRaw, 0), 1); 

                    // 3. Apply Skew (Timing Fix)
                    var skewedProgress = linearProgress;
                    if (cols === 2) {
                        if (linearProgress < splitThreshold) {
                            skewedProgress = (linearProgress / splitThreshold) * 0.5;
                        } else {
                            skewedProgress = 0.5 + ((linearProgress - splitThreshold) / (1 - splitThreshold)) * 0.5;
                        }
                    }

                    // 4. Map to Columns
                    var totalGeoProgress = skewedProgress * cols;
                    var colIndex = Math.floor(totalGeoProgress);
                    
                    if (colIndex >= cols) colIndex = cols - 1;

                    var verticalProgress = totalGeoProgress - colIndex; 

                    // 5. Pixel Math (Vertical)
                    var $img = $stickyRight.find('img');
                    var imgHeight = $img.height() || $stickyRight.height();
                    var boxHeightPx = 100; 

                    var effectiveImgHeight = imgHeight * (1 - (scanMarginY * 2));
                    var topMarginPx = imgHeight * scanMarginY;
                    var maxTravelPx = effectiveImgHeight - boxHeightPx;
                    
                    if (maxTravelPx < 0) maxTravelPx = 0;

                    var boxTopPx = topMarginPx + (verticalProgress * maxTravelPx);

                    // 6. Horizontal Math
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
                    // --- DEACTIVATION LOGIC ---
                    // If we are at Index 0 (Cover Page) or above the content
                    if (lastActiveIndex > -1) {
                         // Make sure the last used sticky image becomes visible again
                         var $oldMarker = $markers.eq(lastActiveIndex);
                         $oldMarker.next('.otright').css('visibility', 'visible');
                         lastActiveIndex = -1;
                    }
                    // Hide the sticky tracker completely
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
