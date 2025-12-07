<?php

class SkinNightingale extends SkinMustache {

    public function getDefaultModules(): array {
        $modules = parent::getDefaultModules();
        $config = $this->getConfig();

        if ( $config->get( 'SearchSuggestionsReplacement' ) ) {
            $modules['scripts'][] = 'skins.nightingale.search';
        }

        return $modules;
    }

    public function getTemplateData() {
        $data = parent::getTemplateData();

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
        // We keep the 'ridvan-' keys here so we don't break existing 
        // mustache templates (ContentEdit, etc.) that you copied over.
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
        // PART 3: CLEANUP LANGUAGES
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
        // PART 4: SIDEBAR MODIFICATION
        // ---------------------------------------------------------
        if ( isset( $data['data-portlets-sidebar']['array-portlets-rest'] ) ) {
            foreach ( $data['data-portlets-sidebar']['array-portlets-rest'] as $key => &$portlet ) {
                $id = $portlet['id'] ?? '';

                // 1. INJECT SPECIAL PAGES INTO TOOLBOX (p-tb)
                if ( $id === 'p-tb' ) {
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
                
                // DELETED: The block that removed 'p-navigation'. 
                // We want to keep the main navigation menu now.
            }
            unset($portlet); 

            // -----------------------------------------------------
            // RE-ORDER THE SIDEBAR
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
                    $bucketSidebar[] = $item;
                }
            }

            $data['data-portlets-sidebar']['array-portlets-rest'] = array_merge(
                $bucketSidebar, 
                $bucketWikibase, 
                $bucketTools
            );
        }

        // ---------------------------------------------------------
        // NEW PART: COMBINE ALL PORTLETS FOR HEADER DROPDOWNS
        // ---------------------------------------------------------
        // This flattens the structure so {{#nightingale-nav-portlets}} works easily in Mustache
        $navItems = [];
        
        // 1. Add the Main Navigation (Data First)
        if ( isset($data['data-portlets-sidebar']['data-portlets-first']) ) {
            $navItems[] = $data['data-portlets-sidebar']['data-portlets-first'];
        }
        
        // 2. Add the Rest (Toolbox, etc)
        if ( isset($data['data-portlets-sidebar']['array-portlets-rest']) ) {
            $navItems = array_merge($navItems, $data['data-portlets-sidebar']['array-portlets-rest']);
        }
        
        $data['nightingale-nav-portlets'] = $navItems;


        // ---------------------------------------------------------
        // PART 5: MOBILE DATA PREPARATION
        // ---------------------------------------------------------
        // (Kept as is to support mobile menu fallback if needed)
        $navPortlet = $data['data-portlets-sidebar']['data-portlets-first'] ?? [];
        $mobileMenu = $navPortlet['array-items'] ?? [];
        $mobileMenuLabel = $navPortlet['label'] ?? $this->msg('navigation')->text();

        $sidebarRest = $data['data-portlets-sidebar']['array-portlets-rest'] ?? [];
        $mobileTools = [];
        $mobileLinks = [];
        $mobileToolsLabel = $this->msg('toolbox')->text(); 

        foreach ( $sidebarRest as $portlet ) {
            $id = $portlet['id'] ?? '';
            $items = $portlet['array-items'] ?? [];
            $label = $portlet['label'] ?? '';

            if ( empty( $items ) ) continue;

            if ( $id === 'p-wikibase-otherprojects' || $id === 'p-wikibase' ) {
                $mobileLinks = array_merge( $mobileLinks, $items );
            } 
            elseif ( $id === 'p-tb' ) {
                $mobileTools = array_merge( $mobileTools, $items );
                if ( !empty($label) ) {
                    $mobileToolsLabel = $label;
                }
            } 
        }

        $langRaw = $data['data-portlets']['data-languages']['array-items'] ?? [];
        $langClean = array_filter( $langRaw, function( $item ) {
            return strpos( $item['class'] ?? '', 'wbc-editpage' ) === false;
        });
        $mobileLinks = array_merge( $mobileLinks, $langClean );

        $data['ridvan-mobile-menu'] = $mobileMenu;
        $data['ridvan-mobile-menu-label'] = $mobileMenuLabel;
        $data['ridvan-mobile-tools'] = $mobileTools;
        $data['ridvan-mobile-tools-label'] = $mobileToolsLabel;
        $data['ridvan-mobile-links'] = $mobileLinks;
        $data['ridvan-mobile-links-label'] = $this->msg('ridvan-mobile-links-label')->text();
        $data['ridvan-has-mobile-links'] = !empty($mobileLinks);

        // ---------------------------------------------------------
        // PART 6: USER MENU & STATE
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
