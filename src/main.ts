import { doRedirect } from "./bang";
import { initI18n } from "./i18next";
import { initSettings } from "./settings";
import { initSearchEngineModal } from "./browserDetection";

doRedirect();

initI18n();
initSettings();
initSearchEngineModal();
