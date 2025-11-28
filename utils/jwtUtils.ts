/**
 * Decodes a base64url string to a string.
 */
const base64UrlDecode = (str: string): string => {
  // Add padding if needed
  let output = str.replace(/-/g, "+").replace(/_/g, "/");
  switch (output.length % 4) {
    case 0:
      break;
    case 2:
      output += "==";
      break;
    case 3:
      output += "=";
      break;
    default:
      throw new Error("Illegal base64url string!");
  }

  // Decode properly handling UTF-8 characters
  return decodeURIComponent(
    atob(output)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );
};

/**
 * Encodes a Uint8Array to base64url string.
 */
const base64UrlEncode = (bytes: Uint8Array): string => {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export const isValidJwt = (token: string): boolean => {
  if (!token) return false;
  const parts = token.split(".");
  return parts.length === 3;
};

export const decodeJwt = (token: string): string => {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format. Expected 3 parts separated by dots.");
  }

  try {
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    const signature = parts[2]; // Signature is just a string, we don't decode it like JSON

    // Return a structured object that our JSON viewer can display nicely
    return JSON.stringify(
      {
        HEADER: header,
        PAYLOAD: payload,
        SIGNATURE: signature,
      },
      null,
      2
    );
  } catch (e) {
    console.error(e);
    throw new Error(
      "Failed to decode JWT sections. Ensure input is a valid Base64Url encoded string."
    );
  }
};

/**
 * Verifies HS256 signature using Web Crypto API
 */
export const verifyHmacSignature = async (
  token: string,
  secret: string
): Promise<boolean> => {
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [headerB64, payloadB64, signatureB64] = parts;

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const keyData = encoder.encode(secret);

    const key = await window.crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await window.crypto.subtle.sign("HMAC", key, data);

    const computedSignatureB64 = base64UrlEncode(new Uint8Array(signature));

    // Constant-time comparison is better for security, but for a client-side tool standard compare is acceptable
    return computedSignatureB64 === signatureB64;
  } catch (e) {
    console.error("Verification error:", e);
    return false;
  }
};
