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
        // We need to merge "First" (Navigation) and "Rest" (everything else)
        // so we can loop through them all and categorize them.
        
        $sidebarFirst = $data['data-portlets-sidebar']['data-portlets-first'] ?? null;
        $sidebarRest = $data['data-portlets-sidebar']['array-portlets-rest'] ?? [];
        
        // Start with the first block if it exists (usually "Navigation")
        $allSidebar = [];
        if ( $sidebarFirst ) {
            $allSidebar[] = $sidebarFirst;
        }
        $allSidebar = array_merge( $allSidebar, $sidebarRest );

        // Buckets
        $sidebarMenus = []; // Valid sidebar menus (Navigation, Community, etc)
        $mobileTools = [];  // Toolbox items
        $mobileLinks = [];  // Wikibase, Interwiki, etc.
        
        $mobileToolsLabel = $this->msg('toolbox')->text();

        foreach ( $allSidebar as $portlet ) {
            $id = $portlet['id'] ?? '';
            $items = $portlet['array-items'] ?? [];
            $label = $portlet['label'] ?? '';

            if ( empty( $items ) ) {
                continue;
            }

            // A. WIKIBASE & LANG -> LINKS
            if ( $id === 'p-wikibase-otherprojects' || $id === 'p-wikibase' ) {
                $mobileLinks = array_merge( $mobileLinks, $items );
            }
            // B. TOOLBOX -> TOOLS
            elseif ( $id === 'p-tb' ) {
                // Inject Special Pages link manually if needed, or rely on core
                $mobileTools = array_merge( $mobileTools, $items );
                if ( !empty($label) ) {
                    $mobileToolsLabel = $label;
                }
            }
            // C. EVERYTHING ELSE -> SIDEBAR DROPDOWNS
            // (e.g. p-navigation, p-community, or custom blocks)
            else {
                // Ensure every menu has a valid ID for the checkbox hack
                if ( empty($id) ) {
                    $id = 'p-' . Sanitizer::escapeIdForAttribute( $label );
                }
                $portlet['html-id'] = $id; // Pass ID to template
                $sidebarMenus[] = $portlet;
            }
        }

        // Add Language links to "Links" bucket
        $langRaw = $data['data-portlets']['data-languages']['array-items'] ?? [];
        $langClean = array_filter( $langRaw, function( $item ) {
            return strpos( $item['class'] ?? '', 'wbc-editpage' ) === false;
        });
        $mobileLinks = array_merge( $mobileLinks, $langClean );

        // ---------------------------------------------------------
        // PART 4: ASSIGN TO TEMPLATE
        // ---------------------------------------------------------
        
        // 1. Sidebar Menus (The "Main" menus)
        $data['nightingale-sidebar-menus'] = $sidebarMenus;

        // 2. Tools (Mobile Only)
        $data['nightingale-mobile-tools'] = $mobileTools;
        $data['nightingale-mobile-tools-label'] = $mobileToolsLabel;

        // 3. Links (Mobile Only)
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
