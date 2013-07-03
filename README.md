# Derriere

An image resizing service to sit **behind** a dynamic cache (like CloudFront).

## Install

Install Derriere with npm.

```bash
npm install -g derriere
```

Set up your configuration (see below) and simply run

```bash
derriere path/to/config
```

## Config

Derriere uses a JS/JSON file for configuration. By default, Derriere will look
for `process.cwd() + '/derriere', but you can specifiy another location by
passing it as the first argument to the executable.

**derriere.json**
```json
{
  "port": 80,
  "headers": {
    "Cache-Control": "max-age=315360000",
    "x-amz-acl": "public-read"
  },
  "hosts": [
    "cdn0.example.com",
    "cdn1.example.com",
    "cdn2.example.com",
    "cdn3.example.com"
  ],
  "extensions": [
    "jpg",
    "png",
    "gif",
    "css",
    "js"
  ],
  "bucket": "some-s3-bucket",
  "accessKeyId": "XXX",
  "secretAccessKey": "XXX",
  "uploadKey": "shared key between derriere and publishing interface",
  "sizes": {
    "profile": [
      {"strip": []},
      {"scale": [200, 200, "^"]},
      {"gravity": ["Center"]},
      {"extent": [200, 200]}
    ],
    "100x100": [
      {"strip": []},
      {"resize": [100, 100]}
    ]
  }
}
```
