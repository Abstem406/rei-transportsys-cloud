<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let items: any[] = [];
  export let value: string | undefined = undefined; // The currently selected item's ID
  export let labelField: string; // The field to display as the primary label (e.g., 'name')
  export let subLabelField: string | undefined = undefined; // Optional: A secondary field to display (e.g., 'cedula')
  export let valueField: string; // The field representing the unique ID of an item (e.g., '_id')
  export let placeholder: string = 'Buscar...';
  export let searchPlaceholder: string = 'Escribe para buscar...';
  export let noResultsText: string = 'No se encontraron resultados.';
  export let required: boolean = false;

  let searchTerm = ''; // The actual text typed by the user, used for filtering
  let displayValue = ''; // What is shown in the input field (can be user input or a suggested/selected label)
  let showSuggestions = false; // Controls visibility of the suggestion dropdown
  let internalValueUpdate = false; // Flag to prevent reactive block from firing on internal updates

  const dispatch = createEventDispatcher();

  // Reactive: When 'value' changes (selected item), update 'displayValue' and 'searchTerm'
  // When items change, re-evaluate displayValue if a value is already set.
  $: if (value !== undefined && value !== null && value !== '' && items.length > 0) {
    if (!internalValueUpdate) {
      const selectedItem = items.find(item => item[valueField] === value);
      if (selectedItem) {
        displayValue = selectedItem[labelField];
        searchTerm = selectedItem[labelField]; // Keep searchTerm in sync with the selected item's label
        console.log('DEBUG (Reactive Block): Value set, displayValue/searchTerm updated to selected item:', { value, displayValue, searchTerm });
      } else {
        // If value is set but item not found (e.g., deleted or not yet loaded in items),
        // clear display and search term.
        console.log('DEBUG (Reactive Block): Value set but item not found, clearing:', { value });
        displayValue = '';
        searchTerm = '';
        value = undefined; // Also clear the value if the item is no longer found in items
      }
    } else {
      internalValueUpdate = false; // Reset the flag
      console.log('DEBUG (Reactive Block): internalValueUpdate prevented processing. internalValueUpdate reset.');
    }
  } else if ((value === undefined || value === null || value === '') && !internalValueUpdate) {
    // If no value is selected, ensure displayValue and searchTerm reflect current user input or are empty.
    // This prevents the reactive block from clearing user input when no item is selected.
    if (searchTerm === '') {
        displayValue = '';
        console.log('DEBUG (Reactive Block): No value, searchTerm empty. displayValue cleared.');
    } else {
        displayValue = searchTerm; // If user has typed, display their input
        console.log('DEBUG (Reactive Block): No value, searchTerm present. displayValue set to searchTerm.');
    }
  }

  // Filtered items for the dropdown based on searchTerm
  $: filteredItems = items.filter(item => {
    const primaryMatch = item[labelField]?.toLowerCase().includes(searchTerm.toLowerCase());
    const subLabelMatch = subLabelField ? item[subLabelField]?.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    return primaryMatch || subLabelMatch;
  });

  // When user types in the search input
  function handleInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    searchTerm = inputElement.value; // Store what the user actually typed
    displayValue = inputElement.value; // Initially, display exactly what user typed

    // Only clear value if the typed search term no longer matches the current selection
    if (value) {
      const selectedItem = items.find(item => item[valueField] === value);
      if (selectedItem && selectedItem[labelField]?.toLowerCase() !== searchTerm.toLowerCase()) {
        internalValueUpdate = true; // Set flag before clearing value
        value = undefined; // Deselect if user types over a selected item's label
      }
    } else {
      value = undefined; // Ensure value is undefined if no item is selected
    }

    showSuggestions = true; // Always show suggestions when typing

    // Autocomplete suggestion logic for the input field itself
    if (searchTerm.length > 0) {
      const bestMatch = filteredItems.find(item =>
        item[labelField]?.toLowerCase().startsWith(searchTerm.toLowerCase())
      );
      if (bestMatch && searchTerm.toLowerCase() !== bestMatch[labelField]?.toLowerCase()) {
        // If there's a best match that starts with user input and isn't identical,
        // update displayValue to the full best match to show the suggestion.
        // Note: Direct text selection highlight is not easily achievable with basic bind:value.
        displayValue = bestMatch[labelField];
      }
    }

    dispatch('search', searchTerm); // Dispatch search event based on actual user input
  }

  // When an item is selected from the suggestion list
  function handleSelectSuggestion(item: any) {
    internalValueUpdate = true; // Set flag to prevent reactive block from processing this change
    value = item[valueField]; // Set the selected value
    displayValue = item[labelField]; // Update input to show selected item's label
    searchTerm = item[labelField]; // Sync searchTerm
    showSuggestions = false; // Hide suggestions
    console.log('DEBUG (handleSelectSuggestion): Item selected. Value, displayValue, searchTerm set:', { value, displayValue, searchTerm });
    dispatch('change', value); // Dispatch change event
  }

  // When the search input gains focus
  function handleFocus() {
    showSuggestions = true;
    console.log('DEBUG (handleFocus): Input focused. Current state:', { value, displayValue, searchTerm });
    // If a value is already selected, put its label into searchTerm for filtering it.
    if (value) {
      const selectedItem = items.find(item => item[valueField] === value);
      if (selectedItem) {
        // Ensure displayValue and searchTerm reflect the full label of the selected item on focus
        searchTerm = selectedItem[labelField];
        displayValue = selectedItem[labelField];
      } else {
        // If value is set but item not found, clear them on focus
        displayValue = '';
        searchTerm = '';
        value = undefined; // Clear value if associated item is missing
      }
    }
  }

  // When the search input loses focus
  function handleBlur() {
    console.log('DEBUG (handleBlur): Input blurring. Current state before timeout:', { value, displayValue, searchTerm });
    // Delay hiding suggestions to allow click on suggestion to register
    setTimeout(() => {
      showSuggestions = false;
      console.log('DEBUG (handleBlur - Timeout): After timeout. Current state:', { value, displayValue, searchTerm });
      // If there's a valid selected item (value is set), ensure the input displays its full label.
      if (value) {
        const selectedItem = items.find(item => item[valueField] === value);
        if (selectedItem) {
          displayValue = selectedItem[labelField];
          searchTerm = selectedItem[labelField]; // Ensure searchTerm is also synced for consistent state
        } else {
          // Edge case: value is set but item not found, clear.
          displayValue = '';
          searchTerm = '';
          value = undefined; // Clear value if associated item is missing
        }
      }
      // If no item is selected AND searchTerm doesn't match any item, clear both displayValue and searchTerm on blur.
      // If searchTerm matches an item's label, try to select it.
      else {
        const matchedItem = items.find(item => item[labelField]?.toLowerCase() === searchTerm.toLowerCase());
        if (matchedItem) {
          internalValueUpdate = true; // Set flag
          value = matchedItem[valueField];
          displayValue = matchedItem[labelField];
          searchTerm = matchedItem[labelField];
          dispatch('change', value);
        } else {
          displayValue = '';
          searchTerm = '';
          console.log('DEBUG (handleBlur - Timeout): No matched item, clearing displayValue/searchTerm.');
        }
      }
    }, 100); // Small delay
  }
