const express = require('express');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const app = express();
const PORT = 3300;

// Middleware for parsing JSON
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files like `index.html`

// Endpoint to save the invoice as an Excel file
app.post('/save-invoice', (req, res) => {
  const { from, to, total, tax, notes } = req.body;

  if (!from || !to || !total || !tax) {
    return res.status(400).json({ error: 'All required fields must be filled!' });
  }

  // Prepare invoice data for Excel
  const invoiceData = [
    ['Field', 'Value'],
    ['From', from],
    ['To', to],
    ['Total', total],
    ['Tax', tax],
    ['Notes', notes || 'N/A'],
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(invoiceData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoice');

  // Generate file name and path
  const invoiceName = `invoice_${Date.now()}.xlsx`;
  const invoicePath = path.join(__dirname, 'invoices', invoiceName);

  try {
    // Ensure the invoices folder exists
    if (!fs.existsSync(path.join(__dirname, 'invoices'))) {
      fs.mkdirSync(path.join(__dirname, 'invoices'));
    }

    // Save the Excel file
    XLSX.writeFile(workbook, invoicePath);
    res.json({ message: 'Invoice saved!', invoiceName });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save invoice!' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
