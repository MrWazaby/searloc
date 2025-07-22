import i18next from 'i18next';
import { translateApp } from './i18next';

/**
 * Interface representing the application settings
 */
interface SearlocSettings {
  customInstances: string[];
  language: 'fr' | 'en';
  theme: 'auto' | 'dark' | 'light';
  retrySearch: boolean;
  bangRefreshHours: number;
  instanceRefreshHours: number;
}

/**
 * Default settings values
 */
const DEFAULT_SETTINGS: SearlocSettings = {
  customInstances: [],
  language: 'en',
  theme: 'auto',
  retrySearch: false,
  bangRefreshHours: 168,
  instanceRefreshHours: 24
};

/**
 * The key used to store settings in localStorage
 */
const STORAGE_KEY = 'searloc_settings';

/**
 * Loads settings from localStorage or returns default settings if none are found
 */
export function loadSettings(): SearlocSettings {
  try {
    const storedSettings = localStorage.getItem(STORAGE_KEY);
    if (storedSettings) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Saves settings to localStorage
 */
function saveSettings(settings: SearlocSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

/**
 * Parses a comma-separated string of instances into an array
 */
function parseCustomInstances(instancesString: string): string[] {
  if (!instancesString) return [];
  return instancesString
    .split(',')
    .map(url => url.trim())
    .filter(url => url && url.includes('://'))
    .map(url => url.endsWith('/') ? url : url + '/');
}

/**
 * Validates and applies the settings from the form
 */
function applySettingsFromForm(formElement: HTMLFormElement): void {
  const formData = new FormData(formElement);
  
  const customInstancesString = formData.get('customInstance') as string || '';
  const customInstances = parseCustomInstances(customInstancesString);
  
  const language = (formData.get('lang') as 'fr' | 'en') || DEFAULT_SETTINGS.language;
  const theme = (formData.get('theme') as 'auto' | 'dark' | 'light') || DEFAULT_SETTINGS.theme;
  const retrySearch = formData.get('retrySearch') === 'on';
  const bangRefreshHours = parseInt(formData.get('bangRefresh') as string) || DEFAULT_SETTINGS.bangRefreshHours;
  const instanceRefreshHours = parseInt(formData.get('instanceRefresh') as string) || DEFAULT_SETTINGS.instanceRefreshHours;
  
  // Ensure values are within valid ranges
  const validatedSettings: SearlocSettings = {
    customInstances,
    language,
    theme,
    retrySearch,
    bangRefreshHours: Math.min(Math.max(bangRefreshHours, 1), 720),
    instanceRefreshHours: Math.min(Math.max(instanceRefreshHours, 1), 720)
  };
  
  saveSettings(validatedSettings);
  
  // Update i18next language if it changed
  if (i18next.language !== language) {
    i18next.changeLanguage(language);
    translateApp();
  }

  // Update theme if it changed
  applyTheme(theme);

  // Clear localStorage if language changes to reset cache
  localStorage.removeItem('bangs_json');
  localStorage.removeItem('searxng_instances');
}

/**
 * Populates the settings form with current values
 */
function populateSettingsForm(formElement: HTMLFormElement, settings: SearlocSettings): void {
  const customInstanceInput = formElement.querySelector('#custom-instance') as HTMLInputElement;
  if (customInstanceInput) {
    customInstanceInput.value = settings.customInstances.join(',');
  }
  
  const langSelect = formElement.querySelector('#lang-select') as HTMLSelectElement;
  if (langSelect) {
    langSelect.value = settings.language;
  }

  const themeSelect = formElement.querySelector('#theme-select') as HTMLSelectElement;
  if (themeSelect) {
    themeSelect.value = settings.theme;
  }

  const retrySearchInput = formElement.querySelector('#retry-search-checkbox') as HTMLInputElement;
  if (retrySearchInput) {
    retrySearchInput.checked = settings.retrySearch;
  }
  
  const bangRefreshInput = formElement.querySelector('#bang-refresh-select') as HTMLInputElement;
  if (bangRefreshInput) {
    bangRefreshInput.value = settings.bangRefreshHours.toString();
  }
  
  const instanceRefreshInput = formElement.querySelector('#instance-refresh-select') as HTMLInputElement;
  if (instanceRefreshInput) {
    instanceRefreshInput.value = settings.instanceRefreshHours.toString();
  }
}

/**
 * Applies the specified theme to the document
 */
export function applyTheme(theme: 'auto' | 'dark' | 'light'): void {
  document.documentElement.setAttribute('data-theme', theme);
}

/**
 * Initializes the theme based on saved settings
 */
export function initTheme(): void {
  const settings = loadSettings();
  applyTheme(settings.theme);
}

/**
 * Exports current settings as a JSON file download
 */
function exportSettings(): void {
  try {
    const settings = loadSettings();
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `searloc-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    showSettingsMessage(i18next.t('settings.export_success'), 'success');
  } catch (error) {
    console.error('Failed to export settings:', error);
    showSettingsMessage(i18next.t('settings.export_error'), 'error');
  }
}

/**
 * Imports settings from a JSON file
 */
function importSettings(file: File): void {
  const reader = new FileReader();
  
  reader.onload = (event) => {
    try {
      const content = event.target?.result as string;
      const importedSettings = JSON.parse(content);
      
      // Validate imported settings structure
      if (!isValidSettingsObject(importedSettings)) {
        throw new Error('Invalid settings format');
      }
      
      // Merge with default settings to ensure all properties exist
      const validatedSettings: SearlocSettings = { ...DEFAULT_SETTINGS, ...importedSettings };
      
      // Additional validation for specific fields
      if (!['fr', 'en'].includes(validatedSettings.language)) {
        validatedSettings.language = DEFAULT_SETTINGS.language;
      }
      
      if (!['auto', 'dark', 'light'].includes(validatedSettings.theme)) {
        validatedSettings.theme = DEFAULT_SETTINGS.theme;
      }
      
      // Validate refresh intervals
      validatedSettings.bangRefreshHours = Math.min(Math.max(validatedSettings.bangRefreshHours, 1), 720);
      validatedSettings.instanceRefreshHours = Math.min(Math.max(validatedSettings.instanceRefreshHours, 1), 720);
      
      // Validate custom instances
      if (Array.isArray(validatedSettings.customInstances)) {
        validatedSettings.customInstances = validatedSettings.customInstances
          .filter(url => typeof url === 'string' && url.includes('://'))
          .map(url => url.endsWith('/') ? url : url + '/');
      } else {
        validatedSettings.customInstances = [];
      }
      
      // Save the validated settings
      saveSettings(validatedSettings);
      
      // Update the form with imported settings
      const form = document.getElementById('settings-form') as HTMLFormElement;
      if (form) {
        populateSettingsForm(form, validatedSettings);
      }
      
      // Update i18next language if it changed
      if (i18next.language !== validatedSettings.language) {
        i18next.changeLanguage(validatedSettings.language);
        translateApp();
      }
      
      // Update theme if it changed
      applyTheme(validatedSettings.theme);
      
      showSettingsMessage(i18next.t('settings.import_success'), 'success');
    } catch (error) {
      console.error('Failed to import settings:', error);
      showSettingsMessage(i18next.t('settings.import_error'), 'error');
    }
  };
  
  reader.onerror = () => {
    showSettingsMessage(i18next.t('settings.import_error'), 'error');
  };
  
  reader.readAsText(file);
}

/**
 * Validates if an object has the correct structure for SearlocSettings
 */
function isValidSettingsObject(obj: any): obj is Partial<SearlocSettings> {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  // Check if it has at least one valid setting property
  const validKeys = ['customInstances', 'language', 'theme', 'retrySearch', 'bangRefreshHours', 'instanceRefreshHours'];
  return validKeys.some(key => key in obj);
}

/**
 * Shows a settings message with appropriate styling
 */
function showSettingsMessage(message: string, type: 'success' | 'error'): void {
  const messageElement = document.getElementById('settings-message');
  if (messageElement) {
    messageElement.textContent = message;
    messageElement.className = type === 'success' ? 'success-message' : 'error-message';
    
    // Clear the message after 5 seconds
    setTimeout(() => {
      messageElement.textContent = '';
      messageElement.className = '';
    }, 5000);
  }
}

/**
 * Initializes the settings functionality
 */
export function initSettings(): void {
  const settings = loadSettings();
  const form = document.getElementById('settings-form') as HTMLFormElement;
  
  if (!form) {
    return;
  }
  
  // Populate form with current settings
  populateSettingsForm(form, settings);
  
  // Handle form submission
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    applySettingsFromForm(form);
    
    // Show success message
    showSettingsMessage(i18next.t('settings.saved_message'), 'success');
  });
  
  // Handle export button
  const exportButton = document.getElementById('export-settings-btn');
  if (exportButton) {
    exportButton.addEventListener('click', (event) => {
      event.preventDefault();
      exportSettings();
    });
  }
  
  // Handle import button and file input
  const importButton = document.getElementById('import-settings-btn');
  const importFileInput = document.getElementById('import-settings-file') as HTMLInputElement;
  
  if (importButton && importFileInput) {
    importButton.addEventListener('click', (event) => {
      event.preventDefault();
      importFileInput.click();
    });
    
    importFileInput.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (file) {
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          importSettings(file);
        } else {
          showSettingsMessage(i18next.t('settings.import_invalid_file'), 'error');
        }
        
        // Reset the file input
        target.value = '';
      }
    });
  }
}
