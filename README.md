# postcss-import-url
[PostCSS](https://github.com/postcss/postcss) plugin inlines remote files, for in-browser use in [livecodes.io](https://livecodes.io).
This is a fork of [postcss-import-url](https://github.com/unlight/postcss-import-url) with same API. It adds caching to prevent re-fetching the same url (can be disabled in options).
```c
/* Input example */
@import 'https://fonts.googleapis.com/css?family=Tangerine';
body 
  font-size: 13px;

`
`s
/* Output example */
@font-face {
  font-family: 'Tangerine';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/tangerine/v12/IurY6Y5j_oScZZow4VOxCZZM.woff2) format('woff2');

body
  font-size: 13px;

`
## Options
- `disableCache` (boolean) disable caching url content (default: `false`)
- `recursive` (boolean) To import URLs recursively (default: `true`)
- `resolveUrls` (boolean) To transform relative URLs found in remote stylesheets into fully qualified URLs ([see #18](https://github.com/unlight/postcss-import-url/pull/18)) (default: `false`)
- `modernBrowser` (boolean) Set user-agent string to 'Mozilla/5.0 AppleWebKit/537.36 Chrome/80.0.0.0 Safari/537.36', this option maybe useful for importing fonts from Google. Google check `user-agent` header string and respond can be different (default: `false`)
- `userAgent` (string) Custom user-agent header (default: `null`)
