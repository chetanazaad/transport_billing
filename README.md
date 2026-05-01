# VAARAHI ROAD LINE'S — LR Bill Generator

A pixel-perfect, automated Lorry Receipt (LR) Bill generator built with Node.js, Express, and Puppeteer. This system allows you to easily generate, download, and archive different copies of Lorry Receipts (Consignee, Consignor, Truck, Office, and Main) as high-quality PDF documents.

## Features

- **Selective PDF Generation**: Instantly generate a single-page PDF for specific copies (e.g., Consignor Copy) or a clean Main Copy.
- **Pixel-Perfect A4 Layout**: Uses Puppeteer to render a precise, print-ready A4 layout.
- **Automated LR Numbering**: Keeps track of your LR number sequence locally via an SQLite database.
- **Historical Archiving**: Automatically archives the master copy of every generated bill into the database for future reference.
- **Responsive UI**: A modern, dark-themed dashboard to easily input routing, party, and goods details.
- **Dynamic Tax Calculation**: Calculates SGST, CGST, and IGST dynamically based on freight amounts.

## Prerequisites

- **Node.js** (v16.x or higher recommended)
- **npm** (Node Package Manager)

*Note for VPS Deployment (Linux):* Puppeteer requires several system-level dependencies to run headless Chrome. On Ubuntu/Debian, you will typically need to install libraries like `libnss3`, `libxss1`, `libasound2`, etc. (See deployment instructions below).

## Installation

1. Clone or copy the project folder to your machine/server.
2. Navigate to the project directory:
   ```bash
   cd bill_printer
   ```
3. Install the required Node.js packages:
   ```bash
   npm install
   ```

## Running Locally

To start the server for local development or usage:

```bash
npm start
```
The server will start on port 3000. Open your browser and navigate to:
`http://localhost:3000`

## Deploying to a VPS (e.g., HostingRaja, DigitalOcean, AWS)

This project is fully ready to be hosted on a Linux VPS. Here is a general guide to get it running in a production environment:

1. **Upload the project**: Transfer your project files (excluding the `node_modules` folder) to your VPS using FTP, SCP, or Git.
2. **Install Node.js & Dependencies**: SSH into your VPS, navigate to the project directory, and run `npm install`.
3. **Install Puppeteer Linux Dependencies**:
   If you encounter errors about missing shared libraries when generating a PDF on Linux, you must install the required Chrome dependencies. For Ubuntu/Debian, run:
   ```bash
   sudo apt-get update
   sudo apt-get install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2
   ```
4. **Use a Process Manager (PM2)**:
   To ensure the application stays running in the background even after you close the terminal, use PM2:
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name "lr-generator"
   pm2 save
   pm2 startup
   ```
5. **Reverse Proxy (Optional but Recommended)**:
   It is highly recommended to use a web server like **Nginx** or **Apache** to proxy incoming internet traffic from port 80 (HTTP) to your internal Node.js port (`3000`), and to set up an SSL certificate via Let's Encrypt for HTTPS.

## Usage Guide

1. **New Bill**: Fill out the form with LR, Route, Party, and Goods details.
2. **Generate Specific Copy**: Click any of the specific buttons at the bottom (Consignee, Consignor, Truck, Office) to download a 1-page PDF with that specific label.
3. **Generate Main PDF**: Click the "Generate Main LR PDF" to download a clean, unlabeled master copy.
4. **Reset Portal**: Click "RESET PORTAL" to clear the form and advance the system to the next available LR number.
5. **History**: Login via the top right corner (Default Username: `admin`, Password: `admin123`) to view and download previously archived bills.
