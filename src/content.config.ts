import { defineCollection, z } from 'astro:content';
import { readdir, readFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import matter from 'gray-matter';

const BLOG_DIR = './src/blogs';

function getGithubToken(): string {
  // CF Pages / CI: set GITHUB_TOKEN in environment variables
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;

  // Local dev: pull from gh CLI
  try {
    return execSync('gh auth token', { stdio: ['pipe', 'pipe', 'pipe'] })
      .toString()
      .trim();
  } catch {
    throw new Error(
      'No GitHub token found. Run `gh auth login` or set GITHUB_TOKEN.'
    );
  }
}

async function renderMarkdown(markdown: string, token: string): Promise<string> {
  const res = await fetch('https://api.github.com/markdown', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({ text: markdown, mode: 'gfm' }),
  });

  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${await res.text()}`);
  }

  return res.text(); // returns rendered HTML
}

const blog = defineCollection({
  loader: async () => {
    const token = getGithubToken();

    const files = (await readdir(BLOG_DIR))
      .filter(f => f.endsWith('.md') || f.endsWith('.mdx'));

    const posts = await Promise.all(
      files.map(async file => {
        const raw = await readFile(join(BLOG_DIR, file), 'utf-8');
        const { data: frontmatter, content } = matter(raw);

        const html = await renderMarkdown(content, token);
        const id = file.replace(/\.mdx?$/, '');

        return { id, ...frontmatter, html };
      })
    );

    // Filter drafts in dev only — build always skips them
    return posts.filter(p =>
      import.meta.env.DEV ? true : !p.draft
    );
  },

  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    html: z.string(),
  }),
});

export const collections = { blog };