const zlib = require('zlib');
const assert = require('assert');

function decodeBytesToString(bytes) {
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
    return utf8Decoder.decode(bytes);
  } catch (e) {
    const latin1Decoder = new TextDecoder('latin1');
    return latin1Decoder.decode(bytes);
  }
}

async function decompressFlateStream(compressedBytes) {
  if (!compressedBytes || compressedBytes.length === 0) return null;
  
  if (typeof DecompressionStream !== 'undefined') {
    try {
      const ds = new DecompressionStream('deflate');
      const writer = ds.writable.getWriter();
      const writePromise = writer.write(compressedBytes).then(() => writer.close()).catch(() => {});
      const readPromise = new Response(ds.readable).arrayBuffer();
      const arrayBuffer = await readPromise;
      await writePromise;
      return new Uint8Array(arrayBuffer);
    } catch (e1) {
      try {
        const ds = new DecompressionStream('deflate-raw');
        const writer = ds.writable.getWriter();
        const writePromise = writer.write(compressedBytes).then(() => writer.close()).catch(() => {});
        const readPromise = new Response(ds.readable).arrayBuffer();
        const arrayBuffer = await readPromise;
        await writePromise;
        return new Uint8Array(arrayBuffer);
      } catch (e2) {}
    }
  }

  if (typeof require !== 'undefined') {
    try {
      try {
        return new Uint8Array(zlib.inflateSync(compressedBytes));
      } catch (e3) {
        return new Uint8Array(zlib.inflateRawSync(compressedBytes));
      }
    } catch (e4) {}
  }

  return null;
}

function decodePdfString(pdfStr) {
  if (!pdfStr) return '';
  return pdfStr.replace(/\\([0-7]{1,3}|\r\n|[\s\S])/g, (match, p1) => {
    if (/^[0-7]{1,3}$/.test(p1)) {
      return String.fromCharCode(parseInt(p1, 8));
    }
    switch (p1) {
      case 'n': return '\n';
      case 'r': return '\r';
      case 't': return '\t';
      case 'b': return '\b';
      case 'f': return '\f';
      case '(': return '(';
      case ')': return ')';
      case '\\': return '\\';
      case '\r\n':
      case '\n':
      case '\r':
        return '';
      default:
        return p1;
    }
  });
}

async function extractTextFromPdfBytes(bytes) {
  if (!bytes || !(bytes instanceof Uint8Array) || bytes.length === 0) {
    throw new Error('Dados de PDF inválidos ou vazios.');
  }

  const headerStr = decodeBytesToString(bytes.subarray(0, Math.min(bytes.length, 1024)));
  if (!headerStr.includes('%PDF')) {
    throw new Error('O arquivo fornecido não é um documento PDF válido.');
  }

  function matchMarker(arr, index, marker) {
    if (index + marker.length > arr.length) return false;
    for (let i = 0; i < marker.length; i++) {
      if (arr[index + i] !== marker[i]) return false;
    }
    return true;
  }

  const streamMarker = [115, 116, 114, 101, 97, 109]; // "stream"
  const endstreamMarker = [101, 110, 100, 115, 116, 114, 101, 97, 109]; // "endstream"

  let textSegments = [];
  let lastIndex = 0;

  for (let i = 0; i < bytes.length - 6; i++) {
    if (matchMarker(bytes, i, streamMarker)) {
      // Avoid matching "endstream"
      if (i >= 3 && bytes[i - 3] === 101 && bytes[i - 2] === 110 && bytes[i - 1] === 100) {
        continue;
      }

      const dictStart = Math.max(0, i - 400);
      const dictHeader = decodeBytesToString(bytes.subarray(dictStart, i));
      const isFlate = /\/Filter\s*(\/FlateDecode|\[\s*\/FlateDecode\s*\])/i.test(dictHeader);

      textSegments.push(decodeBytesToString(bytes.subarray(lastIndex, i)));

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

      if (streamEnd !== -1 && streamEnd >= streamStart) {
        const compressedData = bytes.subarray(streamStart, streamEnd);
        let decompressedText = null;

        if (isFlate || (compressedData.length > 2 && compressedData[0] === 0x78)) {
          try {
            const decompressedBytes = await decompressFlateStream(compressedData);
            if (decompressedBytes) {
              decompressedText = decodeBytesToString(decompressedBytes);
            }
          } catch (err) {
            console.warn('Falha ao descompactar stream FlateDecode:', err);
          }
        }

        if (decompressedText) {
          textSegments.push(decompressedText);
        } else {
          try {
            textSegments.push(decodeBytesToString(compressedData));
          } catch (e) {}
        }

        i = streamEnd;
        lastIndex = streamEnd;
      }
    }
  }

  if (lastIndex < bytes.length) {
    textSegments.push(decodeBytesToString(bytes.subarray(lastIndex)));
  }

  const combinedRawText = textSegments.join('\n');

  const textBlocks = [];
  const btRegex = /(?:^|\s|\/)?BT[\s\S]*?ET/gi;
  let match;
  while ((match = btRegex.exec(combinedRawText)) !== null) {
    const block = match[0];
    const stringMatches = block.match(/\((?:[^()\\]|\\[\s\S])*\)|<[0-9a-fA-F]+>/g);
    if (stringMatches) {
      const cleaned = stringMatches
        .map(s => {
          if (s.startsWith('(') && s.endsWith(')')) {
            return decodePdfString(s.slice(1, -1));
          } else if (s.startsWith('<') && s.endsWith('>')) {
            const hex = s.slice(1, -1);
            if (hex.length % 2 === 0) {
              let str = '';
              for (let h = 0; h < hex.length; h += 2) {
                const charCode = parseInt(hex.substr(h, 2), 16);
                if (charCode >= 32 && charCode <= 255) str += String.fromCharCode(charCode);
              }
              return str;
            }
          }
          return '';
        })
        .filter(s => s.trim().length > 0)
        .join(' ');

      if (cleaned.trim().length > 0) {
        textBlocks.push(cleaned.trim());
      }
    }
  }

  let extractedText = textBlocks.join(' ');

  if (!extractedText || extractedText.trim().length < 20) {
    const stringMatches = combinedRawText.match(/\((?:[^()\\]|\\[\s\S])*\)/g);
    if (stringMatches) {
      extractedText = stringMatches
        .map(s => decodePdfString(s.slice(1, -1)))
        .filter(s => s.trim().length > 0)
        .join(' ');
    }
  }

  if (!extractedText || extractedText.trim().length < 20) {
    const printableMatches = combinedRawText.match(/[\x20-\x7E\xA0-\xFF\n\r\t]{3,}/g);
    if (printableMatches) {
      extractedText = printableMatches
        .filter(str => !str.startsWith('/') && !str.includes('<<') && !str.includes('>>') && !str.includes('endobj') && !str.includes('stream') && !str.includes('xref') && !str.includes('trailer'))
        .join(' ');
    }
  }

  return extractedText ? extractedText.replace(/\s+/g, ' ').trim() : '';
}

