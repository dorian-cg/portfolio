/** Opens `url` in a new tab, without giving the page access to this one. */
export function openLink(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}
