export type Root = { name: string; data: string; contents: ElementPart[] };
type ElementPart = { name: '#text'; contents: string } | Root;

const NON_ARTICLE_ELEMENTS = ['aside', 'nav', 'header', 'footer', 'style'];
const NON_ARTICLE_ROLES = [
  'menu',
  'menubar',
  'complementary',
  'navigation',
  'banner',
  'alert',
  'alertdialog',
  'dialog',
];
const GOVERNMENT_APPROVAL = (e: Root) => {
  if (['h1', 'h2', 'h3', 'p', 'blockquote', 'li', 'pre'].includes(e.name)) {
    return true;
  }
  if (e.name == 'div' && e.data.includes('nyt-imperial')) {
    return true;
  }
  return false;
};

const recursiveFind = (element: Root, filter: (item: Root) => boolean): Root | undefined => {
  if (filter(element)) return element;
  for (const item of element.contents) {
    if (item.name != '#text') {
      const article = recursiveFind(item as Root, filter);
      if (article) return article;
    }
  }
};

const replaceEscape = (text: string) =>
  text
    .replace(/&#([0-9]+);/gi, (_, code) => String.fromCharCode(code))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&quot;', `"`)
    .replaceAll('&ldquo;', `"`)
    .replaceAll('&rdquo;', `"`)
    .replaceAll('&lsquo;', `'`)
    .replaceAll('&rsquo;', `'`)
    .replaceAll('&mdash;', '-')
    .replaceAll('&copy;', '©')
    .replaceAll('&pound;', '£')
    .replaceAll('&oslash;', 'ø')
    .replaceAll('&aring;', 'å')
    .replaceAll('&amp;', '&');

export const parseHtml = (html: string) => {
  const tags = /<\/?([a-z0-9]+)(?:[^>"']|"[^"]*"|'[^']*')*>/g;
  const doctypeRegex = /<!DOCTYPE(?:[^>"']|"[^"]*"|'[^']*')*>/i;
  const selfClosingTags =
    /^(area|base|br|col|embed|hr|img|input|link|meta|param|path|source|track|wbr)$/i;

  let match;
  // this works by creating elements on the stack
  // then the first one ends up referencing all of them
  let stack: [{ name: string; contents: ElementPart[] }, ...Root[]] = [
    { name: 'root', contents: [] },
  ];
  let lastTextIndex = 0;
  let insideScript = false;

  while ((match = tags.exec(html))) {
    const [fullMatch, tagName] = match;
    const isClosing = fullMatch[1] === '/';
    const isSelfClosing = selfClosingTags.test(tagName) || fullMatch.at(-2) === '/';

    if (tagName == 'script' && !isClosing) {
      insideScript = true;
      continue;
    }
    if (tagName == 'script' && isClosing) {
      insideScript = false;
      const text = html.slice(lastTextIndex, match.index);
      if (text && text.trim()) {
        stack[stack.length - 1].contents.push({
          name: '#text',
          contents: text,
        });
      }
      lastTextIndex = tags.lastIndex;
      continue;
    }
    if (insideScript) {
      continue;
    }

    if (match.index > lastTextIndex) {
      const text = html.slice(lastTextIndex, match.index);
      if (text && text.trim()) {
        stack[stack.length - 1].contents.push({
          name: '#text',
          contents: text,
        });
      }
    }

    if (isClosing) {
      const opener = stack.findLastIndex((item) => item.name == tagName);
      if (opener != -1) stack = stack.slice(0, opener) as typeof stack;
    } else {
      if (stack[stack.length - 1].name == 'p' && tagName == 'p') {
        stack.pop();
      }

      const newTag = {
        name: tagName,
        data: fullMatch.slice(1, -1),
        contents: [],
      };
      stack[stack.length - 1].contents.push(newTag);
      if (!isSelfClosing && !doctypeRegex.test(fullMatch)) {
        stack.push(newTag);
      }
    }

    lastTextIndex = tags.lastIndex;
  }

  if (lastTextIndex < html.length) {
    const text = html.slice(lastTextIndex).trim();
    if (text) {
      stack[stack.length - 1].contents.push({ name: '#text', contents: text });
    }
  }

  return stack[0].contents;
};

export const shakeElement = (element: Root, isNews: boolean) => {
  element.contents = element.contents
    .map((item) => {
      if (item.name == '#text') return item;

      const _item = item as Root;
      if (_item.data.includes('aolhomepage')) return item;

      if (
        _item.name != 'body' &&
        (NON_ARTICLE_ELEMENTS.includes(_item.name) ||
          NON_ARTICLE_ROLES.some((x) => _item.data.includes(`role="${x}"`)) ||
          (isNews && _item.data.includes('comment')) ||
          (!isNews && _item.data.includes('numchildren')) ||
          (!isNews && _item.data.includes('userattrs')) ||
          _item.data.includes('button') ||
          _item.data.includes('display:none') ||
          _item.data.includes('elementor-widget-posts') ||
          _item.data.includes('enlarge') ||
          _item.data.includes('expand') ||
          _item.data.includes('infobar') ||
          _item.data.includes('more-about-container') ||
          _item.data.includes('newsletter-form') ||
          _item.data.includes('openWeb-wrapper') ||
          _item.data.includes('popular-box') ||
          _item.data.includes('share') ||
          _item.data.includes('score dislikes') ||
          _item.data.includes('score likes') ||
          _item.data.includes('tags') ||
          _item.data.includes('tools'))
      ) {
        return undefined;
      }

      shakeElement(_item, isNews);
      return item;
    })
    .filter((item): item is Root => Boolean(item));
};

export const findTitle = (html: Root) => {
  const try1 = recursiveFind(html, (item) => item.name == 'title');
  const title = try1!.contents.find(
    (item): item is { name: '#text'; contents: string } => item.name == '#text',
  );
  const contents = title!.contents;
  return replaceEscape(contents);
};

export const findArticle = (html: Root) => {
  const search = (check: (item: Root) => boolean) => {
    return recursiveFind(
      html,
      (item) =>
        check(item) &&
        item.data != 'article class="media media--type-image media--view-mode-article-image"' &&
        item.data !=
          'article class="media media--type-image media--view-mode-article-super-featured-update-headshot"' &&
        item.data !=
          'article class="align-center media media--type-image media--view-mode-embedded"',
    );
  };
  const try0 = search((item) => item.name == 'article' && item.data.includes(`role="article"`));
  if (try0) return try0;

  const try1 = search((item) => item.name == 'article');
  if (try1) return try1;

  const try2 = search((item) => item.data.includes(`role="article"`));
  if (try2) return try2;

  const try3 = search((item) => item.data.includes(`role="main"`));
  if (try3) return try3;

  const try4 = search((item) => item.data.includes(`id="story-body"`));
  if (try4) return try4;

  const try5 = search((item) => item.name == 'body');
  if (try5) return try5;

  return html;
};

export const emflatten = (element: Root, output: Root[]) => {
  if (GOVERNMENT_APPROVAL(element)) {
    output.push(element);
  } else {
    for (const item of element.contents) {
      if (item.name != '#text') {
        emflatten(item as Root, output);
      }
      if (
        item.name == '#text' &&
        (element.data.includes(`div class="toptext`) ||
          element.data.includes(`div class="commtext`))
      ) {
        output.push({ name: 'p', data: '', contents: [item] });
      }
    }
  }
};

export const recurse = (element: Root) => {
  let content = '';
  for (const item of element.contents) {
    if (item.name == '#text') {
      content += replaceEscape((item as { contents: string }).contents);
    } else {
      content += recurse(item as Root);
    }
  }
  return content;
};
