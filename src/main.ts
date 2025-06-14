import { doRedirect } from "./bang";
import { initI18n } from "./i18next";
import { initSettings } from "./settings";

doRedirect();

initI18n();
initSettings();
