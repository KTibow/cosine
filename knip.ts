export default {
  entry: ["src/\\(home\\)/index.ts", "src/settings/index.ts", "src/app.css"],
  project: ["src/**"],
  paths: {
    "/lib/*": ["src/lib/*"],
    "/*": ["src/*"],
  },
  compilers: {
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join("\n"),
  },
};
