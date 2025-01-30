const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const tesseract = require('tesseract.js');
const XLSX = require('xlsx');
const { Translate } = require('@google-cloud/translate').v2;

// Initialize Google Translate
const translate = new Translate();

// Regular expressions for extracting fields
const amountRegex = /(?:total|amount|due)\s*[:\-\s]*\$?(\d+[,\d]*\.?\d*)/i;
const taxRegex = /(?:tax|vat|taxes)\s*[:\-\s]*\$?(\d+[,\d]*\.?\d*)/i;
const senderRegex = /(?:from|sender|supplier)\s*[:\-\s]*([A-Za-z\s,]+)/i;
const recipientRegex = /(?:to|recipient|bill\s*to)\s*[:\-\s]*([A-Za-z\s,]+)/i;

// Function to extract text from PDF
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const { text } = await pdfParse(dataBuffer);
    return text;
  } catch (error) {
    throw new Error(`Error reading PDF: ${error.message}`);
  }
}

// Function to extract text from image using OCR
async function extractTextFromImage(imagePath) {
  try {
    const { data: { text } } = await tesseract.recognize(imagePath, 'eng', {
      logger: (m) => console.log(m),
    });
    return text;
  } catch (error) {
    throw new Error(`Error processing image: ${error.message}`);
  }
}

// Function to extract data from Excel files
function extractTextFromExcel(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    let extractedText = '';

    sheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      rows.forEach((row) => {
        extractedText += row.join(' ') + '\n';
      });
    });

    return extractedText;
  } catch (error) {
    console.error(`Error reading Excel file: ${filePath}`, error);
    return '';
  }
}

// Google Translate function
async function translateText(text, targetLanguage = 'en') {
  try {
    const [translation] = await translate.translate(text, targetLanguage);
    return translation;
  } catch (error) {
    console.error(`Error translating text: ${error.message}`);
    return text; // Fallback to the original text if translation fails
  }
}

// Function to extract fields from text using regex
function extractFields(text) {
  const fields = {};

  const amountMatch = text.match(amountRegex);
  if (amountMatch) fields.amount = amountMatch[1];

  const taxMatch = text.match(taxRegex);
  if (taxMatch) fields.tax = taxMatch[1];

  const senderMatch = text.match(senderRegex);
  if (senderMatch) fields.sender = senderMatch[1].trim();

  const recipientMatch = text.match(recipientRegex);
  if (recipientMatch) fields.recipient = recipientMatch[1].trim();

  return fields;
}

// Function to save extracted data to an Excel file
function saveToExcel(data, outputFilePath) {
  const resultData = [
    ['Invoice Name', 'Sender', 'Recipient', 'Amount', 'Tax'],
    ...data.map((invoice) => [
      invoice.name,
      invoice.sender || 'N/A',
      invoice.recipient || 'N/A',
      invoice.amount || 'N/A',
      invoice.tax || 'N/A',
    ]),
    ['', '', '', '', ''],
    ['', '', '', '', 'Made by - Death by Coding'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(resultData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Extracted Data');

  XLSX.writeFile(wb, outputFilePath);
}

// Function to process all invoices in a folder
async function processInvoices(inputFolder, outputFilePath) {
  const files = fs.readdirSync(inputFolder);
  let invoiceData = [];

  for (const file of files) {
    const filePath = path.join(inputFolder, file);
    let extractedText = '';

    try {
      if (file.endsWith('.pdf')) {
        extractedText = await extractTextFromPDF(filePath);
      } else if (file.endsWith('.jpg') || file.endsWith('.png')) {
        extractedText = await extractTextFromImage(filePath);
      } else if (file.endsWith('.xlsx')) {
        extractedText = extractTextFromExcel(filePath);
      }

      if (!extractedText) {
        console.log(`No text extracted from ${file}`);
        continue;
      }

      // Translate extracted text to English
      const translatedText = await translateText(extractedText, 'en');

      // Extract fields from translated text
      const fields = extractFields(translatedText);
      invoiceData.push({ name: file, ...fields });
    } catch (error) {
      console.error(`Error processing file ${file}: ${error.message}`);
      continue;
    }
  }

  if (invoiceData.length > 0) {
    saveToExcel(invoiceData, outputFilePath);
    console.log('Invoices processed and saved!');
  } else {
    console.log('No data to save.');
  }
}

// Example usage
const inputFolder = './invoices'; // Path to the folder containing invoices
const outputFilePath = './output/invoice_data.xlsx'; // Path to save the processed data

processInvoices(inputFolder, outputFilePath);
