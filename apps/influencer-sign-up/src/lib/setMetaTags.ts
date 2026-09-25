function setMeta(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaName(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function setFormMetaTags(opts: {
  title: string;
  description: string;
  image?: string;
  logo?: string;
  url: string;
}) {
  document.title = opts.title;

  setMeta('og:title', opts.title);
  setMeta('og:description', opts.description);
  setMeta('og:url', opts.url);
  setMeta('og:type', 'website');

  setMetaName('twitter:card', opts.image ? 'summary_large_image' : 'summary');
  setMetaName('twitter:title', opts.title);
  setMetaName('twitter:description', opts.description);
  setMetaName('description', opts.description);

  if (opts.image) {
    setMeta('og:image', opts.image);
    setMetaName('twitter:image', opts.image);
  }

  if (opts.logo) {
    let icon = document.querySelector('link[data-dynamic-form-logo]') as HTMLLinkElement | null;
    if (!icon) {
      icon = document.createElement('link');
      icon.rel = 'icon';
      icon.setAttribute('data-dynamic-form-logo', 'true');
      document.head.appendChild(icon);
    }
    icon.href = opts.logo;
  }
}

export function resetMetaTags() {
  document.title = 'Physique 57 India';
  const props = ['og:title', 'og:description', 'og:url', 'og:type', 'og:image'];
  props.forEach(p => {
    document.querySelector(`meta[property="${p}"]`)?.remove();
  });
  const names = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'description'];
  names.forEach(n => {
    document.querySelector(`meta[name="${n}"]`)?.remove();
  });
  document.querySelector('link[data-dynamic-form-logo]')?.remove();
}
