/**
 * Build version shown discreetly in the site footer.
 *
 * Set at build time in CI (.github/workflows/deploy-pages.yml) from the
 * merged PR number — e.g. "v78". Falls back to the short commit SHA when
 * no PR number is present, and to "dev" for local builds.
 *
 * Purpose: let anyone confirm at a glance which release is live on
 * https://dgonzamat.github.io/Mercadopublico/ without digging into git.
 */
export const BUILD_VERSION =
  process.env.NEXT_PUBLIC_BUILD_VERSION?.trim() || "dev";
