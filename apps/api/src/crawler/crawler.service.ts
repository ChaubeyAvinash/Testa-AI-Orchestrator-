import { Injectable, Logger } from '@nestjs/common';
import { chromium } from 'playwright';

export interface PageInfo {
  url: string;
  title: string;
  forms: FormInfo[];
  buttons: string[];
  inputs: InputInfo[];
  links: string[];
}

export interface FormInfo {
  action?: string;
  method?: string;
  inputs: string[];
}

export interface InputInfo {
  type: string;
  name?: string;
  placeholder?: string;
}

export interface CrawlResult {
  baseUrl: string;
  pages: PageInfo[];
}

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  async crawl(
    baseUrl: string,
    maxPages: number = parseInt(process.env.CRAWLER_MAX_PAGES || '20'),
    onProgress?: (pagesFound: number, currentUrl: string) => void,
  ): Promise<CrawlResult> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'TESTA-Bot/1.0 (AI Test Orchestrator)',
    });

    const visited = new Set<string>();
    const queue: string[] = [baseUrl];
    const pages: PageInfo[] = [];

    try {
      const base = new URL(baseUrl);

      while (queue.length > 0 && pages.length < maxPages) {
        const url = queue.shift()!;
        if (visited.has(url)) continue;
        visited.add(url);

        this.logger.log(`Crawling: ${url}`);
        onProgress?.(pages.length, url);

        try {
          const page = await context.newPage();
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

          const info = await page.evaluate(() => {
            const forms: any[] = [];
            document.querySelectorAll('form').forEach((f) => {
              const inputs: string[] = [];
              f.querySelectorAll('input,select,textarea').forEach((i: any) => {
                inputs.push(i.name || i.type || 'unknown');
              });
              forms.push({ action: f.action, method: f.method, inputs });
            });

            const buttons: string[] = [];
            document.querySelectorAll('button,input[type="submit"]').forEach((b: any) => {
              buttons.push(b.textContent?.trim() || b.value || 'button');
            });

            const inputs: any[] = [];
            document.querySelectorAll('input,textarea,select').forEach((i: any) => {
              inputs.push({ type: i.type || 'text', name: i.name, placeholder: i.placeholder });
            });

            const links: string[] = [];
            document.querySelectorAll('a[href]').forEach((a: any) => {
              if (a.href) links.push(a.href);
            });

            return {
              title: document.title,
              forms,
              buttons: buttons.slice(0, 20),
              inputs: inputs.slice(0, 30),
              links,
            };
          });

          pages.push({
            url,
            title: info.title,
            forms: info.forms,
            buttons: info.buttons,
            inputs: info.inputs,
            links: info.links,
          });

          // Enqueue same-origin links
          for (const link of info.links) {
            try {
              const linkUrl = new URL(link);
              if (linkUrl.origin === base.origin && !visited.has(linkUrl.href)) {
                const clean = linkUrl.origin + linkUrl.pathname;
                if (!visited.has(clean) && !queue.includes(clean)) {
                  queue.push(clean);
                }
              }
            } catch {
              // skip malformed URLs
            }
          }

          await page.close();
        } catch (err) {
          this.logger.warn(`Failed to crawl ${url}: ${err}`);
        }
      }
    } finally {
      await browser.close();
    }

    return { baseUrl, pages };
  }
}
