import MarkdownIt from "markdown-it";
const md = new MarkdownIt();

export function parseMarkdown(content) {
    const text = content.replace(/!\[.*\]\(.*\)/g, ""); // remove image refs
    return text;
}
