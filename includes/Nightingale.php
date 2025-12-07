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
        // PART 2: HEADER BUTTONS (RIGHT SIDE)
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
            if ( $id === 'ca-view' ) { continue; }
            
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
        // PART 4: SPLIT SIDEBAR (HEADER vs FOOTER)
        // ---------------------------------------------------------
        
        // 1. Gather all potential sidebar portlets into one flat array
        $allSidebarPortlets = $data['data-portlets-sidebar']['array-portlets-rest'] ?? [];
        
        // Include the "First" portlet (usually Navigation) if it exists
        if ( isset($data['data-portlets-sidebar']['data-portlets-first']) ) {
            array_unshift($allSidebarPortlets, $data['data-portlets-sidebar']['data-portlets-first']);
        }

        $headerPortlets = [];
        $footerPortlets = [];

        foreach ( $allSidebarPortlets as $portlet ) {
            $id = $portlet['id'] ?? '';
            
            // Logic: Tools and Wikibase go to Footer. Everything else stays in Header.
            if ( $id === 'p-tb' || strpos($id, 'p-wikibase') !== false ) {
                
                // Inject Special Pages into p-tb if missing (standard MW behavior override)
                if ( $id === 'p-tb' ) {
                     if ( !isset( $portlet['array-items'] ) ) { $portlet['array-items'] = []; }
                     // Check if it already exists to avoid duplicates
                     $hasSpecial = false;
                     foreach($portlet['array-items'] as $item) {
                         if (($item['id'] ?? '') === 't-specialpages') { $hasSpecial = true; break; }
                     }
                     if (!$hasSpecial) {
                        $portlet['array-items'][] = [
                            'id' => 't-specialpages',
                            'class' => 'mw-list-item',
                            'array-links' => [[
                                'text' => $this->msg( 'specialpages' )->text(),
                                'array-attributes' => [[
                                    'key' => 'href',
                                    'value' => \SpecialPage::getTitleFor( 'SpecialPages' )->getLocalURL()
                                ]]
                            ]]
                        ];
                     }
                }
                $footerPortlets[] = $portlet;
            } else {
                // This is a standard Sidebar menu (Project, Content, Help, etc.)
                $headerPortlets[] = $portlet;
            }
        }

        $data['nightingale-header-portlets'] = $headerPortlets;
        $data['nightingale-footer-portlets'] = $footerPortlets;

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
