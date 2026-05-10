
export function buildTitle(title?: string) {
  const appName = 'Lumi AI Editor';
  return title ? `${title} | ${appName}` : appName;
}
