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

        // 3. Sort items
        foreach ( $allPortlets as $item ) {
            $id = $item['id'] ?? '';

            // CHECK 1: Edit Button
            // catch 'ca-edit' (standard) or 'ca-viewsource' (locked pages)
            if ( $id === 'ca-edit' || $id === 'ca-viewsource' ) {
                $editButton = $item;
            } 
            // CHECK 2: Talk Button
            // catch 'ca-talk' (main) or 'ca-nstab-talk' (sometimes used on talk pages)
            elseif ( $id === 'ca-talk' || $id === 'ca-nstab-talk' ) {
                $talkButton = $item;
            }
            // CHECK 3: Everything else -> Hybrid Menu
            else {
                $hybridMenu[] = $item;
            }
        }

        // 4. Pass data to Mustache
        // We use 'ridvan-content-edit' as a boolean check or data source
        $data['ridvan-content-edit'] = $editButton;
        $data['ridvan-content-talk'] = $talkButton;
        $data['ridvan-content-hybrid'] = $hybridMenu;

        return $data;
    }
}
