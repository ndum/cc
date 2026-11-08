/**
 * The commit the site is built from, for the footer of every page. A pull request on GitHub builds a
 * merge commit of its own, so the preview passes the head of the branch in CC_COMMIT instead.
 */
import { execFileSync } from 'node:child_process';

function git(...args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

const sha = process.env.CC_COMMIT || git('rev-parse', 'HEAD');
// A shallow checkout of a pull request may lack the head commit, the footer then shows no date
const date = sha ? git('show', '-s', '--format=%cs', sha) : '';

export const commit = { sha, short: sha.slice(0, 7), date };
