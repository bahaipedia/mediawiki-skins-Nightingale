<?php

class SkinNightingale extends SkinMustache {

    public function getDefaultModules(): array {
        $modules = parent::getDefaultModules();
        $modules['scripts'][] = 'skins.nightingale.search';
        return $modules;
    }

    public function getTemplateData() {
        $data = parent::getTemplateData();

        // ---------------------------------------------------------
        // PART 0: INJECT DARK MODE SCRIPT
        // ---------------------------------------------------------
        // Checks localStorage first, then system preference, preventing "flash of white"
        $script = <<<JS
        <script>
        (function() {
            var html = document.documentElement;
            var savedTheme = localStorage.getItem('nightingale-dark-mode');
            var isDark = false;

            if (savedTheme !== null) {
                // User explicitly set a preference previously
                isDark = savedTheme === 'true';
            } else {
                // No saved preference, use system default
                isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            }

            if (isDark) {
                html.classList.add('nightingale-dark-mode');
            }
            
            // Define the toggle function globally
            window.toggleNightingaleDarkMode = function(e) {
                e.preventDefault();
                var currentlyDark = html.classList.toggle('nightingale-dark-mode');
                // Save the new explicit choice, overriding system default
                localStorage.setItem('nightingale-dark-mode', currentlyDark);
            };
        })();
        </script>
        JS;
        $this->getOutput()->addHeadItem( 'nightingale-darkmode', $script );

        // ---------------------------------------------------------
        // PART 1: GLOBAL FLAGS & METADATA
        // ---------------------------------------------------------
        $data['is-redirect'] = $this->getTitle()->isRedirect();
        if ( $data['is-redirect'] ) {
            $this->getOutput()->addModules( 'skins.nightingale.redirectfixer' );
        }

        // ---------------------------------------------------------
        // PART 2: HEADER BUTTONS (ACTIONS)
        // ---------------------------------------------------------
        $allPortlets = array_merge(
            $data['data-portlets']['data-namespaces']['array-items'] ?? [],
            $data['data-portlets']['data-views']['array-items'] ?? [],
            $data['data-portlets']['data-actions']['array-items'] ?? []
        );

        $editButton = null;
        $talkButton = null;
        $hybridMenu = [];

        foreach ( $allPortlets as $item ) {
            $id = $item['id'] ?? '';
            if ( $id === 'ca-view' ) continue;
            
            if ( $id === 'ca-edit' || $id === 'ca-viewsource' ) {
                $editButton = $item;
            } elseif ( $id === 'ca-talk' || $id === 'ca-nstab-talk' ) {
                $talkButton = $item;
            } else {
                $hybridMenu[] = $item;
            }
        }

        $data['nightingale-content-edit'] = $editButton ? [ $editButton ] : [];
        $data['nightingale-content-talk'] = $talkButton ? [ $talkButton ] : [];
        $data['nightingale-content-hybrid'] = $hybridMenu;

        // ---------------------------------------------------------
        // PART 3: PREPARE SIDEBAR DATA
        // ---------------------------------------------------------
        $sidebarFirst = $data['data-portlets-sidebar']['data-portlets-first'] ?? null;
        $sidebarRest = $data['data-portlets-sidebar']['array-portlets-rest'] ?? [];
        
        $allSidebar = [];
        if ( $sidebarFirst ) {
            $allSidebar[] = $sidebarFirst;
        }
        $allSidebar = array_merge( $allSidebar, $sidebarRest );

        $sidebarMenus = []; 
        $mobileTools = [];  
        $mobileLinks = [];  
        
        $mobileToolsLabel = $this->msg('toolbox')->text();

        foreach ( $allSidebar as $portlet ) {
            $id = $portlet['id'] ?? '';
            $items = $portlet['array-items'] ?? [];
            $label = $portlet['label'] ?? '';

            if ( empty( $items ) ) {
                continue;
            }

            if ( $id === 'p-navigation' ) {
                continue;
            }
            if ( $id === 'p-wikibase-otherprojects' || $id === 'p-wikibase' ) {
                $mobileLinks = array_merge( $mobileLinks, $items );
            }
            elseif ( $id === 'p-tb' ) {
                $mobileTools = array_merge( $mobileTools, $items );
                if ( !empty($label) ) {
                    $mobileToolsLabel = $label;
                }
            }
            else {
                if ( empty($id) ) {
                    $id = 'p-' . Sanitizer::escapeIdForAttribute( $label );
                }
                $portlet['html-id'] = $id; 
                $sidebarMenus[] = $portlet;
            }
        }

        // --- MANUALLY ADD SPECIAL PAGES ---
        $mobileTools[] = [
            'id' => 't-specialpages',
            'class' => 'mw-list-item',
            'array-links' => [
                [
                    'text' => $this->msg( 'specialpages' )->text(),
                    'array-attributes' => [
                        [ 'key' => 'href', 'value' => \SpecialPage::getTitleFor( 'SpecialPages' )->getLocalURL() ],
                        [ 'key' => 'title', 'value' => $this->msg( 'specialpages' )->text() ]
                    ]
                ]
            ]
        ];

        // --- NEW: ADD DARK MODE TOGGLE TO TOOLS ---
        $mobileTools[] = [
            'id' => 't-darkmode',
            'class' => 'mw-list-item',
            'array-links' => [
                [
                    'text' => 'Dark Mode', // You can use $this->msg('nightingale-darkmode') if you add it to i18n
                    'array-attributes' => [
                        [ 'key' => 'href', 'value' => '#' ],
                        [ 'key' => 'onclick', 'value' => 'toggleNightingaleDarkMode(event)' ]
                    ]
                ]
            ]
        ];
        // ------------------------------------------------

        $langRaw = $data['data-portlets']['data-languages']['array-items'] ?? [];
        $langClean = array_filter( $langRaw, function( $item ) {
            return strpos( $item['class'] ?? '', 'wbc-editpage' ) === false;
        });
        $mobileLinks = array_merge( $mobileLinks, $langClean );

        // ---------------------------------------------------------
        // PART 4: ASSIGN TO TEMPLATE
        // ---------------------------------------------------------
        $data['nightingale-sidebar-menus'] = $sidebarMenus;

        $data['nightingale-mobile-tools'] = $mobileTools;
        $data['nightingale-mobile-tools-label'] = $mobileToolsLabel;

        $data['nightingale-mobile-links'] = $mobileLinks;
        $data['nightingale-mobile-links-label'] = $this->msg('nightingale-mobile-links-label')->text();
        $data['nightingale-has-mobile-links'] = !empty($mobileLinks);

        // ---------------------------------------------------------
        // PART 5: USER MENU
        // ---------------------------------------------------------
        $user = $this->getSkin()->getUser();
        if ( isset($data['data-portlets']['data-user-menu']) ) {
            $userMenu = &$data['data-portlets']['data-user-menu'];
            if ( !isset($userMenu['class']) ) { $userMenu['class'] = ''; }
            
            if ( $user->isNamed() ) {
                $userMenu['label'] = $user->getName();
                $userMenu['class'] .= ' is-loggedin';
            } else {
                $userMenu['class'] .= ' is-anon';
            }
        }

        return $data;
    }
}
