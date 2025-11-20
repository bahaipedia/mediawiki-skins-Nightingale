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
        // PART 2: SIDEBAR CUSTOMIZATION
        // ---------------------------------------------------------

        $specialPageItem = null;

        // TASK 1: FIND & REMOVE "SPECIAL PAGES" FROM NAVIGATION
        // 'data-portlets-first' is usually the Main Navigation block
        if ( isset( $data['data-portlets-sidebar']['data-portlets-first']['array-items'] ) ) {
            $navItems = &$data['data-portlets-sidebar']['data-portlets-first']['array-items'];
            
            foreach ( $navItems as $key => $item ) {
                if ( ($item['id'] ?? '') === 'n-specialpages' ) {
                    // 1. Save it
                    $specialPageItem = $item;
                    
                    // 2. Remove it
                    unset( $navItems[$key] );
                    
                    // 3. Re-index array
                    $navItems = array_values( $navItems );
                    break;
                }
            }
        }

        // TASK 2: ADD "SPECIAL PAGES" TO TOOLS
        // 'array-portlets-rest' contains everything else (Tools, Other Projects, etc.)
        if ( $specialPageItem && isset( $data['data-portlets-sidebar']['array-portlets-rest'] ) ) {
            $restPortlets = &$data['data-portlets-sidebar']['array-portlets-rest'];
            
            // Loop through the portlets to find "Tools" (p-tb)
            foreach ( $restPortlets as &$portlet ) {
                if ( ($portlet['id'] ?? '') === 'p-tb' ) {
                    // Found Tools! Add the item to its list
                    if ( !isset( $portlet['array-items'] ) ) {
                        $portlet['array-items'] = [];
                    }
                    $portlet['array-items'][] = $specialPageItem;
                    break;
                }
            }
        }

        // TASK 3: HIDE LANGUAGES IF EMPTY
        if ( isset( $data['data-portlets']['data-languages']['array-items'] ) ) {
            $langItems = $data['data-portlets']['data-languages']['array-items'];
            
            $realLanguages = array_filter( $langItems, function( $item ) {
                $class = $item['class'] ?? '';
                return strpos( $class, 'wbc-editpage' ) === false;
            });

            if ( empty( $realLanguages ) ) {
                unset( $data['data-portlets']['data-languages'] );
            }
        } else {
            unset( $data['data-portlets']['data-languages'] );
        }

        return $data;
    }
}
