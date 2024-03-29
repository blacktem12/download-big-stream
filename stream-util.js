const fs = require('fs');
const { Writable } = require('stream');
const path = require('path');

/**
 * 대용량 MemoryStream을 다운로드 받기 위해 FileStream으로 변환하는 기능
 */
module.exports = class WritableStream extends Writable {
  constructor(filePath, sourceStream) {
    super({ objectMode: true });

    this.readable = sourceStream;

    // 메모리에 캐시된 데이터를 파일로 옮기기 위한 FileStream
    this.fileStream = fs.createWriteStream(path.resolve(filePath), { encoding: 'utf8' });

    this.fileStream.on('drain', () => {
      this.readable.resume();
    });

    this.on('close', () => {
      this.destroy();
    });
  }

  _write(chunks, encoding, callback) {
    for (let chunk of chunks) {
      if (typeof chunk.text == 'string') {
        if (!this.fileStream.write(`${chunk.text}\r\n`)) {
          this.readable.pause();
        }
      } else if (chunk.text instanceof ArrayBuffer) {
        this.fileStream.write(`${chunk.text.toString('utf8')}\r\n`);
      } else {
        return callback('Data Type Not Supported');
      }

      // FileStream에 즉시 반영하고, 반영된 데이터는 메모리에서 즉시 해제한다.
      this.fileStream.cork();
      this.fileStream.uncork();
    }
    
    callback();
  }

  _final(callback) {
    this.end();
    this.fileStream.end();

    callback();
  }
}