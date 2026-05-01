const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

/**
 * Generate a pixel-perfect A4 PDF from HTML content using Puppeteer.
 * Writes HTML to a temp file (so relative asset paths resolve correctly),
 * then renders it into an A4 PDF with no margins.
 */
async function generatePDF(htmlContent) {
  // Ensure output directory exists
  const outputDir = path.join(__dirname, '../output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write HTML to a temp file in the project root so assets resolve
  const tempHtmlPath = path.join(__dirname, `../temp_${Date.now()}.html`);
  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Navigate to the temp HTML file
  await page.goto(`file:///${tempHtmlPath.replace(/\\/g, '/')}`, {
    waitUntil: 'networkidle0',
    timeout: 30000
  });

  // Generate the PDF
  const timestamp = Date.now();
  const filePath = path.join(outputDir, `LR_${timestamp}.pdf`);

  await page.pdf({
    path: filePath,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    preferCSSPageSize: true
  });

  await browser.close();

  // Cleanup temp HTML file
  try {
    fs.unlinkSync(tempHtmlPath);
  } catch (e) {
    // Ignore cleanup errors
  }

  console.log(`PDF generated: ${filePath}`);
  return filePath;
}

module.exports = generatePDF;