</script>

<div class="searchable-select-container">
  <div class="form-group">
    <label for="search-input"><slot name="search-label">Buscar:</slot></label>
    <input
      type="text"
      id="search-input"
      placeholder="{searchPlaceholder}"
      bind:value={displayValue}
      on:input={handleInput}
      on:focus={handleFocus}
      on:blur={handleBlur}
      autocomplete="off"
      aria-autocomplete="list"
      aria-controls="suggestions-list"
      aria-haspopup="true"
      role="combobox"
    />
    
    {#if showSuggestions && filteredItems.length > 0}
      <div class="suggestions-dropdown" id="suggestions-list" role="listbox">
        {#each filteredItems as item (item[valueField])}
          <div
            class="suggestion-item"
            on:mousedown|preventDefault={() => handleSelectSuggestion(item)}
            role="option"
            aria-selected={value === item[valueField]}
          >
            {item[labelField]} {#if subLabelField}({item[subLabelField]}){/if}
          </div>
        {/each}
      </div>
    {:else if showSuggestions && searchTerm.length > 0 && filteredItems.length === 0}
      <div class="suggestions-dropdown no-results" id="suggestions-list" role="listbox">
        <div class="suggestion-item disabled">{noResultsText}</div>
      </div>
    {:else if showSuggestions && !searchTerm && items.length === 0}
        <div class="suggestions-dropdown no-results" id="suggestions-list" role="listbox">
            <div class="suggestion-item disabled">Cargando o sin items disponibles</div>
        </div>
    {/if}
  </div>
</div>

<style>
  .searchable-select-container {
    position: relative; /* For positioning the dropdown */
  }

  .form-group {
    margin-bottom: 0;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--gray-700);
    font-weight: 500;
  }

  .form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--gray-300);
    border-radius: 0.5rem;
    font-size: 1rem;
    color: var(--gray-900);
    background-color: var(--white);
    box-sizing: border-box;
  }

  .form-group input:focus {
    border-color: var(--accent-blue);
    outline: none;
    box-shadow: 0 0 0 2px rgba(66, 165, 245, 0.2);
  }

  .suggestions-dropdown {
    position: absolute;
    width: 100%;
    max-height: 200px;
    overflow-y: auto;
    background-color: var(--white);
    border: 1px solid var(--gray-300);
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    margin-top: 0.25rem; /* Small space below input */
  }

  .suggestion-item {
    padding: 0.75rem 1rem;
    cursor: pointer;
    border-bottom: 1px solid var(--gray-300);
    font-size: 0.95rem;
    color: var(--gray-900);
  }

  .suggestion-item:last-child {
    border-bottom: none;
  }

  .suggestion-item:hover,
  .suggestion-item[aria-selected="true"] {
    background-color: var(--light-blue);
    color: var(--white);
  }

  .suggestions-dropdown.no-results .suggestion-item {
    cursor: default;
    background-color: #f9fafb; /* Lighter background for no results */
    color: var(--gray-600);
    font-style: italic;
  }

  .suggestions-dropdown.no-results .suggestion-item:hover {
    background-color: #f9fafb; /* No hover effect for no results */
    color: var(--gray-600);
  }

  .suggestion-item.disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
</style> 