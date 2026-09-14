// Encodes shared playground code as gzip-compressed base64 instead of raw
// percent-encoding, so ?code= links are shorter and don't fill the URL bar
// with %XX escapes.
//
// This is compression, not encryption: base64 and gzip are both fully
// reversible with no secret involved, so the code is exactly as readable to
// anyone who has the link as plain text would be — same as it was before.
// Real encryption isn't meaningful here: there's no server and no secret we
// hold that the reader doesn't also have (the decoding key would have to
// ship in this same public file), so it would look like security without
// providing any. If genuinely private sharing is wanted later, that needs a
// server-side store (share an opaque id, not the code itself).

async function gzip(bytes: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(bytes as BufferSource);
  writer.close();
  const chunks: Uint8Array[] = [];
  const reader = cs.readable.getReader();
  for (;;) {
    const {done, value} = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let offset = 0;
  for (const c of chunks) { out.set(c, offset); offset += c.length; }
  return out;
}

// gzip can compress highly repetitive input at ratios well over 1000:1, so a
// ?code= link small enough to fit in a URL can decompress into hundreds of
// MB and freeze or crash the tab of anyone who clicks a maliciously crafted
// shared link. No real playground snippet needs anywhere near this much
// source, so the read loop aborts once decompressed output exceeds the cap
// instead of trusting the compressed size as a proxy for the real one.
const MAX_DECOMPRESSED_BYTES = 1_000_000; // 1MB of Python source is already absurd

async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  writer.write(bytes as BufferSource);
  writer.close();
  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = ds.readable.getReader();
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_DECOMPRESSED_BYTES) throw new Error('decompressed payload too large');
      chunks.push(value);
    }
  } finally {
    reader.cancel().catch(() => {});
  }
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let offset = 0;
  for (const c of chunks) { out.set(c, offset); offset += c.length; }
  return out;
}

// base64url (RFC 4648 §5), not standard base64: the result goes directly
// into a URL path segment (/playground/<here>), so it must not contain the
// `+`, `/` or `=` characters that would need percent-encoding there.
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64ToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export async function encodeShareCode(code: string): Promise<string> {
  const bytes = new TextEncoder().encode(code);
  const compressed = await gzip(bytes);
  return bytesToBase64(compressed);
}

export async function decodeShareCode(encoded: string): Promise<string> {
  const compressed = base64ToBytes(encoded);
  const bytes = await gunzip(compressed);
  return new TextDecoder().decode(bytes);
}
