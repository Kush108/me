import { Job } from "@/types/job";
import { JobFeed } from "@/lib/jobSources";
import crypto from "crypto";

export async function parseRssFeed(
  xml: string,
  feed: JobFeed
): Promise<Partial<Job>[]> {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

  return items
    .map((item) => {
      const get = (tag: string) => {
        const match = item.match(
          new RegExp(
            `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`
          )
        );
        return (match?.[1] || match?.[2] || "").trim();
      };

      const title = get("title");
      const url = get("link") || get("guid");
      const description = get("description");
      const pubDate = get("pubDate");

      const company = feed.name.includes("Indeed")
        ? (title.match(/- (.+)$/) || [])[1] || feed.name
        : feed.name;

      const cleanTitle = title.replace(/\s*-\s*.+$/, "").trim();

      return {
        id: crypto.createHash("md5").update(url).digest("hex"),
        title: cleanTitle,
        company,
        location: extractLocation(title + " " + description) || "See posting",
        description: stripHtml(description),
        url,
        source: feed.id,
        sourceName: feed.name,
        postedDate: pubDate
          ? new Date(pubDate).toISOString()
          : new Date().toISOString(),
        status: "new" as const,
        matchScore: 0,
        matchReasons: [],
      };
    })
    .filter((j) => j.title && j.url);
}

function extractLocation(text: string): string {
  const match = text.match(
    /\b(Edmonton|Calgary|Alberta|Remote|Vancouver|Toronto|Ottawa|Hybrid)\b/i
  );
  return match?.[0] || "";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
