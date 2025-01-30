const fs = require('fs');
const XLSX = require('xlsx');

// Path to the .xlsx file
const filePath = './invoices/example.xlsx';

// Read the file using fs
const fileBuffer = fs.readFileSync(filePath);

// Parse the file using xlsx
const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

// Access the first sheet
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert the sheet data to JSON
const data = XLSX.utils.sheet_to_json(worksheet, { defval: "" }); // defval: "" prevents undefined cells

// Function to check if 'Total' is present in any cell
function containsKeyword(keyword, data) {
  for (const row of data) {
    for (const cellValue of Object.values(row)) {
      if (String(cellValue).toLowerCase().includes(keyword.toLowerCase())) {
        return true;
      }
    }
  }
  return false;
}
console.log(data)
// Check for 'Total'
const keyword = 'Total';
if (containsKeyword(keyword, data)) {
  console.log(`The keyword '${keyword}' is present in the data.`);
} else {
  console.log(`The keyword '${keyword}' is not found in the data.`);
}
