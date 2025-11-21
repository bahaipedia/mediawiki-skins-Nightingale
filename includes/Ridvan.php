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
        // CUSTOM: INJECT SPECIAL PAGES INTO TOOLBOX
        // We inject this here so it appears in the Desktop sidebar
        // AND gets picked up by the Mobile Tools logic below.
        // ---------------------------------------------------------
        if ( isset( $data['data-portlets-sidebar']['array-portlets-rest'] ) ) {
            // Iterate by reference (&$portlet) to modify the actual data
            foreach ( $data['data-portlets-sidebar']['array-portlets-rest'] as &$portlet ) {
                if ( ($portlet['id'] ?? '') === 'p-tb' ) {
                    // Append the Special Pages link
                    $portlet['array-items'][] = [
                        'id' => 't-specialpages',
                        'text' => $this->msg( 'specialpages' )->text(),
                        'href' => \SpecialPage::getTitleFor( 'SpecialPages' )->getLocalURL(),
                        'class' => ''
                    ];
                    break; // Found toolbox, stop looping
                }
            }
            unset($portlet); // Clean up reference
        }

        // ---------------------------------------------------------
        // PART 3: MOBILE DATA PREPARATION (STRICT MODE)
        // ---------------------------------------------------------

        // 1. MOBILE MENU 
        // STRICT: Only the "First" Sidebar item (Navigation)
        $mobileMenu = $data['data-portlets-sidebar']['data-portlets-first']['array-items'] ?? [];

        // 2. SORT SIDEBAR "REST"
        // Note: This now contains our injected 'Special Pages' link inside p-tb
        $sidebarRest = $data['data-portlets-sidebar']['array-portlets-rest'] ?? [];
        
        $mobileTools = [];
        $mobileLinks = [];

        foreach ( $sidebarRest as $portlet ) {
            $id = $portlet['id'] ?? '';
            $items = $portlet['array-items'] ?? [];

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
            } 
            // C. EVERYTHING ELSE -> DROPPED
            // This ensures Authors, Books, etc. do not appear in Menu OR Tools.
            else {
                continue;
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
        $data['ridvan-mobile-tools'] = $mobileTools;
        $data['ridvan-mobile-links'] = $mobileLinks;

        // 4. VISIBILITY FLAG
        $data['ridvan-has-mobile-links'] = !empty($mobileLinks);

        return $data;
    }
}
