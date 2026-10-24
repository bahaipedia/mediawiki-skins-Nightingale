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
        var $menuContainers = $('.mw-portlet, .nightingale-dropup');
        var $menuCheckboxes = $menuContainers.find('input[type="checkbox"]');

        $(window).on('click', function () {
            $menuCheckboxes.prop('checked', false);
        });

        $menuContainers.on('click', function (e) {
            e.stopPropagation();
        });

        $menuCheckboxes.on('change', function () {
            if ($(this).is(':checked')) {
                $menuCheckboxes.not(this).prop('checked', false);
            }
        });
    });
})(jQuery);
