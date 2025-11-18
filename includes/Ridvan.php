<?php

class SkinRidvan extends SkinMustache {

    public function getTemplateData() {
        $data = parent::getTemplateData();

        // 1. Merge Views and Actions
        $allPortlets = array_merge(
            $data['data-portlets']['data-views']['array-items'] ?? [],
            $data['data-portlets']['data-actions']['array-items'] ?? []
        );

        // 2. Initialize buckets
        $editButton = null;
        $talkButton = null;
        $hybridMenu = [];

        // 3. Sort items by checking the 'id' property inside the item
        foreach ( $allPortlets as $item ) {
            // Get the ID safely
            $id = $item['id'] ?? '';

            // --- LOGIC START ---
            
            // 1. Find the Edit Button (or View Source)
            if ( $id === 'ca-edit' || $id === 'ca-viewsource' || $id === 'ca-view' || $id === 'ca-nstab-main' ) {
                $editButton = $item;
            } 
            // 2. Find the Talk Button
            elseif ( $id === 'ca-talk' ) {
                $talkButton = $item;
            }
            // 3. Everything else goes to Hybrid
            else {
                $hybridMenu[] = $item;
            }
        }

        // 4. Pass distinct data to Mustache
        // Note: We use 'ridvan-content-edit' keys in the mustache files
        $data['ridvan-content-edit'] = $editButton ? [ $editButton ] : []; 
        // ^ We wrap in array [] because mustache expects a list or true/false
        
        $data['ridvan-content-talk'] = $talkButton ? [ $talkButton ] : [];
        
        $data['ridvan-content-hybrid'] = $hybridMenu;

        return $data;
    }
}
