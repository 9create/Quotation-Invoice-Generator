// Quotation Generator - Main Logic

window.setDocType = function(type) {
    document.getElementById('docType').value = type;
    document.getElementById('quotationBtn').classList.toggle('active', type === 'quotation');
    document.getElementById('invoiceBtn').classList.toggle('active', type === 'invoice');
    
    // Update Generate button text
    const generateBtn = document.getElementById('generateBtn');
    const newBtn = document.getElementById('newBtn');
    
    if (type === 'invoice') {
        if (generateBtn) generateBtn.innerHTML = '✨ Generate Tax Invoice';
        if (newBtn) newBtn.innerHTML = '🔄 New Tax Invoice';
    } else {
        if (generateBtn) generateBtn.innerHTML = '✨ Generate Quotation';
        if (newBtn) newBtn.innerHTML = '🔄 New Quotation';
    }
}

window.generateQuotation = function() {
    const customerName = document.getElementById('customerName').value.trim();
    const customerGSTIN = document.getElementById('customerGSTIN').value.trim();
    const customerState = document.getElementById('customerState').value;
    const productDesc = document.getElementById('productDesc').value.trim();
    const industry = document.getElementById('industry').value;
    const taxRate = parseFloat(document.getElementById('taxRate').value);
    const hsnCode = document.getElementById('hsnCode').value.trim();
    const docType = document.getElementById('docType').value;

    if (!customerName || !productDesc) {
        alert('Please fill in Customer Name and Product Description');
        return;
    }

    // Parse products from description
    const items = parseProducts(productDesc);
    
    // Generate quotation HTML
    const quotationHTML = buildQuotationHTML(customerName, customerGSTIN, customerState, items, industry, taxRate, hsnCode, docType);
    
    // Display quotation
    document.getElementById('quotationDisplay').innerHTML = quotationHTML;
    document.getElementById('outputSection').style.display = 'block';
    
    // Smooth scroll to output
    document.getElementById('outputSection').scrollIntoView({ behavior: 'smooth' });
    
    // Save to local storage
    saveToLocalStorage(customerName, productDesc, quotationHTML);
}

function parseProducts(text) {
    const items = [];
    
    // Pattern 1: "5 Laptops @ 50000" or "5 Laptops @ ₹50000"
    const pattern1 = /(\d+)\s+([a-zA-Z0-9\s\-\/]+?)\s*@\s*₹?\s*(\d+)/gi;
    let matches = [...text.matchAll(pattern1)];
    
    if (matches.length > 0) {
        matches.forEach(match => {
            items.push({
                quantity: parseInt(match[1]),
                name: match[2].trim(),
                rate: parseInt(match[3]),
                amount: parseInt(match[1]) * parseInt(match[3])
            });
        });
    } else {
        // Pattern 2: Just product names (one per line) - default quantity 1, rate 0
        const lines = text.split('\n').filter(line => line.trim());
        lines.forEach(line => {
            line = line.trim();
            if (line) {
                // Try to extract price if mentioned
                const priceMatch = line.match(/₹?\s*(\d+)/);
                const rate = priceMatch ? parseInt(priceMatch[1]) : 0;
                const name = line.replace(/₹?\s*\d+/g, '').trim();
                
                items.push({
                    quantity: 1,
                    name: name || line,
                    rate: rate,
                    amount: rate
                });
            }
        });
    }
    
    return items;
}

