export const isHotkey = (e: KeyboardEvent) => {
  const ctrlException = e.key.toLowerCase() == "v" && e.shiftKey;
  if (e.ctrlKey && !ctrlException) return false;
  if (e.metaKey && !ctrlException) return false;
  if (e.altKey) return false;

  const canRefocus =
    e.target == document.body ||
    (e.target instanceof HTMLInputElement && e.target.type == "radio") ||
    (e.target instanceof HTMLInputElement && e.target.type == "checkbox") ||
    e.target instanceof HTMLButtonElement;
  const canRefocusExt = canRefocus || e.target instanceof HTMLAnchorElement;
  const cantRefocus =
    (e.target instanceof HTMLInputElement && !canRefocus) ||
    e.target instanceof HTMLTextAreaElement;

  if (e.key == "Backspace" && !cantRefocus) return true;
  if (/^.$/.test(e.key) && canRefocusExt) return true;
  if (e.key == "Enter" && canRefocus) return true;

  return false;
};
