const SEARCH_LOADING_CLASS = 'citizen-loading';

// Config object
const config = require( './config.json' );

// REMOVED: searchPresults and searchHistory imports
const searchClient = require( './searchClient.js' )( config );
const searchResults = require( './searchResults.js' )();
const searchQuery = require( './searchQuery.js' )();

const templateTypeaheadElement = require( './templates/TypeaheadElement.mustache' );
const templateTypeaheadPlaceholder = require( './templates/TypeaheadPlaceholder.mustache' );
const templateTypeaheadList = require( './templates/TypeaheadList.mustache' );
const templateTypeaheadListItem = require( './templates/TypeaheadListItem.mustache' );

const compiledTemplates = {};

const typeahead = {
	/** @type {HTMLElement | undefined} */
	element: undefined,
	form: {
		/** @type {HTMLFormElement | undefined} */
		element: undefined,
		isLoading: false,
		init: function ( formEl ) {
			this.element = formEl;
			this.element.setAttribute( 'aria-owns', typeahead.element.id );
		},
		setLoadingState: function ( state ) {
			this.element.classList.toggle( SEARCH_LOADING_CLASS, state );
			this.isLoading = state;
		}
	},
	input: {
		/** @type {HTMLInputElement | undefined} */
		element: undefined,
		isComposing: false,
		init: function ( inputEl ) {
			this.element = inputEl;

			// Standard Input attributes
			this.element.classList.add( 'citizen-typeahead-input' );
			this.element.setAttribute( 'aria-autocomplete', 'list' );
			this.element.setAttribute( 'aria-controls', typeahead.element.id );

			this.element.addEventListener( 'focus', this.onFocus );
			
			// Auto-focus if visible and not disabled
			const isVisible = this.element.offsetWidth > 0 || this.element.offsetHeight > 0;
			if ( isVisible && !this.element.disabled && !this.element.readOnly ) {
				requestAnimationFrame( () => { this.element.focus(); } );
			}
		},
		onCompositionstart: function () {
			typeahead.input.element.addEventListener( 'compositionend', typeahead.input.onCompositionend );
			typeahead.input.isComposing = true;
		},
		onCompositionend: function () {
			typeahead.input.isComposing = false;
			typeahead.input.element.dispatchEvent( new Event( 'input' ) );
		},
		onFocus: function () {
			const formRect = typeahead.form.element.getBoundingClientRect();
			typeahead.element.style.setProperty( '--mobile-offset-left', -formRect.left + 'px' );
			typeahead.afterSearchQueryInput();
			typeahead.element.addEventListener( 'click', typeahead.onClick );
			typeahead.input.element.addEventListener( 'keydown', typeahead.input.onKeydown );
			typeahead.input.element.addEventListener( 'input', typeahead.input.onInput );
			typeahead.input.element.addEventListener( 'blur', typeahead.onBlur );
		},
		onInput: function () {
			const typeaheadInputElement = typeahead.input.element;
			typeaheadInputElement.addEventListener( 'compositionstart', typeahead.input.onCompositionstart );
			if ( typeahead.input.isComposing !== true ) {
				mw.util.debounce( typeahead.afterSearchQueryInput(), 100 );
			}
		},
		onKeydown: function ( event ) {
			if ( event.defaultPrevented ) return;

			/* Moves the active item up and down */
			if ( event.key === 'ArrowDown' || event.key === 'ArrowUp' ) {
				event.preventDefault();
				if ( event.key === 'ArrowDown' ) {
					typeahead.items.increment( 1 );
				} else {
					typeahead.items.increment( -1 );
				}
				typeahead.items.toggle( typeahead.items.elements[ typeahead.items.index ] );
			}

			/* Enter to click on the active item */
			const link = typeahead.items.elements[ typeahead.items.index ];
			if ( event.key === 'Enter' && link && link instanceof HTMLAnchorElement ) {
				event.preventDefault();
				link.click();
			}
		}
	},
	items: {
		/** @type {NodeList | undefined} */
		elements: undefined,
		index: -1,
		max: 0,
		setMax: function ( x ) { this.max = x; },
		increment: function ( i ) {
			this.index += i;
			if ( this.index < 0 ) this.setIndex( this.max - 1 );
			if ( this.index === this.max ) this.setIndex( 0 );
			return this.index;
		},
		setIndex: function ( i ) {
			if ( i <= this.max - 1 ) this.index = i;
			return this.index;
		},
		clearIndex: function () { this.setIndex( -1 ); },
		toggle: function ( item ) {
			this.elements.forEach( ( element, index ) => {
				if ( item !== element ) {
					delete element.dataset.mwTypeaheadSelected;
				} else {
					if ( item.dataset.mwTypeaheadSelected ) {
						delete item.dataset.mwTypeaheadSelected;
					} else {
						item.dataset.mwTypeaheadSelected = '';
						typeahead.input.element.setAttribute( 'aria-activedescendant', item.id );
						this.setIndex( index );
					}
				}
			} );
		},
		bindMouseHoverEvent: function () {
			this.elements.forEach( ( element ) => {
				element.addEventListener( 'mouseenter', ( event ) => { this.toggle( event.currentTarget ); } );
				element.addEventListener( 'mouseleave', ( event ) => { this.toggle( event.currentTarget ); } );
			} );
		},
		set: function () {
			const typeaheadElement = typeahead.element;
			this.elements = typeaheadElement.querySelectorAll( '.citizen-typeahead-list-item-link' );
			this.bindMouseHoverEvent();
			this.setMax( this.elements.length );
		}
	},
	onBlur: function ( event ) {
		const typeaheadElement = typeahead.element;
		if ( !typeaheadElement.contains( event.relatedTarget ) ) {
			setTimeout( () => {
				typeahead.input.element.setAttribute( 'aria-activedescendant', '' );
				typeaheadElement.removeEventListener( 'click', typeahead.onClick );
				typeahead.input.element.removeEventListener( 'keydown', typeahead.input.onKeydown );
				// We keep input listeners
			}, 10 );
		}
	},
	onClick: function ( event ) {
		// Only handle clicks, but REMOVED history saving logic
		if ( typeahead.element.contains( event.target ) ) {
			const link = event.target.closest( '.citizen-typeahead-list-item-link' );
			if ( !link ) return;
			// Normal link behavior will follow
		}
	},
	updateSearchQuery: function () {
		const currentQuery = typeahead.input.element.value;
		if ( searchQuery.value === currentQuery ) {
			return Promise.reject( `Search query has not changed.` );
		}
		searchQuery.setValue( currentQuery );
		return Promise.resolve( `Search query updated.` );
	},
	afterSearchQueryInput: function () {
		typeahead.updateSearchQuery().then( updateTypeaheadItems ).catch( () => {} );
	},
	init: function ( formEl, inputEl ) {
		this.mustacheCompiler = mw.template.getCompiler( 'mustache' );
		Object.assign( compiledTemplates, {
			TypeaheadElement: this.mustacheCompiler.compile( templateTypeaheadElement ),
			TypeaheadPlaceholder: this.mustacheCompiler.compile( templateTypeaheadPlaceholder ),
			TypeaheadList: this.mustacheCompiler.compile( templateTypeaheadList ),
			TypeaheadListItem: this.mustacheCompiler.compile( templateTypeaheadListItem )
		} );

		const data = {
			'data-placeholder': { hidden: true },
			'array-lists': [
				{ type: 'page', hidden: true, keyboardNavigation: true },
				{ type: 'action', hidden: true }
			]
		};
		const partials = {
			TypeaheadPlaceholder: compiledTemplates.TypeaheadPlaceholder,
			TypeaheadList: compiledTemplates.TypeaheadList
		};
		this.element = compiledTemplates.TypeaheadElement.render( data, partials ).get()[ 0 ];

		formEl.after( this.element );
		this.form.init( formEl );
		this.input.init( inputEl );

		// REMOVED: searchHistory.init()
		searchResults.init();
		
		// REMOVED: searchPresults.render()
		typeahead.items.set();

		if ( this.input.element.value.length > 0 ) {
			this.afterSearchQueryInput();
		}
	}
};

