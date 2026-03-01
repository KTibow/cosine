import {
  type Root,
  emflatten,
  findArticle,
  findTitle,
  parseHtml,
  recurse,
  shakeElement,
} from './read-inner';

export default (htmlText: string, hostname: string) => {
  const htmlTree = parseHtml(htmlText);
  const html = htmlTree.find((x) => x.name == 'html') as Root;
  if (!html) throw new Error('No HTML found');

  shakeElement(
    html,
    !hostname.includes('reddit') &&
      !hostname.includes('github') &&
      !hostname.includes('news.ycombinator.com'),
  );

  const entry = findArticle(html);
  if (hostname == 'old.reddit.com') {
    (function read(element: Root, depth: number) {
      // @ts-expect-error custom depth
      element.depth = depth;
      if (element.name == 'div' && element.data.includes('child')) {
        depth++;
      }

      element.contents = element.contents.filter((x) => ('data' in x ? read(x, depth) : true));
      return depth < 2;
    })(entry, 0);
  }

  const flat: Root[] = [];
  emflatten(entry, flat);

  let output = '';
  for (const item of flat) {
    let content = recurse(item);
    content = content.replace(/\s+/g, ' ').trim();
    if (content) {
      if (hostname == 'old.reddit.com') {
        // @ts-expect-error custom depth
        output += '\t'.repeat(item.depth);
      }
      if (item.name == 'h1') output += '\n# ';
      if (item.name == 'h2') output += '\n## ';
      if (item.name == 'h3') output += '\n### ';
      if (item.name == 'li') output += '- ';

      output += content;
      output += '\n';
    }
  }
  output = output.trim();

  if (!output) throw new Error('Empty article');

  return {
    name: findTitle(html),
    content: output,
  };
};
