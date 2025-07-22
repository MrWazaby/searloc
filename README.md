# Searloc

Welcome to Searloc, a decentralized search project focused on privacy. By redirecting your searches across multiple SearxNG instances, Searloc ensures no single point of control. It operates without server-side processing, using only HTML, CSS, and JavaScript, and includes no telemetry or trackers. Bangs search are handled locally, keeping your data private. 

## How to use it 
To use Searloc, simply visit https://searloc.org and enter your search query.

The URL for searching is `https://searloc.org/?q=%s`.

If the search results is not good enough for you, you can enable (in the settings, it's off by default) and use in the `!!` bang. It will replay your search on another random instance. You can also use this feature to add elements to your search: 
```
first search: test
second search: !! # will search "test" on another searxng instance 
second search: !! !!w # will search "test" on wikipedia
second search: !! driven development # will search "test drive development" on a random searxng instance 
```

You can also set Searloc as your default search engine in your browser. Here are the steps for popular browsers:

### Chrome
[Check the knowledge base](https://support.google.com/chrome/answer/95426?hl=en)

### Firefox
[Check the knowledge base](https://support.mozilla.org/en-US/kb/add-or-remove-search-engine-firefox)

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

## Get Help
- Contact us on Matrix searloc:matrix.org
- If appropriate, [open an issue](https://codeberg.org/wazaby/searloc/issues) on Codeberg.

See [the code of conduct](code_of_conduct.md) befor contacting us.

## License
Searloc is lisenced under the MIT License. You can view the full license text in the LICENSE file in the repository.

## Acknowledgements
- [SearxNG](https://github.com/searxng/searxng) for providing the search engine framework and the inspiration for the design.
- [Searx.space](https://searx.space) for the instances list ans rating.
- [Unduck](https://github.com/t3dotgg/unduck) for the base source code this project is forked on.
- [Logodust](https://logodust.com) for the base logo design.
- [Kagi Bangs](https://github.com/kagisearch/bangs) for the bangs search functionality.
