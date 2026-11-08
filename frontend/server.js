'use strict';

const { createServer } = require('node:http');
const next = require('next');

const port = Number.parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV === 'development';
const app = next({ dev, dir: __dirname, port });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, () => {
      console.log(`Next.js listening on port ${port} (${dev ? 'development' : 'production'})`);
    });
  })
  .catch((error) => {
    console.error('Failed to start the Next.js server:', error);
    process.exit(1);
  });
