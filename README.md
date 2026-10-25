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

### Footer Customization

Nightingale's multi-column directory footer is configured using on-wiki system messages in the `MediaWiki:` namespace:

* **`MediaWiki:Footer-about`** — Holds the site description blurb displayed directly below the site title in the left column of the footer. Supports standard wikitext.
* **`MediaWiki:Footer-menu`** — Defines the navigation columns and links in the upper footer. Use `** Heading` to start a new column and `* Target|Label` (or `* https://example.com|Label`) for links under that column:
  ```wikitext
  ** Explore
  * Main_Page|Home
  * Special:Random|Random page

  ** Project
  * Project:About|About
  * Help:Contents|Help
  ```
* **`MediaWiki:Aboutsite`** *(Optional)* — If you include an "About" link inside `MediaWiki:Footer-menu`, you can set `MediaWiki:Aboutsite` to `-` so that "About" does not appear a second time in the bottom `#footer-places` row.

## License
GPL-3.0-or-later
