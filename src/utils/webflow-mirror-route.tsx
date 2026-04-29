import * as React from 'react';
import { useLoaderData } from 'react-router';
import type { LoaderFunctionArgs, MetaDescriptor } from 'react-router';

const LIVE_ORIGIN = 'https://openhands.dev';
const HEIGHT_MESSAGE = 'webflow-mirror:height';
const NAV_MESSAGE = 'webflow-mirror:navigate';

function extractTag(html: string, tagName: string) {
  const match = html.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match?.[1]?.trim() || '';
}

function extractMetaDescription(html: string) {
  const match = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i);
  return match?.[1]?.trim() || '';
}

function buildInjectedScript(pathname: string) {
  return `
<script>
(() => {
  const PATHNAME = ${JSON.stringify(pathname)};
  const HEIGHT_MESSAGE = ${JSON.stringify(HEIGHT_MESSAGE)};
  const NAV_MESSAGE = ${JSON.stringify(NAV_MESSAGE)};
  const LIVE_ORIGIN = ${JSON.stringify(LIVE_ORIGIN)};

  const sendHeight = () => {
    const root = document.documentElement;
    const body = document.body;
    const height = Math.max(
      root ? root.scrollHeight : 0,
      body ? body.scrollHeight : 0,
      root ? root.offsetHeight : 0,
      body ? body.offsetHeight : 0,
      window.innerHeight || 0,
    );
    parent.postMessage({ type: HEIGHT_MESSAGE, pathname: PATHNAME, height }, '*');
  };

  window.addEventListener('load', () => {
    sendHeight();
    setTimeout(sendHeight, 250);
    setTimeout(sendHeight, 1000);
  });

  window.addEventListener('resize', sendHeight);
  document.addEventListener('DOMContentLoaded', sendHeight);

  if ('ResizeObserver' in window && document.body) {
    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);
  } else {
    setInterval(sendHeight, 1000);
  }

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest('a[href]');
    if (!anchor) return;
    if (anchor.target && anchor.target !== '_self') return;

    try {
      const nextUrl = new URL(anchor.href, LIVE_ORIGIN);
      if (nextUrl.origin !== LIVE_ORIGIN) return;
      event.preventDefault();
      parent.postMessage(
        {
          type: NAV_MESSAGE,
          pathname: nextUrl.pathname + nextUrl.search + nextUrl.hash,
        },
        '*',
      );
    } catch {}
  });
})();
<\/script>`;
}

function rewriteHtml(html: string, pathname: string) {
  const baseTag = `<base href="${LIVE_ORIGIN}">`;
  const injectedScript = buildInjectedScript(pathname);

  let nextHtml = html;
  if (/<head[^>]*>/i.test(nextHtml)) {
    nextHtml = nextHtml.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
  }
  if (/<\/body>/i.test(nextHtml)) {
    nextHtml = nextHtml.replace(/<\/body>/i, `${injectedScript}</body>`);
  } else {
    nextHtml += injectedScript;
  }

  return nextHtml;
}

export type WebflowMirrorData = {
  isWebflowMirror: true;
  pathname: string;
  title: string;
  description: string;
  html: string;
};

export const handle = {
  hideChrome: true,
};

export async function loadWebflowMirrorData(request: Request): Promise<WebflowMirrorData> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const remoteUrl = `${LIVE_ORIGIN}${pathname}${url.search}`;
  const response = await fetch(remoteUrl);

  if (!response.ok) {
    throw new Response('Failed to load mirrored page', { status: response.status });
  }

  const html = await response.text();
  const title = extractTag(html, 'title');
  const description = extractMetaDescription(html);

  return {
    isWebflowMirror: true,
    pathname,
    title,
    description,
    html: rewriteHtml(html, pathname),
  };
}

export async function loader({ request }: LoaderFunctionArgs) {
  return loadWebflowMirrorData(request);
}

export function buildMirrorMeta(data?: { title?: string; description?: string }): MetaDescriptor[] {
  if (!data) return [];
  return [
    ...(data.title ? [{ title: data.title }] : []),
    ...(data.description ? [{ name: 'description', content: data.description }] : []),
  ];
}

export function meta({ data }: { data?: { title?: string; description?: string } }): MetaDescriptor[] {
  return buildMirrorMeta(data);
}

export function WebflowMirrorFrame({ html, pathname }: WebflowMirrorData) {
  const [height, setHeight] = React.useState(1200);

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;

      if (
        event.data.type === HEIGHT_MESSAGE &&
        event.data.pathname === pathname &&
        typeof event.data.height === 'number'
      ) {
        setHeight(Math.max(900, Math.ceil(event.data.height)));
      }

      if (
        event.data.type === NAV_MESSAGE &&
        typeof event.data.pathname === 'string'
      ) {
        window.location.assign(event.data.pathname);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [pathname]);

  return (
    <iframe
      data-webflow-mirror
      title={`Webflow mirror ${pathname}`}
      srcDoc={html}
      className='block w-full border-0 bg-transparent'
      style={{ minHeight: `${height}px`, height: `${height}px` }}
    />
  );
}

export default function WebflowMirrorRoute() {
  const data = useLoaderData<typeof loader>();
  return <WebflowMirrorFrame {...data} />;
}

