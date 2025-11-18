<?php

class SkinRidvan extends SkinMustache {

    public function getTemplateData() {
        // 1. Get the default data from Core
        $data = parent::getTemplateData();

        // 2. Your custom logic goes here!
        // (This is where you will add the sorting/icon logic we discussed earlier)
        $data['my-custom-variable'] = 'Hello World';

        return $data;
    }
}
