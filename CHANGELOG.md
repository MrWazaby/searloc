## 0.3.2 (2026-02-28)

### Fix

- **instances**: fix the instances list and remove quality check
- **ci**: do not allow bad instances.json to be generated

## 0.3.1 (2025-08-04)

### Fix

- **retry**: fix the retry regex to avoid wrong history use in bangs
- **locale**: add missing place holder field
- **ci**: fix the daily build

## 0.3.0 (2025-08-01)

### Feat

- **searxng**: get instances from the custom list
- **scraper**: add the base quality tool
- **settings**: add import/export settings
- **settings**: forward settings to searxng
- **style**: add light mode
- **retry**: improve retery, closes #47
- **search**: add search retry (opt-in)
- **autocomplete**: better sugestions and darkmode
- **autocomplete**: add base autocomplete

### Fix

- **scrape**: fix instances output
- **searxng**: use all default lang
- **ci**: fix the npm command
- **ci**: fix the scraping ci
- **conflict**: fix errors in conflict resolution
- **github**: do not deploy tags to IONOS
- **autocomple**: do not load autocomplete on other pages

## 0.2.4 (2025-07-01)

### Fix

- **searxng**: try to bypass some instances redirections

## 0.2.3 (2025-06-30)

### Fix

- **searxng**: fix the refferer to avoid some redirections

## 0.2.2 (2025-06-14)

### Fix

- **version**: fix version bump

## 0.2.1 (2025-06-14)

### Fix

- **cz**: fix the version increment on locales

## 0.2.0 (2025-06-14)

### Feat

- **settings**: add custom searxng instances
- **settings**: add ttl for bangs cache
- **settings**: allow to set instances cache
- **settings**: add lang switch
- **settings**: add the base setting page
- **about**: add about page
- **bangs**: use kagi's bangs
- **logo**: update logo
- **i18n**: add translation system and fr version

### Fix

- **settings**: fix the default cache value
- **bangs**: fix linting error
- **search-bar**: fix the hardcoded place holder
- **locales**: try to fix #34
- **build**: fix build errors
- **coc**: fix the contact email
- **readme**: fix some typos

### Refactor

- **lang**: refactor the lang files

## 0.1.1 (2025-06-02)

### Fix

- **domain**: switch to searloc.org
- **cz**: update index.html version on bump
- **about**: hide about link

## 0.1.0 (2025-06-02)

### Feat

- **local**: add the default search page
- **searxng**: redirect to a random searxng instance
- **searxng**: replace google by a searxng static instance for default search
- **base**: forking unduck

### Fix

- **searxng**: store the instance list in local storage instead of a cookie
- **css**: fix the loading screen
