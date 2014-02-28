#Proxke

## Proxy + Mock server

### What this is actually do
  - The Problem: if you ever need to "fake" response from a 3rd party and can't use their server you need to create a server and point your request to this specifc server.
  - The Solution: Building a mock + proxy server that will handle the request, some of the request you will use to redirect them to the right server cause you'll need to "read" data which most of the time you'll have an access, but when you'll need to write and get a confirmation (specially when testing) you should use the mock server.

### How to start:
  - `npm i`
  - `node index.js -p <partner_name>` or `node index.js --partner <partner name>`
  

### if you have any further question please feel free to ping me.
  - I know that there's a lot to do but I'm on it, let me know if there's something specific you'll need.
  - you can also install this as a node module just `npm i proxke --save` 



### Good Luck!
