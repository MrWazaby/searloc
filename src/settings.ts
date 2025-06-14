import i18next from 'i18next';
import { translateApp } from './i18next';
import { removeLocalStorage } from './utils';

/**
 * Interface representing the application settings
 */
interface SearlocSettings {
  customInstances: string[];
  language: 'fr' | 'en';
  bangRefreshHours: number;
  instanceRefreshHours: number;
}

/**
 * Default settings values
 */
const DEFAULT_SETTINGS: SearlocSettings = {
  customInstances: [],
  language: 'en',
  bangRefreshHours: 24,
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
    .filter(url => url && url.includes('://'));
}

/**
 * Validates and applies the settings from the form
 */
function applySettingsFromForm(formElement: HTMLFormElement): void {
  const formData = new FormData(formElement);
  
  const customInstancesString = formData.get('customInstance') as string || '';
  const customInstances = parseCustomInstances(customInstancesString);
  
  const language = (formData.get('lang') as 'fr' | 'en') || DEFAULT_SETTINGS.language;
  const bangRefreshHours = parseInt(formData.get('bangRefresh') as string) || DEFAULT_SETTINGS.bangRefreshHours;
  const instanceRefreshHours = parseInt(formData.get('instanceRefresh') as string) || DEFAULT_SETTINGS.instanceRefreshHours;
  
  // Ensure values are within valid ranges
  const validatedSettings: SearlocSettings = {
    customInstances,
    language,
    bangRefreshHours: Math.min(Math.max(bangRefreshHours, 1), 720),
    instanceRefreshHours: Math.min(Math.max(instanceRefreshHours, 1), 720)
  };
  
  saveSettings(validatedSettings);
  
  // Update i18next language if it changed
  if (i18next.language !== language) {
    i18next.changeLanguage(language);
    translateApp();
  }

  // Clear localStorage if language changes to reset cache
  removeLocalStorage('bangs_json');
  removeLocalStorage('searxng_instances');
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
    const messageElement = document.getElementById('settings-message');
    if (messageElement) {
      messageElement.textContent = i18next.t('settings.saved_message');
      messageElement.className = 'success-message';
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        messageElement.textContent = '';
        messageElement.className = '';
      }, 3000);
    }
  });
}
