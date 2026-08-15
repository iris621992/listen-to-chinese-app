# Supabase public configuration contract

The browser and non-privileged server client use only:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` name is not part of the application
configuration contract and is not accepted as a fallback.

Publishable keys are opaque, so their exact project pairing cannot be derived
from source text; PMD-5/PMD-7 must bind and verify the pair without recording it.

Placeholders in `.env.example` are intentionally empty. Never put real key values,
database passwords, connection strings, access tokens, `service_role`, or secret
keys in source, documentation, pull requests, logs, or browser-visible variables.
