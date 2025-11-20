<?php

class SkinRidvan extends SkinMustache {

    public function getTemplateData() {
        $data = parent::getTemplateData();

        // ---------------------------------------------------------
        // PART 1: HEADER BUTTONS (EDIT, TALK, HYBRID MENU)
        // ---------------------------------------------------------

        // 1. Merge Namespaces (Page/Talk), Views (Edit/History), and Actions (Move/Delete)
        $allPortlets = array_merge(
            $data['data-portlets']['data-namespaces']['array-items'] ?? [],
            $data['data-portlets']['data-views']['array-items'] ?? [],
            $data['data-portlets']['data-actions']['array-items'] ?? []
        );

        // 2. Initialize buckets
        $editButton = null;
        $talkButton = null;
        $hybridMenu = [];

        // 3. Sort items
        foreach ( $allPortlets as $item ) {
            $id = $item['id'] ?? '';

            // CHECK 1: Edit Button
            if ( $id === 'ca-edit' || $id === 'ca-viewsource' ) {
                $editButton = $item;
            } 
            // CHECK 2: Talk Button
            elseif ( $id === 'ca-talk' || $id === 'ca-nstab-talk' ) {
                $talkButton = $item;
            }
            // CHECK 3: Everything else -> Hybrid Menu
            else {
                $hybridMenu[] = $item;
            }
        }

        // 4. Pass data to Mustache
        $data['ridvan-content-edit'] = $editButton ? [ $editButton ] : [];
        $data['ridvan-content-talk'] = $talkButton ? [ $talkButton ] : [];
        $data['ridvan-content-hybrid'] = $hybridMenu;


        // ---------------------------------------------------------
        // PART 2: SIDEBAR CUSTOMIZATION
        // ---------------------------------------------------------

        // TASK 1: MOVE "SPECIAL PAGES" FROM NAVIGATION TO TOOLS
        if ( isset( $data['data-portlets']['data-navigation']['array-items'] ) ) {
            // Get reference to navigation items
            $navItems = &$data['data-portlets']['data-navigation']['array-items'];
            
            foreach ( $navItems as $key => $item ) {
                if ( ($item['id'] ?? '') === 'n-specialpages' ) {
                    
                    // Ensure Tools ('data-tb') exists
                    if ( !isset( $data['data-portlets']['data-tb']['array-items'] ) ) {
                        $data['data-portlets']['data-tb']['array-items'] = [];
                    }
                    
                    // Add to Tools
                    $data['data-portlets']['data-tb']['array-items'][] = $item;

                    // Remove from Navigation
                    unset( $navItems[$key] );
                    
                    // Re-index Navigation array so there are no gaps
                    $navItems = array_values( $navItems );
                    
                    break; // Found it, stop looping
                }
            }
        }

        // TASK 2: HIDE LANGUAGES IF EMPTY OR ONLY "ADD LINKS"
        if ( isset( $data['data-portlets']['data-languages']['array-items'] ) ) {
            $langItems = $data['data-portlets']['data-languages']['array-items'];
            
            // Filter: Keep items that DO NOT have the 'wbc-editpage' class (Wikibase "Add links")
            $realLanguages = array_filter( $langItems, function( $item ) {
                $class = $item['class'] ?? '';
                return strpos( $class, 'wbc-editpage' ) === false;
            });

            // If no real languages are left, delete the whole language block
            if ( empty( $realLanguages ) ) {
                unset( $data['data-portlets']['data-languages'] );
            }
        } else {
            // If the array doesn't exist at all, ensure the key is unset
            unset( $data['data-portlets']['data-languages'] );
        }

        return $data;
    }
}
