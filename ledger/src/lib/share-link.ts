/** Tokens are 32 base64url characters (192 bits); anything else can't match an invoice. */
export const isShareToken = (token: string) => /^[A-Za-z0-9_-]{32}$/.test(token);

export const sharePath = (token: string) => `/i/${token}`;
