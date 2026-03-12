export function buildOfflineFileName(gameName: string, suffix: string) {
  const safeName = gameName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');

  return `${safeName}-${suffix}.html`;
}