# Searloc

Welcome to Searloc, a decentralized search project focused on privacy. By redirecting you search across multiple SearxNG instances, Searloc ensures no single point of control. It operates without server-side processing, using only HTML, CSS, and JavaScript, and includes no telemetry or trackers. Bangs search are handled locally, keeping your data private. 

## How to use it 
To use Searloc, simply visit https://searloc.net and enter your search query.

You can also set Searloc as your default search engine in your browser. Here are the instructions for some popular browsers:

### Chrome
1. Open Chrome settings.
2. Scroll down to "Search engine" and click on "Manage search engines."
3. Click "Add" next to "Other search engines."
4. Fill in the following details:
   - **Search engine**: Searloc
   - **Keyword**: searloc
   - **Query**: 
```
https://searloc.net?q=%s
```
5. Click "Add" to save.

### Firefox
1. Open Firefox settings.
2. Scroll down to "Search" and click on "Find more search engines."
3. Search for "Searloc" and click on the link to add it.

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for information on how to contribute to Searloc.

## Development
To run Searloc locally, clone the repository and then you can do:
```bash
npm install --include=dev 
npm run dev
```
This will start a local development server. You can also lint the code with:
```bash
npm run lint
```

## License
Searloc is lisenced under the MIT License. You can view the full license text in the LICENSE file in the repository.

## Acknowledgements
- [SearxNG](https://github.com/searxng/searxng) for providing the search engine framework and the inspiration for the design.
- [Searx.space](https://searx.space) for the instances list ans rating.
- [Unduck](https://github.com/t3dotgg/unduck) for the base code source this project is based on.
