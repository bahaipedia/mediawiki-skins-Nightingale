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
        foreach ( $allPortlets as $key => $item ) {
            // Handle Edit (or View Source if locked)
            if ( $key === 'ca-edit' || $key === 'ca-viewsource' ) {
                $editButton = $item;
            } 
            // Handle Talk
            elseif ( $key === 'ca-talk' ) {
                $talkButton = $item;
            } 
            // Handle everything else (History, Move, Delete, Read, etc.)
            else {
                $hybridMenu[] = $item;
            }
        }

        // 4. Pass distinct data to Mustache
        $data['ridvan-content-edit'] = $editButton;
        $data['ridvan-content-talk'] = $talkButton;
        $data['ridvan-content-hybrid'] = $hybridMenu;

        return $data;
    }
}