// Helper to construct PDF binary buffers
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

async function testSuite() {
  console.log('--- Testando Extração de PDF Comprimido ---');

  // Test 1: Compressed PDF with /BT /ET and text Tj
  const stream1 = 'BT /F1 12 Tf (Relatório de Vendas 2026) Tj ET';
  const compressedPdf = buildPdfBuffer([stream1], true);
  const text1 = await extractTextFromPdfBytes(new Uint8Array(compressedPdf));
  console.log('Extracted Text 1:', text1);
  assert(text1.includes('Relatório de Vendas 2026'), 'Deveria extrair o texto de um PDF comprimido com FlateDecode');

  // Test 2: Uncompressed PDF
  const uncompressedPdf = buildPdfBuffer([stream1], false);
  const text2 = await extractTextFromPdfBytes(new Uint8Array(uncompressedPdf));
  console.log('Extracted Text 2:', text2);
  assert(text2.includes('Relatório de Vendas 2026'), 'Deveria extrair o texto de um PDF não comprimido');

  // Test 3: Multiple Compressed Streams
  const stream2A = 'BT /F1 14 Tf (Cabeçalho do Documento) Tj ET';
  const stream2B = 'BT /F1 10 Tf (Conteúdo do parágrafo comprimido com caracteres especiais: 12345) Tj ET';
  const multiStreamCompressedPdf = buildPdfBuffer([stream2A, stream2B], true);
  const text3 = await extractTextFromPdfBytes(new Uint8Array(multiStreamCompressedPdf));
  console.log('Extracted Text 3:', text3);
  assert(text3.includes('Cabeçalho do Documento') && text3.includes('12345'), 'Deveria extrair texto de múltiplos streams comprimidos');

  // Test 4: Corrupt Stream Handling (Invalid compressed stream data)
  const corruptPdfParts = [
    Buffer.from('%PDF-1.4\n1 0 obj\n<< /Length 20 /Filter /FlateDecode >>\nstream\nTHIS IS NOT ZLIB COMPRESSED DATA\nendstream\nendobj\n%%EOF\n')
  ];
  const corruptPdf = Buffer.concat(corruptPdfParts);
  const text4 = await extractTextFromPdfBytes(new Uint8Array(corruptPdf));
  console.log('Extracted Text 4 (Corrupted Stream Fallback):', text4);
  assert(typeof text4 === 'string', 'Tratamento de exceção em stream corrompido não deve lançar exceção não capturada');

  // Test 5: Invalid PDF file
  let invalidPdfThrown = false;
  try {
    await extractTextFromPdfBytes(new Uint8Array(Buffer.from('NOT A PDF FILE CONTENT')));
  } catch (err) {
    invalidPdfThrown = true;
    assert(err.message.includes('não é um documento PDF válido'), 'Mensagem de erro adequada para PDF inválido');
  }
  assert(invalidPdfThrown, 'Deveria lançar erro para arquivo não PDF');

  console.log('\n✅ TODOS OS TESTES PASSARAM COM SUCESSO!');
}

testSuite().catch(console.error);
