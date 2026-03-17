const CAPABILITIES_PATH = '/capabilities';
const DEFAULT_NAVIGATION_DELAY = 100;
const DEFAULT_HEADER_OFFSET = 120;
const SAME_PAGE_SCROLL_DELAY = 100;

export function navigateCapabilityLink({
  link,
  router,
  onBeforeNavigate,
  delay = DEFAULT_NAVIGATION_DELAY,
  headerOffset = DEFAULT_HEADER_OFFSET,
}) {
  if (!link) return;

  onBeforeNavigate?.();

  window.setTimeout(() => {
    if (!link.includes('#')) {
      if (router?.push) {
        router.push(link);
      } else {
        window.location.href = link;
      }
      return;
    }

    const [pathname, hash] = link.split('#');
    const nextPath = pathname || CAPABILITIES_PATH;
    const currentPath = window.location.pathname;

    if (nextPath === CAPABILITIES_PATH && currentPath === CAPABILITIES_PATH) {
      const newUrl = `${CAPABILITIES_PATH}#${hash}`;
      window.history.pushState(null, '', newUrl);
      window.dispatchEvent(new Event('hashchange'));

      window.setTimeout(() => {
        const element = document.getElementById(hash);

        if (!element) return;

        window.scrollTo({
          top: element.offsetTop - headerOffset,
          behavior: 'smooth',
        });
      }, SAME_PAGE_SCROLL_DELAY);

      return;
    }

    if (router?.push) {
      router.push(link);
    } else {
      window.location.href = link;
    }
  }, delay);
}
