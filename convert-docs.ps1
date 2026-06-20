# Markdown to PDF/Word Conversion Script
# Run this script to convert COMPREHENSIVE_DOCUMENTATION.md to PDF or Word

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "eVoucher Documentation Converter" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is available
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Node.js detected: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Installing markdown-pdf converter..." -ForegroundColor Yellow
npm install -g markdown-pdf 2>$null

Write-Host ""
Write-Host "Converting COMPREHENSIVE_DOCUMENTATION.md to PDF..." -ForegroundColor Yellow

# Convert to PDF
markdown-pdf COMPREHENSIVE_DOCUMENTATION.md -o "eVoucher_Platform_Documentation.pdf"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ PDF created successfully: eVoucher_Platform_Documentation.pdf" -ForegroundColor Green
} else {
    Write-Host "✗ PDF conversion failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative methods:" -ForegroundColor Yellow
    Write-Host "1. Use VS Code with 'Markdown PDF' extension" -ForegroundColor White
    Write-Host "2. Visit https://www.markdowntopdf.com/" -ForegroundColor White
    Write-Host "3. Use Google Chrome: Open the MD file in browser, press Ctrl+P, Save as PDF" -ForegroundColor White
}

Write-Host ""
Write-Host "For Word (.docx) conversion, visit:" -ForegroundColor Yellow
Write-Host "https://cloudconvert.com/md-to-docx" -ForegroundColor Cyan

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
