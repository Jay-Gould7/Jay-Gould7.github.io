/**
 * Build-time GitHub API helper.
 *
 * A single `/repos/:full_name` call returns everything a project
 * card needs: description, language, stars, topics, pushed_at,
 * homepage, html_url. This module *fails soft* — when a repo 404s
 * or the API throttles us the call returns `null`, we log a warning,
 * and the page still builds. The affected card just falls back to
 * the slug we already have locally.
 *
 * Auth: in GitHub Actions `GITHUB_TOKEN` is injected for free and
 * lifts the rate limit from 60 req/h (anon) to 1000 req/h. No extra
 * secrets needed.
 */

export interface RepoMeta {
	full_name: string;
	name: string;
	description: string | null;
	html_url: string;
	homepage: string | null;
	language: string | null;
	stargazers_count: number;
	forks_count: number;
	pushed_at: string;
	topics: string[];
	archived: boolean;
	fork: boolean;
}

const API = 'https://api.github.com';

function authHeaders(): Record<string, string> {
	const token =
		(import.meta as { env?: { GITHUB_TOKEN?: string } }).env?.GITHUB_TOKEN ??
		process.env.GITHUB_TOKEN;
	const base: Record<string, string> = {
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28',
	};
	if (token) base.Authorization = `Bearer ${token}`;
	return base;
}

export async function fetchRepo(fullName: string): Promise<RepoMeta | null> {
	try {
		const res = await fetch(`${API}/repos/${fullName}`, {
			headers: authHeaders(),
		});
		if (!res.ok) {
			console.warn(`[github] ${fullName} -> HTTP ${res.status}`);
			return null;
		}
		const data = await res.json();
		return {
			full_name: data.full_name,
			name: data.name,
			description: data.description,
			html_url: data.html_url,
			homepage: data.homepage,
			language: data.language,
			stargazers_count: data.stargazers_count ?? 0,
			forks_count: data.forks_count ?? 0,
			pushed_at: data.pushed_at,
			topics: Array.isArray(data.topics) ? data.topics : [],
			archived: !!data.archived,
			fork: !!data.fork,
		};
	} catch (err) {
		console.warn(`[github] ${fullName} fetch failed`, err);
		return null;
	}
}
