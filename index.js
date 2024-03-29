const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const Writable = require('./stream-util');
const fs = require('fs');

app.get('/', async (request, response) => {
  response.sendFile(path.resolve(__dirname, 'index.html'));
});

app.get('/download', async (request, response) => {
  const filePath = path.resolve(__dirname, 'download.csv');

  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { force: true });
  }

  fs.writeFileSync(filePath, '');

  const sample = 'Your Big MemoryStream';
  const writable = new Writable(filePath, sample);

  writable.fileStream.on('close', () => {
    writable.fileStream.destroy();

    const readable = fs.createReadStream(filePath);
    
    readable.on('close', () => {
      sample.destroy();
      fs.rmSync(filePath);
    });
  });

  sample.pipe(writable);
  
  writable.on('finish', function (e) {
    writable.fileStream.pipe(response);
  });
});

http.createServer(app).listen(3000, '0.0.0.0');