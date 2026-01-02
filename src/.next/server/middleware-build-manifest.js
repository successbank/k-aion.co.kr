self.__BUILD_MANIFEST = {
  "polyfillFiles": [
    "static/chunks/polyfills.js"
  ],
  "devFiles": [
    "static/chunks/react-refresh.js"
  ],
  "ampDevFiles": [],
  "lowPriorityFiles": [],
  "rootMainFiles": [],
  "pages": {
    "/": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/index.js"
    ],
    "/404": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/404.js"
    ],
    "/_app": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/_app.js"
    ],
    "/_error": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/_error.js"
    ],
    "/about/company": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/about/company.js"
    ],
    "/franchise": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/franchise.js"
    ],
    "/franchise/cost": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/franchise/cost.js"
    ],
    "/franchise/model": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/franchise/model.js"
    ],
    "/products/[slug]": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/products/[slug].js"
    ],
    "/stores": [
      "static/chunks/webpack.js",
      "static/chunks/main.js",
      "static/chunks/pages/stores.js"
    ]
  },
  "ampFirstPages": []
};
self.__BUILD_MANIFEST.lowPriorityFiles = [
"/static/" + process.env.__NEXT_BUILD_ID + "/_buildManifest.js",
,"/static/" + process.env.__NEXT_BUILD_ID + "/_ssgManifest.js",

];