function buildQuotationHTML(customerName, customerGSTIN, customerState, items, industry, taxRate, hsnCode, docType) {
    const today = new Date().toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const quotationNumber = (docType === 'invoice' ? 'INV-' : 'QT-') + Date.now().toString().slice(-6);
    const sellerState = 'Maharashtra';
    
    let subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    
    // Calculate GST
    let cgst = 0, sgst = 0, igst = 0;
    let taxAmount = 0;
    
    if (taxRate > 0) {
        taxAmount = (subtotal * taxRate) / 100;
        
        if (customerState === sellerState) {
            cgst = taxAmount / 2;
            sgst = taxAmount / 2;
        } else {
            igst = taxAmount;
        }
    }
    
    let total = subtotal + taxAmount;
    
    // Document title based on type
    let docTitle = 'QUOTATION';
    if (docType === 'invoice') {
        docTitle = taxRate > 0 ? 'TAX INVOICE' : 'INVOICE';
    }
    
    // Build items table
    let itemsHTML = '';
    items.forEach((item, index) => {
        const hsnDisplay = hsnCode ? `<br><small>HSN: ${hsnCode}</small>` : '';
        itemsHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${item.name}${hsnDisplay}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">₹${item.rate.toLocaleString('en-IN')}</td>
                <td style="text-align: right;">₹${item.amount.toLocaleString('en-IN')}</td>
            </tr>
        `;
    });
    
    // Tax breakdown rows
    let taxRows = '';
    if (taxRate > 0) {
        taxRows = `
            <tr style="background: #f9f9f9;">
                <td colspan="4" style="padding: 8px; text-align: right; border: 1px solid #ddd;"><strong>Subtotal:</strong></td>
                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">₹${subtotal.toLocaleString('en-IN')}</td>
            </tr>
        `;
        
        if (cgst > 0) {
            taxRows += `
                <tr style="background: #f9f9f9;">
                    <td colspan="4" style="padding: 8px; text-align: right; border: 1px solid #ddd;">CGST (${taxRate/2}%):</td>
                    <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">₹${cgst.toLocaleString('en-IN')}</td>
                </tr>
                <tr style="background: #f9f9f9;">
                    <td colspan="4" style="padding: 8px; text-align: right; border: 1px solid #ddd;">SGST (${taxRate/2}%):</td>
                    <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">₹${sgst.toLocaleString('en-IN')}</td>
                </tr>
            `;
        } else {
            taxRows += `
                <tr style="background: #f9f9f9;">
                    <td colspan="4" style="padding: 8px; text-align: right; border: 1px solid #ddd;">IGST (${taxRate}%):</td>
                    <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">₹${igst.toLocaleString('en-IN')}</td>
                </tr>
            `;
        }
    }
    
    const gstinDisplay = customerGSTIN ? `<p><strong>GSTIN:</strong> ${customerGSTIN}</p>` : '';
    const validityDisplay = docType === 'quotation' ? `<p style="margin: 5px 0;"><strong>Valid Till:</strong> ${getValidityDate(30)}</p>` : '';
    
    const html = `
        <div style="max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #667eea; padding-bottom: 20px;">
                <h2 style="color: #667eea; margin-bottom: 5px;">${docTitle}</h2>
                <p style="color: #666; font-size: 0.9rem;">${docType === 'invoice' ? 'Invoice' : 'Quotation'} No: ${quotationNumber}</p>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                <div>
                    <h4 style="color: #333; margin-bottom: 10px;">To:</h4>
                    <p style="font-size: 1.1rem; font-weight: 600; margin: 5px 0;">${customerName}</p>
                    ${gstinDisplay}
                    <p style="margin: 5px 0;"><strong>State:</strong> ${customerState}</p>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${today}</p>
                    ${validityDisplay}
                </div>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background: #667eea; color: white;">
                        <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">S.No</th>
                        <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Description</th>
                        <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Qty</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Rate</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                    ${taxRows}
                    <tr class="total-row" style="background: #f5f5f5; font-weight: bold;">
                        <td colspan="4" style="padding: 12px; text-align: right; border: 1px solid #ddd;">Total Amount:</td>
                        <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">₹${total.toLocaleString('en-IN')}</td>
                    </tr>
                </tbody>
            </table>
            
            <div style="margin-top: 40px;">
                <h4 style="color: #333; margin-bottom: 10px;">Terms & Conditions:</h4>
                <ul style="line-height: 1.8; color: #666;">
                    ${docType === 'invoice' ? '<li>Payment due within 7 days</li>' : '<li>Payment: 50% advance, 50% on delivery</li>'}
                    <li>Delivery: Within 7-10 working days</li>
                    ${taxRate === 0 ? '<li>GST: As applicable</li>' : ''}
                    <li>Prices are subject to change without notice</li>
                </ul>
            </div>
            
            <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #eee;">
                <p style="text-align: center; color: #666;">
                    Thank you for your business!<br>
                    <strong>MAY SOFTWARE SOLUTIONS</strong><br>
                    ${taxRate > 0 ? 'GSTIN: 27XXXXX0000X1ZX<br>' : ''}
                    Nagpur, Maharashtra
                </p>
            </div>
        </div>
    `;
    
    return html;
}
 

function getValidityDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

window.savePDF = function() {
    window.print();
}

window.copyToClipboard = function() {
    const content = document.getElementById('quotationDisplay').innerText;
    navigator.clipboard.writeText(content).then(() => {
        alert('✅ Quotation copied to clipboard!');
    }).catch(err => {
        alert('❌ Failed to copy. Please select and copy manually.');
    });
}

window.resetForm = function() {
    document.getElementById('customerName').value = '';
    document.getElementById('productDesc').value = '';
    document.getElementById('industry').value = 'it';
    document.getElementById('outputSection').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function saveToLocalStorage(customer, description, html) {
    const quotation = {
        customer: customer,
        description: description,
        html: html,
        timestamp: new Date().toISOString()
    };
    
    // Save last 10 quotations
    let history = JSON.parse(localStorage.getItem('quotationHistory') || '[]');
    history.unshift(quotation);
    history = history.slice(0, 10);
    localStorage.setItem('quotationHistory', JSON.stringify(history));
}

// Auto-save form data on input
document.addEventListener('DOMContentLoaded', function() {
    const inputs = ['customerName', 'customerGSTIN', 'customerState', 'productDesc', 'industry', 'taxRate', 'hsnCode'];
    
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            // Load saved data
            const saved = localStorage.getItem(id);
            if (saved) element.value = saved;
            
            // Save on change
            element.addEventListener('input', function() {
                localStorage.setItem(id, this.value);
            });
        }
    });
});
