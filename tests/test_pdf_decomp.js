const zlib = require('zlib');

async function decompressFlate(compressedBytes) {
  try {
    const ds = new DecompressionStream('deflate');
    const writer = ds.writable.getWriter();
    writer.write(compressedBytes);
    writer.close();
    const response = new Response(ds.readable);
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (err1) {
    try {
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      writer.write(compressedBytes);
      writer.close();
      const response = new Response(ds.readable);
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (err2) {
      if (typeof require !== 'undefined') {
        try {
          return new Uint8Array(zlib.inflateSync(compressedBytes));
        } catch (e3) {
          return new Uint8Array(zlib.inflateRawSync(compressedBytes));
        }
      }
      throw err1;
    }
  }
}

async function runTest() {
  const originalText = "BT /F1 12 Tf (Hello PDF Compressed World!) Tj ET";
  const compressed = zlib.deflateSync(Buffer.from(originalText));
  console.log("Compressed length:", compressed.length);

  const decompressedBytes = await decompressFlate(new Uint8Array(compressed));
  const decompressedText = new TextDecoder('latin1').decode(decompressedBytes);
  console.log("Decompressed text:", decompressedText);
  console.log("Matches original:", decompressedText === originalText);
}

runTest().catch(console.error);
