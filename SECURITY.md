# Security

## Admin panel

The portfolio's admin panel is intentionally a client-side GitHub CMS because the public site is served by GitHub Pages.

Security requirements:
- Never store a GitHub token, password, client secret, or private key in frontend JavaScript.
- GitHub authorization is interactive and the resulting access token is kept only in memory for the current page session.
- The panel verifies the authenticated GitHub username and repository write permission before loading or saving content.
- The panel only writes the allow-listed `data.js` path in the configured repository.

## Credential incident

A previously published admin JavaScript file contained a hardcoded GitHub credential and an admin password. The current version removes both from the client code.

Revocation/rotation is still required for every credential that was previously exposed. Removing a credential from the current file does not invalidate historical Git objects. Review the repository history and revoke the old GitHub credential from GitHub account settings.

## Production testing

Do not run destructive, high-volume, or denial-of-service tests against the live site. Use test accounts and test data where possible.