async function getSuggestions() {
	const renderSuggestions = ( results ) => {
		const groupEl = document.getElementById( 'citizen-typeahead-group-page' );
		const listEl = document.getElementById( 'citizen-typeahead-list-page' );
		
		// We don't use placeholder anymore
		if ( results.length > 0 ) {
			listEl.outerHTML = searchResults.getResultsHTML(
				results,
				searchQuery.valueHtml,
				compiledTemplates
			);
			groupEl.hidden = false;
		} else {
			listEl.innerHTML = '';
			groupEl.hidden = true;
		}

		typeahead.form.setLoadingState( false );
		typeahead.items.set();
	};

	typeahead.form.setLoadingState( true );
	const { abort, fetch } = searchResults.fetch( searchQuery.value, searchClient.active.client );
	const inputEventListener = () => {
		abort();
		typeahead.input.element.removeEventListener( 'input', inputEventListener );
	};
	typeahead.input.element.addEventListener( 'input', inputEventListener, { once: true } );

	try {
		const response = await fetch;
		renderSuggestions( response.results );
	} catch ( error ) {
		typeahead.form.setLoadingState( false );
		if ( error.name !== 'AbortError' ) throw error;
	}
}

function updateTypeaheadItems() {
	typeahead.input.element.setAttribute( 'aria-activedescendant', '' );
	typeahead.items.clearIndex();

	if ( searchQuery.isValid ) {
		// REMOVED: searchPresults.clear()
		searchResults.render( searchQuery, compiledTemplates );
		getSuggestions();
	} else {
		searchResults.clear();
		// REMOVED: searchPresults.render() - If invalid (empty), just clear results
	}
	typeahead.items.set();
}

function initTypeahead( formEl, inputEl ) {
	typeahead.init( formEl, inputEl );
}

module.exports = {
	init: initTypeahead
};
