import hljs from "highlight.js/lib/core";
import xml from "highlight.js/lib/languages/xml";
import markdown from "highlight.js/lib/languages/markdown";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import java from "highlight.js/lib/languages/java";
import python from "highlight.js/lib/languages/python";
import cpp from "highlight.js/lib/languages/cpp";
import json from "highlight.js/lib/languages/json";
import { escape } from "./mformat-escape";
import "./mformat-highlight.css";

for (const [k, v] of Object.entries({
  svelte: xml,
  xml,
  markdown,
  javascript,
  typescript,
  java,
  python,
  cpp,
  json,
})) {
  hljs.registerLanguage(k, v);
}

export default (input: string, language: string) => {
  try {
    if (language) {
      return hljs.highlight(input, { language, ignoreIllegals: true }).value;
    }
  } catch {}
  return escape(input);
};
