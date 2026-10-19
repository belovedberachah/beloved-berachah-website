const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// This script lives in tools/pdf/, so the site root is two levels up.
const siteRoot = path.join(__dirname, '..', '..');
const resourceDir = path.join(siteRoot, 'assets', 'resources');

// Output goes to tools/pdf/out/ so the live PDFs are never overwritten by accident.
// Copy files into assets/resources/ only after they've been checked.
const outDir = path.join(__dirname, 'out');

const files = [
  { html: 'doc-1-trauma.html', pdf: 'understanding-trauma.pdf' },
  { html: 'doc-2-space.html', pdf: 'church-preparation-guide.pdf' },
  { html: 'doc-3-mentoring.html', pdf: 'mentoring-framework.pdf' },
  { html: 'doc-4-worksheets.html', pdf: 'session-worksheets.pdf' },
];

(async () => {
  console.log('Starting PDF generation...');
  fs.mkdirSync(outDir, { recursive: true });

  // Puppeteer is only used locally. The Netlify build never installs it.
  const puppeteer = (await import('puppeteer')).default;
  const browser = await puppeteer.launch();

  try {
    const page = await browser.newPage();

    for (const file of files) {
      const htmlUrl = pathToFileURL(path.join(resourceDir, file.html)).href;
      const pdfPath = path.join(outDir, file.pdf);

      await page.goto(htmlUrl, { waitUntil: 'networkidle0' });
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });
      console.log(`Generated: ${pdfPath}`);
    }

    console.log('All 4 documents generated in tools/pdf/out. Check them before copying.');
  } finally {
    await browser.close();
  }
})();