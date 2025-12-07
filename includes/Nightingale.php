<?php

class SkinNightingale extends SkinMustache {

    public function getDefaultModules(): array {
        $modules = parent::getDefaultModules();
        $modules['scripts'][] = 'skins.nightingale.search';
        return $modules;
    }

    public function getTemplateData() {
        $data = parent::getTemplateData();

        // 1. Redirect Fixer
        $data['is-redirect'] = $this->getTitle()->isRedirect();
        if ( $data['is-redirect'] ) {
            $this->getOutput()->addModules( 'skins.nightingale.redirectfixer' );
        }

        // 2. Header Buttons (Edit/Talk/Hybrid)
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

        $data['nightingale-content-edit'] = $editButton ? [ $editButton ] : [];
        $data['nightingale-content-talk'] = $talkButton ? [ $talkButton ] : [];
        $data['nightingale-content-hybrid'] = $hybridMenu;

        // 3. Language Cleanup
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

        // 4. Split Sidebar (Header vs Footer)
        $allSidebarPortlets = $data['data-portlets-sidebar']['array-portlets-rest'] ?? [];
        if ( isset($data['data-portlets-sidebar']['data-portlets-first']) ) {
            array_unshift($allSidebarPortlets, $data['data-portlets-sidebar']['data-portlets-first']);
        }

        $headerPortlets = [];
        $footerPortlets = [];

        foreach ( $allSidebarPortlets as $portlet ) {
            $id = $portlet['id'] ?? '';
            
            // FIX: Explicitly skip p-navigation so it is removed from the UI.
            // "Special Pages" is injected into p-tb below.
            if ( $id === 'p-navigation' ) {
                continue;
            }

            if ( $id === 'p-tb' || strpos($id, 'p-wikibase') !== false ) {
                // Inject SpecialPages into Toolbox
                if ( $id === 'p-tb' ) {
                     if ( !isset( $portlet['array-items'] ) ) { $portlet['array-items'] = []; }
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
                $headerPortlets[] = $portlet;
            }
        }

        $data['nightingale-header-portlets'] = $headerPortlets;
        $data['nightingale-footer-portlets'] = $footerPortlets;

        // 5. User Menu
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
