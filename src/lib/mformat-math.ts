import temml from 'temml';

// todo investigate input.includes("align*")
export default (input: string, displayMode: boolean) => {
  try {
    return temml.renderToString(input, {
      displayMode,
      throwOnError: true,
    });
  } catch {}
};
