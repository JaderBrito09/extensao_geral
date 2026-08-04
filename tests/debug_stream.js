const zlib = require('zlib');

const stream2A = 'BT /F1 14 Tf (Cabeçalho do Documento) Tj ET';
const stream2B = 'BT /F1 10 Tf (Conteúdo do parágrafo comprimido com caracteres especiais: 12345) Tj ET';

function buildPdfBuffer(streamContents, isCompressed = false) {
  const parts = [];
  parts.push(Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'));
  
  streamContents.forEach((content, index) => {
    const objNum = index + 3;
    let streamBuf;
    let filterHeader = '';
    if (isCompressed) {
      filterHeader = '/Filter /FlateDecode ';
      streamBuf = zlib.deflateSync(Buffer.from(content, 'utf-8'));
    } else {
      streamBuf = Buffer.from(content, 'utf-8');
    }
    
    parts.push(Buffer.from(`${objNum} 0 obj\n<< /Length ${streamBuf.length} ${filterHeader}>>\nstream\n`));
    parts.push(streamBuf);
    parts.push(Buffer.from('\nendstream\nendobj\n'));
  });

  parts.push(Buffer.from('%%EOF\n'));
  return Buffer.concat(parts);
}

const pdfBuf = buildPdfBuffer([stream2A, stream2B], true);

const bytes = new Uint8Array(pdfBuf);
const streamMarker = [115, 116, 114, 101, 97, 109]; // "stream"
const endstreamMarker = [101, 110, 100, 115, 116, 114, 101, 97, 109]; // "endstream"

function matchMarker(arr, index, marker) {
  if (index + marker.length > arr.length) return false;
  for (let i = 0; i < marker.length; i++) {
    if (arr[index + i] !== marker[i]) return false;
  }
  return true;
}

for (let i = 0; i < bytes.length - 6; i++) {
  // Check that it is "stream" and NOT "endstream"
  if (matchMarker(bytes, i, streamMarker)) {
    if (i >= 3 && bytes[i-3] === 101 && bytes[i-2] === 110 && bytes[i-1] === 100) {
      // It's "endstream", skip
      continue;
    }

    console.log('Found valid stream at byte index:', i);
    let streamStart = i + 6;
    if (streamStart < bytes.length && bytes[streamStart] === 13) streamStart++;
    if (streamStart < bytes.length && bytes[streamStart] === 10) streamStart++;

    let streamEnd = -1;
    for (let j = streamStart; j < bytes.length - 9; j++) {
      if (matchMarker(bytes, j, endstreamMarker)) {
        streamEnd = j;
        if (streamEnd > streamStart && (bytes[streamEnd - 1] === 10 || bytes[streamEnd - 1] === 13)) streamEnd--;
        if (streamEnd > streamStart && (bytes[streamEnd - 1] === 10 || bytes[streamEnd - 1] === 13)) streamEnd--;
        break;
      }
    }
    console.log('Stream start:', streamStart, 'end:', streamEnd);
    const compressedData = bytes.subarray(streamStart, streamEnd);
    const decompressed = zlib.inflateSync(compressedData).toString('utf-8');
    console.log('Decompressed stream:', decompressed);
  }
}
