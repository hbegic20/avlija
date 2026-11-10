import { bs } from "@/lib/i18n/bs";
import { listingsBasePath } from "@/lib/search/filters";

export function goneResponseBody(): string {
  const text = bs.detail;
  return `<!doctype html><html lang="bs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${text.goneTitle} | ${bs.site.name}</title></head><body style="margin:0;background:#F3EEE3;color:#1F2421;font-family:Georgia,serif"><main style="max-width:640px;margin:0 auto;padding:64px 16px"><p style="border-top:2px solid #1F2421;padding-top:12px;font-family:ui-monospace,monospace;font-size:12px;letter-spacing:.08em;color:#5A5F57">410</p><h1 style="font-size:40px;font-weight:500;margin:12px 0">${text.goneTitle}</h1><p style="font-family:system-ui,sans-serif;color:#5A5F57">${text.goneText}</p><p style="font-family:system-ui,sans-serif"><a href="${listingsBasePath}" style="color:#2F4A3A">${text.goneAction}</a></p></main></body></html>`;
}
