const COPY: Record<string, string> = {
  NO_URL: "We couldn’t read that link.",
  INVALID_URL: "We couldn’t read that link.",
  UNSAFE_SCHEME: "We couldn’t read that link.",
  HTTPS_REQUIRED: "We couldn’t read that link.",
  UNSUPPORTED_SHARE: "We couldn’t read that link.",
  NETWORK: "We couldn’t identify the restaurant.",
  METADATA_UNAVAILABLE: "We couldn’t identify the restaurant.",
  LOOKUP_FAILED: "We couldn’t identify the restaurant.",
  ALREADY_IN_TRY_NEXT: "This restaurant is already in Try Next.",
  LINK_ONLY_SAVED: "We saved the link, but you’ll need to connect the restaurant later.",
  SAVE_FAILED: "We couldn’t save that spot. Try again.",
  SOURCE_EXPIRED: "This link is no longer available.",
  AUTH_REQUIRED: "Sign in to save this find to Try Next.",
  APP_GROUP: "We couldn’t read that share. Open PickyBites and try again.",
  DUPLICATE_INTENT: "This share was already processed.",
  DEFAULT: "Something went wrong. Please try again.",
};

export function shareIntakeUserMessage(code: string | null | undefined): string {
  if (!code) return COPY.DEFAULT;
  return COPY[code] ?? COPY.DEFAULT;
}

export class ShareIntakeError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message ?? shareIntakeUserMessage(code));
    this.code = code;
    this.name = "ShareIntakeError";
  }
}
