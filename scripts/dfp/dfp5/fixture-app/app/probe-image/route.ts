const IMAGE_PROBE = `<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2" viewBox="0 0 2 2"><path fill="#e85d3f" d="M0 0h2v2H0z"/></svg>`;

export function GET() {
  return new Response(IMAGE_PROBE, {
    headers: {
      "cache-control": "no-store",
      "content-type": "image/svg+xml",
      "x-dfp5-image-probe": "delivered-bytes.v1",
    },
  });
}
