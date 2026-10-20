import { getCollection } from "astro:content";
import GithubSlugger from "github-slugger";

export const prerender = true;

function stripMarkdown(markdown: string) {
  return markdown
    .replace(/^import\s.+$/gm, " ")
    .replace(/```[a-zA-Z0-9-]*/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/[`*_~|>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sectionsFor(body: string) {
  const lines = body.split("\n");
  const sections: { title: string; lines: string[] }[] = [];
  let current = { title: "Overview", lines: [] as string[] };

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+?)\s*#*\s*$/);
    if (heading) {
      sections.push(current);
      current = { title: heading[1].trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  sections.push(current);

  const slugger = new GithubSlugger();

  return sections
    .map((section) => ({
      id: slugger.slug(section.title),
      title: section.title,
      text: stripMarkdown(section.lines.join("\n")),
    }))
    .filter((section) => section.text.length > 0);
}

export async function GET() {
  const projects = (await getCollection("projects")).sort(
    (a, b) => a.data.number - b.data.number,
  );

  const index = projects.map((project) => ({
    slug: project.id,
    number: project.data.number,
    title: project.data.title,
    description: project.data.description,
    tags: project.data.tags,
    sections: sectionsFor(project.body ?? ""),
  }));

  return new Response(JSON.stringify(index), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
