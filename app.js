const fs = require('fs');
const { generateCopies } = require('./data/mapper');
const generatePDF = require('./pdf/generate');

const template = fs.readFileSync('./template/lr_template.html', 'utf8');

const data = require('./data/sample.json');

const finalHTML = generateCopies(template, data);

generatePDF(finalHTML);
