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
        // Inject redirect status for template logic (e.g. hiding categories)
        $data['is-redirect'] = $this->getTitle()->isRedirect();

        // ---------------------------------------------------------
        // PART 2: HEADER BUTTONS (ACTIONS)
        // ---------------------------------------------------------
        $namespaces = $data['data-portlets']['data-associated-pages']['array-items'] 
            ?? $data['data-portlets']['data-namespaces']['array-items'] 
            ?? [];

        $allPortlets = array_merge(
            $namespaces,
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
                    'text' => $this->msg( 'nightingale-darkmode-toggle' )->text(),
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

        $footerPortlets = [];
        if ( !empty( $hybridMenu ) ) {
            $footerPortlets[] = [
                'id' => 'actions',
                'label' => $this->msg( 'actions' )->text(),
                'array-items' => $hybridMenu
            ];
        }
        if ( !empty( $mobileTools ) ) {
            $footerPortlets[] = [
                'id' => 'tb',
                'label' => $mobileToolsLabel,
                'array-items' => $mobileTools
            ];
        }
        $data['nightingale-footer-portlets'] = $footerPortlets;
        $data['nightingale-footer-columns'] = $this->getFooterColumns();

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

            if ( !isset( $userMenu['array-items'] ) ) {
                $userMenu['array-items'] = [];
            }

            // Inject the "User page" link at the top for EVERYONE (Logged in & Anon)
            $userPageItem = [
                'id' => 'pt-userpage', 
                'class' => 'mw-list-item',
                'array-links' => [
                    [
                        'text' => $this->msg( 'nstab-user' )->text(),
                        'array-attributes' => [
                            [
                                'key' => 'href',
                                'value' => $user->getUserPage()->getLocalURL()
                            ]
                        ]
                    ]
                ]
            ];
            array_unshift( $userMenu['array-items'], $userPageItem );
        }

        return $data;
    }

    /**
     * Parses MediaWiki:Footer-menu into columns and links.
     * Supports "** Heading" with "* Target|Label" items (Bahaipedia style).
     */
    private function getFooterColumns(): array {
        $msg = $this->msg( 'footer-menu' )->inContentLanguage();
        if ( $msg->isDisabled() ) {
            return [];
        }

        $lines = explode( "\n", $msg->plain() );
        $columns = [];
        $currentColumn = null;

        foreach ( $lines as $line ) {
            $line = trim( $line );
            if ( $line === '' ) {
                continue;
            }

            // "** Section Heading"
            if ( strpos( $line, '**' ) === 0 ) {
                if ( $currentColumn !== null ) {
                    $columns[] = $currentColumn;
                }
                $headingRaw = trim( substr( $line, 2 ) );
                $parts = array_map( 'trim', explode( '|', $headingRaw, 2 ) );
                $label = count( $parts ) === 2 ? $parts[1] : $parts[0];

                $currentColumn = [
                    'html-id' => 'p-footer-' . Sanitizer::escapeIdForAttribute( $label ),
                    'label' => $label,
                    'array-items' => []
                ];
            }
            // "* Target|Label" or "* Target"
            elseif ( strpos( $line, '*' ) === 0 && $currentColumn !== null ) {
                $itemRaw = trim( substr( $line, 1 ) );
                if ( $itemRaw === '' ) {
                    continue;
                }

                $parts = array_map( 'trim', explode( '|', $itemRaw, 2 ) );
                $target = $parts[0];
                $text = count( $parts ) === 2 ? $parts[1] : $target;

                if ( preg_match( '/^(https?:)?\/\//i', $target ) ) {
                    $href = $target;
                } else {
                    $title = \MediaWiki\Title\Title::newFromText( $target );
                    $href = $title ? $title->getLocalURL() : '#';
                }

                $currentColumn['array-items'][] = [
                    'id' => 'f-' . Sanitizer::escapeIdForAttribute( $text ),
                    'class' => 'mw-list-item',
                    'array-links' => [
                        [
                            'text' => $text,
                            'array-attributes' => [
                                [ 'key' => 'href', 'value' => $href ]
                            ]
                        ]
                    ]
                ];
            }
        }

        if ( $currentColumn !== null ) {
            $columns[] = $currentColumn;
        }

        return $columns;
    }
}
