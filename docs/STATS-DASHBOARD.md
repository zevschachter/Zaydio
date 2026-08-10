# "This helped" stats dashboard (`/stats`)

Private dashboard for the per-post "This helped" counts. Anyone can load the
page; nobody can read the numbers without the token.

## One-time setup in Deno Deploy

`/api/helpful/stats` returns **401 for every request** until the deployment has
an environment variable named `ZAYDIO_STATS_TOKEN`. An unset or empty value is
treated as "no one is authorized" — it never falls back to open access.

1. Deno Deploy → the Zaydio project → **Settings → Environment Variables**
2. Add `ZAYDIO_STATS_TOKEN` with a long random value (a password manager's
   generator is fine). Do not commit the value anywhere in this repo.
3. Redeploy, or wait for the next push to pick it up.

## Using it

Open <https://www.zaydio.com/stats>, paste the same value into the token field,
and load. The token is kept in `sessionStorage` for that tab only, and sent as
`Authorization: Bearer <token>` to `/api/helpful/stats`.

"Wrong token." on the page means the value you pasted and the value in Deno
Deploy don't match — including the case where the variable was never set.

## Rotating

Change the value in Deno Deploy and redeploy. There's nothing else to update:
the token lives only in the environment and in whoever's password manager.
