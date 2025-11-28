<?php

class SkinRidvan extends SkinMustache {

    public function getTemplateData() {
        $data = parent::getTemplateData();

        // ---------------------------------------------------------
        // PART 1: HEADER BUTTONS
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
            if ( $id === 'ca-view' ) {
                continue;
            }
            if ( $id === 'ca-edit' || $id === 'ca-viewsource' ) {
                $editButton = $item;
            } elseif ( $id === 'ca-talk' || $id === 'ca-nstab-talk' ) {
                $talkButton = $item;
            } else {
                $hybridMenu[] = $item;
            }
        }

        $data['ridvan-content-edit'] = $editButton ? [ $editButton ] : [];
        $data['ridvan-content-talk'] = $talkButton ? [ $talkButton ] : [];
        $data['ridvan-content-hybrid'] = $hybridMenu;

        // ---------------------------------------------------------
        // PART 2: CLEANUP LANGUAGES
        // ---------------------------------------------------------
        if ( isset( $data['data-portlets']['data-languages']['array-items'] ) ) {
            $langItems = $data['data-portlets']['data-languages']['array-items'];
            $realLanguages = array_filter( $langItems, function( $item ) {
                return strpos( $item['class'] ?? '', 'wbc-editpage' ) === false;
            });
            if ( empty( $realLanguages ) ) {
                unset( $data['data-portlets']['data-languages'] );
            }
        } else {
            unset( $data['data-portlets']['data-languages'] );
        }

        // ---------------------------------------------------------
        // PART 3: MODIFY SIDEBAR DATA (INJECT & REMOVE)
        // ---------------------------------------------------------

        // 1. Existing Loop: Modifications (Inject Special Pages, Remove Nav)
        if ( isset( $data['data-portlets-sidebar']['array-portlets-rest'] ) ) {
            foreach ( $data['data-portlets-sidebar']['array-portlets-rest'] as $key => &$portlet ) {
                $id = $portlet['id'] ?? '';

                // 1. INJECT SPECIAL PAGES INTO TOOLBOX (p-tb)
                if ( $id === 'p-tb' ) {
                    // Ensure the array exists
                    if ( !isset( $portlet['array-items'] ) ) {
                        $portlet['array-items'] = [];
                    }
                    $portlet['array-items'][] = [
                        'id' => 't-specialpages',
                        'class' => 'mw-list-item',
                        'array-links' => [
                            [
                                'text' => $this->msg( 'specialpages' )->text(),
                                'array-attributes' => [
                                    [
                                        'key' => 'href',
                                        'value' => \SpecialPage::getTitleFor( 'SpecialPages' )->getLocalURL()
                                    ],
                                    [
                                        'key' => 'title',
                                        'value' => $this->msg( 'specialpages' )->text()
                                    ]
                                ]
                            ]
                        ]
                    ];
                }

                // 2. REMOVE FALLBACK NAVIGATION (p-navigation)
                if ( $id === 'p-navigation' ) {
                    unset( $data['data-portlets-sidebar']['array-portlets-rest'][$key] );
                }
            }
            unset($portlet); 

            // -----------------------------------------------------
            // ORDER THE SIDEBAR
            // -----------------------------------------------------
            $currentRest = array_values( $data['data-portlets-sidebar']['array-portlets-rest'] );
            
            $bucketTools = [];
            $bucketWikibase = [];
            $bucketSidebar = [];

            foreach ( $currentRest as $item ) {
                $id = $item['id'] ?? '';

                if ( $id === 'p-tb' ) {
                    $bucketTools[] = $item;
                } 
                elseif ( $id === 'p-wikibase-otherprojects' || $id === 'p-wikibase' ) {
                    $bucketWikibase[] = $item;
                } 
                else {
                    // This catches standard MediaWiki:Sidebar menus
                    $bucketSidebar[] = $item;
                }
            }

            // MERGE IN SPECIFIC ORDER: Sidebar -> Wikibase -> Tools
            $data['data-portlets-sidebar']['array-portlets-rest'] = array_merge(
                $bucketSidebar, 
                $bucketWikibase, 
                $bucketTools
            );

            // Re-index array
            $data['data-portlets-sidebar']['array-portlets-rest'] = array_values( $data['data-portlets-sidebar']['array-portlets-rest'] );
        }

