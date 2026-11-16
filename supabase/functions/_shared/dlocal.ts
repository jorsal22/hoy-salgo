const encoder = new TextEncoder();

export async function createDlocalSignature(
  login: string,
  date: string,
  body: string,
  secret: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(login + date + body),
  );
  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

export function signaturesMatch(expected: string, received: string): boolean {
  if (expected.length !== received.length) return false;

  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ received.charCodeAt(index);
  }
  return difference === 0;
}

export function getDlocalSignature(header: string | null): string | null {
  const match = header?.match(
    /^V2-HMAC-SHA256,\s*Signature:\s*([0-9a-f]{64})$/i,
  );
  return match?.[1] ?? null;
}
