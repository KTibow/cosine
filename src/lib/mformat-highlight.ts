import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import hljs from "highlight.js/lib/core";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import latex from "highlight.js/lib/languages/latex";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import { escape } from "./mformat-escape";
import "./mformat-highlight.css";

for (const [k, v] of Object.entries({
  c,
  cpp,
  java,
  javascript,
  json,
  markdown,
  python,
  svelte: xml,
  latex,
  typescript,
  xml,
})) {
  hljs.registerLanguage(k, v);
}

export default (code: string, language: string) => {
  try {
    if (language) {
      return hljs.highlight(code, { language, ignoreIllegals: true }).value;
    }
  } catch {}
  return escape(code);
};
