import { doRedirect } from "./bang";
import { initI18n } from "./i18next";
import { initSettings } from "./settings";
import { initSearchEngineModal } from "./browserDetection";
import { Autocomplete } from './autocomplete';

document.addEventListener('DOMContentLoaded', () => {
    doRedirect();

    initI18n();
    initSettings();
    initSearchEngineModal();

    if (document.getElementById('search-input')) {
        new Autocomplete('search-input', 'autocomplete-container');
    }
});