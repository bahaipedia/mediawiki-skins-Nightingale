(function ($) {
    $(function () {
        // 1. Menu Logic (From Ridvan)
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

        // 2. NIGHTINGALE STICKY LOGIC
        var $window = $(window);
        var $stickyImg = $('#sticky-image');
        var $stickyPage = $('#sticky-page-indicator');
        var $stickyGuide = $('#sticky-reading-guide');
        var $stickyRail = $('#nightingale-sticky-rail');

        // Find all page anchors. Assuming format id="pg1", id="pg2" inside span.opage
        // We look for the span with class 'opage' and get the anchor inside it
        var pageMarkers = [];

        $('.opage').each(function () {
            var $this = $(this);
            var $anchor = $this.find('span[id^="pg"]');
            var pageNum = $anchor.attr('id').replace('pg', '');
            
            // Find the associated image. 
            // In your markup, .otright comes shortly after .opage or is resolvable
            // Since .otright floats right of the same paragraph, we assume sequential order in DOM
            // or we find the closest .otright following this marker.
            
            // Using a simple traversal: find the next .otright after this .opage
            // Note: This depends heavily on DOM order. 
            var $imgContainer = $this.closest('p, div').find('.otright img');
            if ($imgContainer.length === 0) {
                // Try finding the next one in the whole document if not in same parent
                $imgContainer = $this.nextAll('.otright').first().find('img');
            }

            if ($imgContainer.length) {
                // Hide the inline image on desktop since we show it in the rail
                // We use CSS to hide .otright on desktop, but we need the src here
                pageMarkers.push({
                    top: $this.offset().top,
                    pageNum: pageNum,
                    imgSrc: $imgContainer.attr('src')
                });
            }
        });

        if (pageMarkers.length === 0) return;

        function updateSticky() {
            var scrollTop = $window.scrollTop();
            var viewportHeight = $window.height();
            var scrollMiddle = scrollTop + (viewportHeight / 3); // Reading focus usually top 3rd

            // Find current page
            var currentIndex = 0;
            for (var i = 0; i < pageMarkers.length; i++) {
                if (scrollTop >= pageMarkers[i].top - 100) {
                    currentIndex = i;
                } else {
                    break;
                }
            }

            var currentMarker = pageMarkers[currentIndex];
            var nextMarker = pageMarkers[currentIndex + 1];

            // Update Image and Page Number
            if ($stickyImg.attr('src') !== currentMarker.imgSrc) {
                $stickyImg.attr('src', currentMarker.imgSrc);
                $stickyPage.text("Page " + currentMarker.pageNum);
            }

            // CALCULATE GREEN BOX
            if (nextMarker) {
                var sectionHeight = nextMarker.top - currentMarker.top;
                var progressPx = scrollTop - currentMarker.top;
                
                // Clamp progress (0 to 1)
                var progressRatio = Math.max(0, Math.min(1, progressPx / sectionHeight));

                // Height of the sticky image
                var imgHeight = $stickyImg.height();
                
                // Height of the guide box
                // We estimate the viewport text capacity vs the section height
                // If section is 1000px and viewport is 500px, box is 50% of image.
                var guideHeightRatio = Math.min(1, viewportHeight / sectionHeight);
                var guideHeightPx = imgHeight * guideHeightRatio;

                // Top position
                var guideTopPx = (imgHeight - guideHeightPx) * progressRatio;

                $stickyGuide.css({
                    'display': 'block',
                    'height': guideHeightPx + 'px',
                    'top': guideTopPx + 'px'
                });

            } else {
                // Last page
                $stickyGuide.css('display', 'none');
            }
        }

        // Throttle scroll event
        var ticking = false;
        $window.on('scroll resize', function () {
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    updateSticky();
                    ticking = false;
                });
                ticking = true;
            }
        });

        // Init
        // Wait for images to load to get heights correct
        $stickyImg.on('load', updateSticky);
        updateSticky();
    });
})(jQuery);
