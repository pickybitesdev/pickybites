/**
 * Guards the launch-blocking signup bug: when Supabase has "Confirm email"
 * enabled (the default), signUp returns a user with NO session. Treating that
 * as authenticated drops the user into the taste quiz where every
 * RLS-protected write fails.
 */

const mockSignUp = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  getSupabase: () => ({ auth: { signUp: mockSignUp } }),
  isSupabaseConfigured: () => true,
  getPublicStorageUrl: () => null,
}));

import { signUp } from "@/lib/supabase/api";

const FORM = {
  email: "New.User@Example.com ",
  password: "password123",
  username: "NewUser",
  displayName: "New User",
  city: "Hartford",
};

describe("signUp session handling", () => {
  beforeEach(() => mockSignUp.mockReset());

  it("reports needs_confirmation when no session comes back", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: "user-1" }, session: null },
      error: null,
    });

    const outcome = await signUp(FORM);

    expect(outcome).toEqual({ status: "needs_confirmation", email: "new.user@example.com" });
  });

  it("reports active when a session comes back", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: "user-1" }, session: { access_token: "t" } },
      error: null,
    });

    const outcome = await signUp(FORM);

    expect(outcome).toEqual({ status: "active", userId: "user-1" });
  });

  it("treats an already-registered email as needing confirmation, not as an error", async () => {
    // Supabase returns an obfuscated user with no session so callers cannot
    // enumerate which addresses already exist.
    mockSignUp.mockResolvedValue({
      data: { user: { id: "obfuscated", identities: [] }, session: null },
      error: null,
    });

    const outcome = await signUp(FORM);

    expect(outcome.status).toBe("needs_confirmation");
  });

  it("normalizes email and username before sending them to Supabase", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: "user-1" }, session: { access_token: "t" } },
      error: null,
    });

    await signUp(FORM);

    const payload = mockSignUp.mock.calls[0][0];
    expect(payload.email).toBe("new.user@example.com");
    expect(payload.options.data.username).toBe("newuser");
    expect(payload.options.emailRedirectTo).toContain("://login");
  });

  it("surfaces Supabase errors", async () => {
    mockSignUp.mockResolvedValue({ data: {}, error: { message: "Password too short" } });

    await expect(signUp(FORM)).rejects.toThrow("Password too short");
  });
});

describe("username rules", () => {
  // Must stay in sync with is_username_available() in migration 011 and
  // USERNAME_PATTERN in app/signup.tsx.
  const pattern = /^[a-z0-9_]{3,20}$/;

  it.each(["alex", "alex_tastes", "a1_2", "abc", "a".repeat(20)])("accepts %s", (name) => {
    expect(pattern.test(name)).toBe(true);
  });

  it.each(["ab", "a".repeat(21), "Alex", "alex tastes", "alex-tastes", "alex!", ""])(
    "rejects %s",
    (name) => {
      expect(pattern.test(name)).toBe(false);
    },
  );
});
