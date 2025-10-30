export const isHotkey = (e: KeyboardEvent) => {
  if (e.ctrlKey) return false;
  if (e.altKey) return false;

  const canRefocus =
    e.target == document.body ||
    (e.target instanceof HTMLInputElement && e.target.type == "radio") ||
    (e.target instanceof HTMLInputElement && e.target.type == "checkbox") ||
    e.target instanceof HTMLButtonElement;
  const canRefocusExt = canRefocus || e.target instanceof HTMLAnchorElement;

  if (canRefocusExt) {
    if (e.key == "Enter" && canRefocus) return true;
    if (e.key == "Backspace") return true;
    if (/^.$/.test(e.key)) {
      return true;
    }
  }

  return false;
};
