$(function () {
    // 1. Find the link to the immediate redirect target
    // MediaWiki puts this in <ul class="redirectText"><li><a ...>Target</a></li></ul>
    var $targetLink = $('.redirectText a').first();
    
    if ($targetLink.length === 0) {
        return; // Not a standard redirect page
    }

    var immediateTarget = $targetLink.attr('title'); // e.g. "Pilgrims' Notes"
    var currentTitle = mw.config.get('wgPageName');  // e.g. "Pilgrims's Notes"

    // 2. Query the API to see if the immediate target is ALSO a redirect
    var api = new mw.Api();

    api.get({
        action: 'query',
        titles: immediateTarget,
        redirects: 1 // This is the magic: it tells API to resolve the chain
    }).done(function (data) {
        
        // If the API resolved a redirect, 'redirects' array will exist
        if (data.query.redirects) {
            
            // The API returns the final resolved page in 'pages'
            var pageId = Object.keys(data.query.pages)[0];
            var finalPage = data.query.pages[pageId];
            var finalTarget = finalPage.title;

            // 3. Compare: If Immediate Target != Final Target, we have a Double Redirect
            if (finalTarget && finalTarget !== immediateTarget) {
                renderFixButton(immediateTarget, finalTarget, currentTitle);
            }
        }
    });

    function renderFixButton(badTarget, goodTarget, currentTitle) {
        var $container = $('<div class="ridvan-double-redirect-alert"></div>')
            .css({
                'margin-top': '10px',
                'padding': '10px',
                'background-color': '#fef6f6',
                'border': '1px solid #fcbbbb',
                'color': '#b91c1c'
            });

        var $msg = $('<span>').html(
            '<strong>Double Redirect Detected:</strong> This page points to <em>' + badTarget + 
            '</em>, which redirects to <em>' + goodTarget + '</em>. '
        );

        var $button = $('<button>')
            .text('Fix: Point directly to ' + goodTarget)
            .css({
                'margin-left': '10px',
                'cursor': 'pointer',
                'font-weight': 'bold'
            })
            .click(function () {
                doFix(goodTarget, currentTitle, $(this));
            });

        $container.append($msg).append($button);
        $('.redirectMsg').after($container);
    }

    function doFix(newTarget, pageTitle, $btn) {
        $btn.prop('disabled', true).text('Fixing...');
        
        api.postWithToken('csrf', {
            action: 'edit',
            title: pageTitle,
            text: '#REDIRECT [[' + newTarget + ']]',
            summary: 'Fixing double redirect to [[' + newTarget + ']] via Ridvan Skin',
            minor: 1
        }).done(function () {
            // Reload the page to show the fix
            window.location.reload();
        }).fail(function (code, data) {
            alert('Failed to fix redirect: ' + code);
            $btn.prop('disabled', false).text('Try Again');
        });
    }
});
