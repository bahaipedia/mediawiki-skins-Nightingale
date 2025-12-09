# Skin:Nightingale

Nightingale is a modern, responsive MediaWiki skin originally developed for [Bahai.works](https://Bahai.works). It is a rewrite of the Skin:Chameleon that we used for several years, minus the need for Bootstrap and several other dependencies. Search suggestions are an adaption of code found in Skin:Citizen.

## Credits

* **Author:** [Sarah Haslip](https://bahaipedia.org/User:Sarah)
* **Search Module:** Adapted from [Skin:Citizen](https://www.mediawiki.org/wiki/Skin:Citizen) (Thanks to Alistair3149 & Octfx).

## Requirements

* MediaWiki 1.41+

## Installation

1.  Download the skin files and place them in the `skins/Nightingale` directory.
2.  Add the following line to your `LocalSettings.php`:

```php
wfLoadSkin( 'Nightingale' );
````

## Configuration
### Custom Search Suggestions

Nightingale includes a custom, fast "Typeahead" search suggestion module (czsearch) enabled by default.

## License
GPL-3.0-or-later
