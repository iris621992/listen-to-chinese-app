import { createServerAuthClient } from "@/lib/supabase/authServer";

export type LearnerIdentity = Readonly<{
  userId: string;
  email: string | null;
}>;

export class LearnerAuthenticationError extends Error {
  constructor() {
    super("Authenticated learner session required.");
    this.name = "LearnerAuthenticationError";
  }
}

export async function getLearnerIdentity(): Promise<LearnerIdentity | null> {
  try {
    const supabase = await createServerAuthClient();
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    if (claimsError || !claimsData?.claims) {
      return null;
    }

    const userId =
      typeof claimsData.claims.sub === "string"
        ? claimsData.claims.sub
        : null;

    if (!userId) {
      return null;
    }

    const email =
      typeof claimsData.claims.email === "string"
        ? claimsData.claims.email
        : null;

    return {
      userId,
      email,
    };
  } catch {
    return null;
  }
}

export async function requireLearner(): Promise<LearnerIdentity> {
  const identity = await getLearnerIdentity();

  if (!identity) {
    throw new LearnerAuthenticationError();
  }

  return identity;
}
