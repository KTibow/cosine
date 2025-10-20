export const getYTId = (url: string) =>
  url.match(/youtu(?:.+v\=|.+shorts\/|.+embed\/|\.be\/)([A-Za-z0-9_-]{11})/)?.[1];
