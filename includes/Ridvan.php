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
        // PART 3: MOBILE DATA & DEBUGGING
        // ---------------------------------------------------------
        
        // 1. MOBILE MENU (Navigation)
        $mobileMenu = $data['data-portlets-sidebar']['data-portlets-first']['array-items'] ?? [];

        // 2. SORT SIDEBAR "REST" & FIND TOOLBOX LOCATION
        $sidebarRest = $data['data-portlets-sidebar']['array-portlets-rest'] ?? [];
        
        $mobileTools = [];
        $mobileLinks = [];
        
        // DEBUG ARRAYS
        $debugInfo = [
            'Where is p-tb?' => 'Not Found',
            'Sidebar_Rest_IDs' => [],
            'Main_Portlets_Has_p-tb' => isset($data['data-portlets']['p-tb']) ? 'YES' : 'NO',
        ];

        // Check main portlets first
        if (isset($data['data-portlets']['p-tb'])) {
            $debugInfo['Where is p-tb?'] = 'In data-portlets[p-tb]';
        }

        foreach ( $sidebarRest as $portlet ) {
            $id = $portlet['id'] ?? 'NO-ID';
            $debugInfo['Sidebar_Rest_IDs'][] = $id;
            $items = $portlet['array-items'] ?? [];

            if ( $id === 'p-tb' ) {
                $debugInfo['Where is p-tb?'] = 'In Sidebar Rest Array';
                $mobileTools = array_merge( $mobileTools, $items );
            } 
            elseif ( $id === 'p-wikibase-otherprojects' || $id === 'p-wikibase' ) {
                $mobileLinks = array_merge( $mobileLinks, $items );
            } 
            else {
                // Everything else ignored in strict mode
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
        $data['ridvan-has-mobile-links'] = !empty($mobileLinks);

        // --- RENDER DEBUG BOX ---
        $debugHtml = '<div style="border: 5px solid red; padding: 20px; background: white; color: black; font-family: monospace; position: relative; z-index: 10000; clear: both;">';
        $debugHtml .= '<h3>DEBUG: TOOLBOX LOCATION</h3>';
        $debugHtml .= '<pre>' . print_r($debugInfo, true) . '</pre>';
        $debugHtml .= '</div>';
        
        $data['html-after-content'] .= $debugHtml;

        return $data;
    }
}