        // ---------------------------------------------------------
        // PART 4: MOBILE DATA PREPARATION (STRICT MODE)
        // ---------------------------------------------------------

        // 1. MOBILE MENU 
        // Get the actual portlet data to extract the label
        $navPortlet = $data['data-portlets-sidebar']['data-portlets-first'] ?? [];
        $mobileMenu = $navPortlet['array-items'] ?? [];
        
        // DYNAMIC LABEL: Use the label from the first sidebar item (usually "Navigation")
        $mobileMenuLabel = $navPortlet['label'] ?? $this->msg('navigation')->text();

        // 2. SORT SIDEBAR "REST" -> TOOLS vs LINKS
        $sidebarRest = $data['data-portlets-sidebar']['array-portlets-rest'] ?? [];
        
        $mobileTools = [];
        $mobileLinks = [];
        
        // DYNAMIC LABEL: Default to standard "Toolbox" message
        $mobileToolsLabel = $this->msg('toolbox')->text(); 

        foreach ( $sidebarRest as $portlet ) {
            $id = $portlet['id'] ?? '';
            $items = $portlet['array-items'] ?? [];
            $label = $portlet['label'] ?? '';

            if ( empty( $items ) ) {
                continue;
            }

            // A. WIKIBASE -> LINKS
            if ( $id === 'p-wikibase-otherprojects' || $id === 'p-wikibase' ) {
                $mobileLinks = array_merge( $mobileLinks, $items );
            } 
            // B. TOOLBOX -> TOOLS (STRICT: Only p-tb)
            elseif ( $id === 'p-tb' ) {
                $mobileTools = array_merge( $mobileTools, $items );
                // Capture the localized label for the toolbox directly from the portlet if available
                if ( !empty($label) ) {
                    $mobileToolsLabel = $label;
                }
            } 
            // C. EVERYTHING ELSE -> DROPPED
            else {
                continue;
            }
        }

        // ---------------------------------------------------------
        // PART 5: USERNAME LABEL & CLASSES
        // ---------------------------------------------------------
        $user = $this->getSkin()->getUser();
        
        // Ensure the array exists and has a class key to append to
        if ( isset($data['data-portlets']['data-user-menu']) ) {
            $userMenu = &$data['data-portlets']['data-user-menu'];
            if ( !isset($userMenu['class']) ) { $userMenu['class'] = ''; }

            if ( $user->isNamed() ) {
                // LOGGED IN
                $userMenu['label'] = $user->getName();
                $userMenu['class'] .= ' is-loggedin'; // Append class
            } else {
                // ANONYMOUS
                $userMenu['class'] .= ' is-anon';     // Append class
            }
        }
        
        // 3. ADD LANGUAGES TO LINKS
        $langRaw = $data['data-portlets']['data-languages']['array-items'] ?? [];
        $langClean = array_filter( $langRaw, function( $item ) {
            return strpos( $item['class'] ?? '', 'wbc-editpage' ) === false;
        });
        $mobileLinks = array_merge( $mobileLinks, $langClean );

        // ASSIGN TO TEMPLATE
        $data['ridvan-mobile-menu'] = $mobileMenu;
        $data['ridvan-mobile-menu-label'] = $mobileMenuLabel;
        
        $data['ridvan-mobile-tools'] = $mobileTools;
        $data['ridvan-mobile-tools-label'] = $mobileToolsLabel;
        
        $data['ridvan-mobile-links'] = $mobileLinks;
        $data['ridvan-mobile-links-label'] = $this->msg('ridvan-mobile-links-label')->text();
        $data['ridvan-has-mobile-links'] = !empty($mobileLinks);

        return $data;
    }
}
