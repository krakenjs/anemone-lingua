anemone-lingua
=======

anemone-lingua is a content loader middleware for react in [kraken-js](https://github.com/krakenjs/kraken-js) workflow. It loads content strings from kraken-js style `.properties` bundles.

#### Example Setup (in kraken config)
```json
{
  "middleware": {
    "reactContentLoader": {
      "priority": 100,
      "enabled": true,
      "module": {
          "name": "anemone-lingua",
          "arguments": [{
              "contentPath": "path:./locales",
              "fallback": "en-US"
          }]
      }
    }
  }
}
```

#### To enable debug messages
```shell
NODE_DEBUG=anemone-lingua node YOUR-APP-FILE.js
```
