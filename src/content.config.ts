import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
		}),
});

// Life stories: each markdown file is a photo + caption entry shown
// below the DomeGallery on /life. The `image` field is a plain URL
// string (typically an R2 bucket path) so remote-hosted photos work
// without running through Astro's asset pipeline. The markdown glob
// intentionally skips life-images.ts so the DomeGallery roster stays
// separate from the story collection.
const life = defineCollection({
	loader: glob({ base: './src/content/life', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string().optional(),
		date: z.coerce.date(),
		image: z.string(),
		alt: z.string().optional(),
	}),
});

export const collections = { blog, life };
