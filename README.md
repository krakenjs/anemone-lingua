anemone
=======

a content loader middleware for react in (kraken)[https://github.com/krakenjs/kraken-js] workflow.
 __(loads content data from kraken-js-style .properties bundles)__

#### Example Setup (in kraken config)
```json
{
  "middleware": {
    "reactContentLoader": {
      "priority": 100,
      "enabled": true,
      "module": {
          "name": "anemone",
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
NODE_DEBUG=anemone node YOUR-APP-FILE.js
```
