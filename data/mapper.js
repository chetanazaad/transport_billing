const path = require('path');
const fs = require('fs');

/**
 * Convert a file to a base64 data URI.
 * This guarantees images render in Puppeteer regardless of file path issues.
 */
function fileToDataURI(filePath) {
  const absolutePath = path.resolve(filePath);
  const fileBuffer = fs.readFileSync(absolutePath);
  const base64 = fileBuffer.toString('base64');
  const ext = path.extname(absolutePath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${base64}`;
}

/**
 * Inject data placeholders into a template string.
 * Replaces all {{key}} patterns with corresponding values from data.
 * Embeds logo and signature as base64 data URIs for guaranteed rendering.
 */
function injectData(template, data) {
  let output = template;

  // Embed assets as base64 data URIs (guaranteed to work in Puppeteer)
  const logoPath = fileToDataURI(path.join(__dirname, '../assets/logo.png'));
  const signPath = fileToDataURI(path.join(__dirname, '../assets/signature.png'));

  // Merge asset paths and current date into data
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  const generationDate = `${day}-${month}-${year}`;

  const fullData = {
    ...data,
    logoPath: logoPath,
    signPath: signPath,
    generation_date: generationDate
  };

  // Replace all {{key}} placeholders
  for (let key in fullData) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    output = output.replace(regex, fullData[key] || '');
  }

  // Remove any remaining unreplaced placeholders (safety net)
  output = output.replace(/\{\{[a-zA-Z_]+\}\}/g, '');

  return output;
}

/**
 * Generate multi-page HTML output with separate copies.
 * requestedCopies is an array of labels (e.g. ['CONSIGNEE COPY', 'TRUCK COPY']).
 * If requestedCopies is empty or null, it generates a single "MASTER" version (no label).
 */
function generateCopies(template, data, requestedCopies = []) {
  // If no specific copies requested, generate one master copy with no label
  const copiesToGenerate = (requestedCopies && requestedCopies.length > 0) 
    ? requestedCopies.map(label => ({ label }))
    : [{ label: '' }];

  // Extract the <head> content (CSS styles)
  const headMatch = template.match(/<head[^>]*>([\s\S]*)<\/head>/i);
  const headContent = headMatch ? headMatch[1] : '';

  // Build the combined body from all copies
  let bodyContent = '';

  copiesToGenerate.forEach((copy) => {
    // Clone the template for each copy
    let temp = template;

    // Inject the copy label first
    temp = temp.replace(/\{\{copy_label\}\}/g, copy.label);

    // Inject all data fields
    temp = injectData(temp, data);

    // Extract just the body content
    const bodyMatch = temp.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) {
      bodyContent += bodyMatch[1];
    }
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  ${headContent}
</head>
<body style="margin:0; padding:0;">
${bodyContent}
</body>
</html>`;
}

module.exports = { injectData, generateCopies };
