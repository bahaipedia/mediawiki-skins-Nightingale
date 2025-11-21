<?php

class SkinRidvan extends SkinMustache {

    public function getTemplateData() {
        $data = parent::getTemplateData();

        // ---------------------------------------------------------
        // PART 1: HEADER BUTTONS (EXISTING LOGIC)
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
        // PART 2: CLEANUP LANGUAGES (EXISTING LOGIC)
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
        // PART 3: MOBILE DATA PREPARATION (FIXED)
        // ---------------------------------------------------------

        // 1. MOBILE MENU (The "First" Sidebar item, usually Navigation)
        $mobileMenu = $data['data-portlets-sidebar']['data-portlets-first']['array-items'] ?? [];

        // 2. SORT SIDEBAR "REST" -> TOOLS vs LINKS
        $sidebarRest = $data['data-portlets-sidebar']['array-portlets-rest'] ?? [];
        
        $mobileTools = [];
        $mobileLinks = [];

        foreach ( $sidebarRest as $portlet ) {
            $id = $portlet['id'] ?? '';
            $items = $portlet['array-items'] ?? [];

            if ( empty( $items ) ) {
                continue;
            }

            if ( $id === 'p-wikibase-otherprojects' || $id === 'p-wikibase' ) {
                // A. Add to LINKS
                $mobileLinks = array_merge( $mobileLinks, $items );
            } elseif ( $id === 'p-navigation' ) {
                // B. Skip Navigation (Already in Mobile Menu) to avoid duplicates
                continue;
            } else {
                // C. Everything else (Toolbox p-tb, Print/Export, etc) -> TOOLS
                $mobileTools = array_merge( $mobileTools, $items );
            }
        }

        // 3. ADD LANGUAGES TO LINKS
        // We grab the *cleaned* language list if available, or raw if not filtered yet
        $langRaw = $data['data-portlets']['data-languages']['array-items'] ?? [];
        
        // Re-apply the wbc-editpage filter just in case to be safe
        $langClean = array_filter( $langRaw, function( $item ) {
            return strpos( $item['class'] ?? '', 'wbc-editpage' ) === false;
        });

        $mobileLinks = array_merge( $mobileLinks, $langClean );

        // ASSIGN TO TEMPLATE
        $data['ridvan-mobile-menu'] = $mobileMenu;
        $data['ridvan-mobile-tools'] = $mobileTools;
        $data['ridvan-mobile-links'] = $mobileLinks;

        // 4. VISIBILITY FLAGS (For Conditional Rendering)
        // We add these booleans so Mustache can check "if exists" without iterating the array
        $data['ridvan-has-mobile-links'] = !empty($mobileLinks);

        return $data;
    }
}
