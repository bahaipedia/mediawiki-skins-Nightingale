<?php

class SkinRidvan extends SkinMustache {

    public function getTemplateData() {
        $data = parent::getTemplateData();

        // 1. Merge Namespaces (Page/Talk), Views (Edit/History), and Actions (Move/Delete)
        // We were missing 'data-namespaces' before!
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
        // We wrap in [] because the mustache template iterates over them
        $data['ridvan-content-edit'] = $editButton ? [ $editButton ] : [];
        $data['ridvan-content-talk'] = $talkButton ? [ $talkButton ] : [];
        $data['ridvan-content-hybrid'] = $hybridMenu;

        // --- DEBUGGING CODE START ---
        echo "<pre style='background:white; color:black; z-index:9999; position:relative;'>";
        print_r( $data['ridvan-content-edit'] );
        echo "</pre>";
        die(); 
        // --- DEBUGGING CODE END ---

        return $data;
    }
}
