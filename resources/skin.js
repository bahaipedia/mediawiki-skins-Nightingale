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
           2. COLUMN CONFIGURATION (Robust Array Method)
           ================================================================== */
        function getPageColumnCount() {
            var pageName = mw.config.get('wgPageName');

            var config = [
                // 1. Bahá’í News: Special Logic for 3-Column Issues
                { 
                    pattern: /^Bahá’í_News/, 
                    cols: function(name) {
                        // Look for Issue Number
                        var match = name.match(/Issue_(\d+)/);
                        if (match) {
                            // Issues 1-321 are 3 columns. 322+ are 2 columns.
                            return (parseInt(match[1], 10) <= 321) ? 3 : 2; 
                        }
                        return 2; // Fallback
                    }
                },
                
                // 2. Standard Periodicals
                { pattern: /^World_Order/,          cols: 2 },
                { pattern: /^Star_of_the_West/,     cols: 2 },
                
                // 3. Exclusions
                { pattern: /^The_American_Bahá’í/, cols: 0 }
            ];

            for (var i = 0; i < config.length; i++) {
                if (config[i].pattern.test(pageName)) {
                    // Support both static numbers and dynamic functions
                    if (typeof config[i].cols === 'function') {
                        return config[i].cols(pageName);
                    }
                    return config[i].cols;
                }
            }
            
            // DEFAULT: 0 (Disabled for standard books)
            return 0; 
        }

        var globalPageColumns = getPageColumnCount();

        /* ==================================================================
           3. STICKY TRACKER & GREEN BOX LOGIC
           ================================================================== */
        var $window = $(window);
        var $tracker = $('#sticky-page-tracker');
        var $stickyRight = $('#sticky-right');
        var $indicator = $('<div id="reading-indicator"></div>'); // Styling in CSS
        
        var $markers = $('.mw-parser-output .opage');
        var lastActiveIndex = -1;

        if ($markers.length > 0) {

            function updateStickyHeader() {
                var scrollTop = $window.scrollTop();
                var activeIndex = -1;

                // --- A. FIND ACTIVE PAGE ---
                $markers.each(function (index) {
                    if ($(this).offset().top < scrollTop + 150) {
                        activeIndex = index;
                    }
                });

                // --- PRE-CALCULATE COLS ---
                // We must know cols BEFORE deciding to activate the tracker
                var cols = 0;
                if (activeIndex > -1) {
                    var $tempMarker = $markers.eq(activeIndex);
                    var attrCols = $tempMarker.attr('data-cols');
                    cols = attrCols ? parseInt(attrCols) : globalPageColumns;
                }

                // --- B. ACTIVATION LOGIC ---
                // Rule 1: Must be past the cover page (Index > 0)
                // Rule 2: Must have valid columns (cols > 0)
                if (activeIndex > 0 && cols > 0) {
                    
                    var $currentMarker = $markers.eq(activeIndex);
                    var $nextMarker = $markers.eq(activeIndex + 1);

                    // If we just switched pages
                    if (activeIndex !== lastActiveIndex) {
                        // 1. Restore previous static image
                        if (lastActiveIndex > -1) {
                            $markers.eq(lastActiveIndex).next('.otright').css('visibility', 'visible');
                        }

                        // 2. Hide current static image
                        $currentMarker.next('.otright').css('visibility', 'hidden');

                        // 3. Update Sticky Content
                        var $imgContainer = $currentMarker.next('.otright');
                        var imgHtml = $imgContainer.length ? $imgContainer.html() : '';
                        $stickyRight.html(imgHtml).append($indicator);

                        $tracker.addClass('active');
                        lastActiveIndex = activeIndex;
                    }

                    // --- C. CALCULATE GREEN BOX ---
                    // Config
                    var scanMarginY = 0.08; 
                    var splitThreshold = 0.42; 

                    var startY = $currentMarker.offset().top;
                    var endY = $nextMarker.length ? 
                               $nextMarker.offset().top : 
                               $('.mw-parser-output').offset().top + $('.mw-parser-output').outerHeight();
                    var sectionHeight = Math.max(endY - startY, 1);
                    
                    var progressRaw = (scrollTop - startY) / sectionHeight;
                    var linearProgress = Math.min(Math.max(progressRaw, 0), 1); 

                    // Skew Logic
                    var skewedProgress = linearProgress;
                    if (cols === 2) {
                        if (linearProgress < splitThreshold) {
                            skewedProgress = (linearProgress / splitThreshold) * 0.5;
                        } else {
                            skewedProgress = 0.5 + ((linearProgress - splitThreshold) / (1 - splitThreshold)) * 0.5;
                        }
                    }

                    // Grid Math
                    var totalGeoProgress = skewedProgress * cols;
                    var colIndex = Math.floor(totalGeoProgress);
                    if (colIndex >= cols) colIndex = cols - 1;
                    var verticalProgress = totalGeoProgress - colIndex; 

                    // Pixel Math
                    var $img = $stickyRight.find('img');
                    var imgHeight = $img.height() || $stickyRight.height();
                    var boxHeightPx = 100; 
                    
                    var effectiveImgHeight = imgHeight * (1 - (scanMarginY * 2));
                    var topMarginPx = imgHeight * scanMarginY;
                    var maxTravelPx = effectiveImgHeight - boxHeightPx;
                    if (maxTravelPx < 0) maxTravelPx = 0;

                    var boxTopPx = topMarginPx + (verticalProgress * maxTravelPx);
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
                    // --- DEACTIVATION ---
                    // Occurs if we are at Top, OR if cols=0 (Standard Book)
                    if (lastActiveIndex > -1) {
                        $markers.eq(lastActiveIndex).next('.otright').css('visibility', 'visible');
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
            
            // Run once on load to catch initial state
            updateStickyHeader();
        }
    });
})(jQuery);
