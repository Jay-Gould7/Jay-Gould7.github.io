/**
 * The curated list of GitHub projects that surface on /projects.
 *
 * Keep this file tiny — everything else (stars, language, last push,
 * description, demo URL, topics) is pulled from the GitHub API at
 * build time so it stays in sync automatically. Add / remove entries
 * here, commit, and the next build renders the update.
 */

export interface CuratedProject {
  /** `<owner>/<repo>` — the GitHub API key for this card. */
  repo: string;
  /** Promote to the hero slot at the top of the /projects page. */
  highlight?: boolean;
  /** Slug of a post in `src/content/blog/` that is the writeup
   *  for this project. When present the card shows an extra
   *  READ → button that deep-links to the blog entry. */
  writeup?: string;
}

export const PROJECTS: CuratedProject[] = [
  {
    repo: 'Jay-Gould7/InsightMesh',
    highlight: true,
    writeup: 'InsightMesh',
  },
  {
    repo: 'Jay-Gould7/TrustArchive',
    highlight: true,
    writeup: 'TrustArchive',
  },
  {
    repo: 'Jay-Gould7/Yield-Pay',
  },
  {
    repo: 'Jay-Gould7/Jay-Gould7.github.io',
  },
];
