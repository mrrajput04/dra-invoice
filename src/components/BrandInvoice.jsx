import React, { useEffect, useState } from 'react';
import { Plus, Trash2, FileText, Download } from 'lucide-react';
import draLogo from '/logo.svg'
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Navbar from './Navbar';
import { numberToWords } from '../utils/utils';
import * as XLSX from 'xlsx';

const saveInvoiceToFirebase = async (invoiceData) => {
    const docRef = doc(db, 'invoices', invoiceData.invoiceNumber || temp + Math.random().toString(10).substring(2, 10));
    await setDoc(docRef, invoiceData);
    alert('Invoice saved to Firebase!');
};

const BrandInvoice = () => {
const [invoiceData, setInvoiceData] = useState({
  // FROM
  fromName: 'Aaditya Chakravarty',
  fromAddress: 'Regus, Mohali Citi Centre 2, Third Floor, SCO 250–251, Airport Road, Mohali – 140306',
  fromPAN: 'CJWPC9884M',
  fromPhone: '9557230546', 

  // BILL TO
  clientName: '',
  clientAddress: '',
  clientGST: '',

  // INVOICE META
  invoiceNumber: '',
  date: new Date().toISOString().split('T')[0],

  // PAYMENT
  bankName: 'State Bank Of India',
  accountName: 'Aaditya Chakravarty',
  accountNumber: '43854002406',
  ifsc: 'SBIN0050502',

  note: '⚠️',
  items: [{ sno: 1, name: '', quantity: 1, price: 0, total: 0 }],
  brandInvoice:true
});


    // useEffect(() => {
    // 	const loadInvoice = async () => {
    // 		const docRef = doc(db, 'invoices', 'temp'); // or dynamic ID
    // 		const docSnap = await getDoc(docRef);
    // 		if (docSnap.exists()) {
    // 			setInvoiceData(docSnap.data());
    // 		}
    // 	};

    // 	loadInvoice();
    // }, []);



    const updateItem = (index, field, value) => {
        const newItems = [...invoiceData.items];
        newItems[index][field] = value;

        if (field === 'quantity' || field === 'price') {
            newItems[index].total = newItems[index].quantity * newItems[index].price;
        }

        setInvoiceData({ ...invoiceData, items: newItems });
    };

    const addItem = () => {
        const newItem = {
            sno: invoiceData.items.length + 1,
            name: '',
            quantity: 1,
            price: 0,
            total: 0
        };
        setInvoiceData({ ...invoiceData, items: [...invoiceData.items, newItem] });
    };

    const removeItem = (index) => {
        const newItems = invoiceData.items.filter((_, i) => i !== index);
        const reindexedItems = newItems.map((item, i) => ({ ...item, sno: i + 1 }));
        setInvoiceData({ ...invoiceData, items: reindexedItems });
    };

    const calculateTotal = () => {
        return invoiceData.items.reduce((sum, item) => sum + item.total, 0);
    };

    const exportToExcel = () => {
        try {
            const workbook = XLSX.utils.book_new();
            const total = calculateTotal();

            // Invoice Items Sheet with enhanced data
            const itemsData = invoiceData.items.map(item => ({
                'S.No': item.sno,
                'Description': item.name,
                'Quantity': item.quantity,
                'Price (₹)': item.price,
                'Total (₹)': item.total
            }));

            // Add total row to items
            itemsData.push({
                'S.No': '',
                'Description': '',
                'Quantity': '',
                'Price (₹)': 'Grand Total:',
                'Total (₹)': total
            });

            const itemsSheet = XLSX.utils.json_to_sheet(itemsData);
            XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Items');

            // Metadata Sheet (Invoice Details)
            const metaData = [
                ['Invoice Details', ''],
                ['Invoice Number', invoiceData.invoiceNumber || 'N/A'],
                ['Date', invoiceData.date || 'N/A'],
                ['PAN Number', invoiceData.panNumber || 'N/A'],
                ['', ''],
                ['Client Information', ''],
                ['Client Name', invoiceData.clientName || 'N/A'],
                ['Client Address', invoiceData.clientAddress || 'N/A'],
                ['Client GST', invoiceData.clientGST || 'N/A'],
                ['', ''],
                ['Additional Information', ''],
                ['Note', invoiceData.note || 'N/A'],
                ['Grand Total', `₹${total.toFixed(2)}`],
                ['Total Items', invoiceData.items.length],
                ['Export Date', new Date().toLocaleDateString()],
                ['Export Time', new Date().toLocaleTimeString()]
            ];

            const metaSheet = XLSX.utils.aoa_to_sheet(metaData);
            XLSX.utils.book_append_sheet(workbook, metaSheet, 'Invoice Info');

            // Summary Sheet
            const summaryData = [
                ['Summary', ''],
                ['Invoice Number', invoiceData.invoiceNumber || 'N/A'],
                ['Client Name', invoiceData.clientName || 'N/A'],
                ['Date', invoiceData.date || 'N/A'],
                ['Total Items', invoiceData.items.length],
                ['Grand Total', `₹${total.toFixed(2)}`],
                ['', ''],
                ['Items Breakdown', ''],
                ...invoiceData.items.map(item => [
                    item.name,
                    `${item.quantity} × ₹${item.price} = ₹${item.total}`
                ])
            ];

            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = `Invoice_${invoiceData.invoiceNumber || 'Data'}_${timestamp}.xlsx`;

            XLSX.writeFile(workbook, filename);

            // Optional: Show success message
            alert(`Excel file exported successfully: ${filename}`);

        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert('Error exporting to Excel. Please try again.');
        }
    };

    const generatePDF = () => {
        const total = calculateTotal();
        const totalInWords = numberToWords(Math.floor(total));

        const printContent = `
      <html>
        <head>
          <title>Invoice - ${invoiceData.invoiceNumber}</title>
          <link rel="icon" type="image/x-icon" href="https://res.cloudinary.com/dvstorage/image/upload/v1751884378/1000168781-removebg-preview_xjquev.png">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #DAA520; padding-bottom: 20px; }
            .logo { width: 25px; height: 20px; margin: 0 auto 10px; }
            .company-name { font-size: 24px; font-weight: bold; color: #DAA520; margin: 5px 0; }
            .company-tagline { font-size: 14px; color: #666; }
            .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .client-info, .invoice-info { flex: 1; }
            .invoice-info { text-align: right; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #DAA520; color: white; font-weight: bold; }
            .number { text-align: right; }
            .total-row { background-color: #f9f9f9; font-weight: bold; }
            .total-section { margin-top: 20px; text-align: right; }
            .grand-total { font-size: 18px; font-weight: bold; color: #DAA520; }
            .amount-words { margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #DAA520; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
           <div className="w-25 h-20 mx-auto mb-2 bg-slate-600 rounded-lg flex items-center justify-center">
                    <img src="https://res.cloudinary.com/dvstorage/image/upload/v1751884378/1000168781-removebg-preview_xjquev.png" className="logo" alt="Dynamic Range Architects logo" style="width: 150px; height: 80px;"/>
            </div>
            <div class="company-name">DYNAMIC RANGE ARCHITECTS</div>
            <div class="company-tagline">Professional Architectural Services</div>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-top: 30px;">

  <!-- LEFT: FROM -->
  <div style="width: 48%; text-align: left;">
    <h3>From:</h3>
    <strong>${invoiceData.fromName}</strong><br>
    Phone: ${invoiceData.fromPhone}<br>
    Address: ${invoiceData.fromAddress.replace(/\n/g, '<br>')}<br>
    PAN: ${invoiceData.fromPAN}
  </div>

  <!-- RIGHT: BILL TO -->
  <div style="width: 48%; text-align: right;">
    <h3>Bill To:</h3>
    <strong>${invoiceData.clientName}</strong><br>
    ${invoiceData.clientAddress.replace(/\n/g, '<br>')}<br>
    GST: ${invoiceData.clientGST}
  </div>

</div>

<!-- INVOICE META -->
<div style="display: flex; justify-content: space-between; margin-top: 20px;">
  <div>
    <strong>Invoice No:</strong> ${invoiceData.invoiceNumber}
  </div>
  <div>
    <strong>Date:</strong> ${new Date(invoiceData.date).toLocaleDateString()}
  </div>
</div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 8%;">S.No</th>
                <th style="width: 50%;">Description</th>
                <th style="width: 12%;">Quantity</th>
                <th style="width: 15%;">Price</th>
                <th style="width: 15%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceData.items.map(item => `
                <tr>
                  <td class="number">${item.sno}</td>
                  <td>${item.name}</td>
                  <td class="number">${item.quantity}</td>
                  <td class="number">₹${item.price.toFixed(2)}</td>
                  <td class="number">₹${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="4" style="text-align: right; font-weight: bold;">Grand Total:</td>
                <td class="number grand-total">₹${total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="amount-words">
            <strong>Amount in Words:</strong> ${totalInWords} Rupees Only
          </div>

          <div style="margin-top: 30px; padding: 15px; border: 1px solid #ddd;">
  <h3 style="margin-bottom: 10px;">Payment Details</h3>
  <p><strong>Bank:</strong> ${invoiceData.bankName}</p>
  <p><strong>Account Name:</strong> ${invoiceData.accountName}</p>
  <p><strong>Account Number:</strong> ${invoiceData.accountNumber}</p>
  <p><strong>IFSC:</strong> ${invoiceData.ifsc}</p>
</div>

          <div style="margin-top: 30px; font-style: italic; color: #333; font-size: 14px;">
          <strong></strong> ${invoiceData.note}
          </div>

        </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Dynamic Range Architects - Building Dreams, Designing Futures</p>
          </div>
        </body>
      </html>
    `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <>
            <Navbar />
            <div className="max-w-6xl mx-auto p-6 bg-white">
                <div className="text-center mb-8 border-b-2 border-yellow-600 pb-6">
                    <div className="w-35 h-20 p-2 mx-auto mb-4 bg-gray-600 rounded-lg flex items-center justify-center">
                        <img src={draLogo} className="logo" alt="Dynamic Range Architects logo" />
                    </div>
                    <h1 className="text-3xl font-bold text-yellow-600 mb-2">DYNAMIC RANGE ARCHITECTS</h1>
                    <p className="text-gray-600">Professional Architectural Services</p>
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

  {/* FROM */}
  <div>
    <h2 className="text-xl font-semibold mb-3">From</h2>

    <input
      placeholder="Name"
      value={invoiceData.fromName}
      onChange={e => setInvoiceData({ ...invoiceData, fromName: e.target.value })}
      className="w-full mb-2 p-2 border rounded"
    />

    <input
    placeholder="Phone Number"
    value={invoiceData.fromPhone}
    onChange={e => setInvoiceData({ ...invoiceData, fromPhone: e.target.value })}
    className="w-full mb-2 p-2 border rounded"
    />

    <textarea
      placeholder="Address"
      value={invoiceData.fromAddress}
      onChange={e => setInvoiceData({ ...invoiceData, fromAddress: e.target.value })}
      className="w-full mb-2 p-2 border rounded"
      rows={2}
    />

    <input
      placeholder="PAN Number"
      value={invoiceData.fromPAN}
      onChange={e => setInvoiceData({ ...invoiceData, fromPAN: e.target.value })}
      className="w-full p-2 border rounded"
    />

   
  </div>

  {/* BILL TO */}
  <div>
    <h2 className="text-xl font-semibold mb-3">Bill To</h2>

    <input
      placeholder="Client / Company Name"
      value={invoiceData.clientName}
      onChange={e => setInvoiceData({ ...invoiceData, clientName: e.target.value })}
      className="w-full mb-2 p-2 border rounded"
    />

    <textarea
      placeholder="Client Address"
      value={invoiceData.clientAddress}
      onChange={e => setInvoiceData({ ...invoiceData, clientAddress: e.target.value })}
      className="w-full mb-2 p-2 border rounded"
      rows={3}
    />

    <input
      placeholder="GST Number"
      value={invoiceData.clientGST}
      onChange={e => setInvoiceData({ ...invoiceData, clientGST: e.target.value })}
      className="w-full p-2 border rounded"
    />
  </div>
</div>

{/* INVOICE META */}
<div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
  <input
    placeholder="Invoice Number (e.g. DRA-003)"
    value={invoiceData.invoiceNumber}
    onChange={e => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
    className="p-2 border rounded w-full md:w-1/3"
  />

  <input
    type="date"
    value={invoiceData.date}
    onChange={e => setInvoiceData({ ...invoiceData, date: e.target.value })}
    className="p-2 border rounded w-full md:w-1/3"
  />
</div>

<div className="flex justify-between mb-6">
  <p><strong>Invoice No:</strong> {invoiceData.invoiceNumber}</p>
  <p><strong>Date:</strong> {invoiceData.date}</p>
</div>

                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Invoice Items</h2>
                        <button
                            onClick={addItem}
                            className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
                        >
                            <Plus size={16} />
                            Add Item
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-yellow-600 text-white">
                                    <th className="border border-gray-300 p-3 text-left">S.No.</th>
                                    <th className="border border-gray-300 p-3 text-left">Description</th>
                                    <th className="border border-gray-300 p-3 text-left">Quantity</th>
                                    <th className="border border-gray-300 p-3 text-left">Price (₹)</th>
                                    <th className="border border-gray-300 p-3 text-left">Total (₹)</th>
                                    <th className="border border-gray-300 p-3 text-left">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoiceData.items.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="border border-gray-300 p-3 text-center">{item.sno}</td>
                                        <td className="border border-gray-300 p-3">
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                className="w-full p-1 border border-gray-200 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                                placeholder="Item description"
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-3">
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                                className="w-full p-1 border border-gray-200 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                                min="1"
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-3">
                                            <input
                                                type="number"
                                                value={item.price}
                                                onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                                                className="w-full p-1 border border-gray-200 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                                min="0"
                                                step="0.01"
                                            />
                                        </td>
                                        <td className="border border-gray-300 p-3 text-right font-medium">
                                            ₹{item.total.toFixed(2)}
                                        </td>
                                        <td className="border border-gray-300 p-3 text-center">
                                            {invoiceData.items.length > 1 && (
                                                <button
                                                    onClick={() => removeItem(index)}
                                                    className="text-red-600 hover:text-red-800 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg mb-8 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xl font-semibold">Grand Total:</span>
                        <span className="text-2xl font-bold text-yellow-600">₹{calculateTotal().toFixed(2)}</span>
                    </div>

                    <div className="text-sm text-gray-600">
                        <strong>Amount in Words:</strong> {numberToWords(Math.floor(calculateTotal()))} Rupees Only
                    </div>

<div className="bg-gray-50 p-6 rounded-lg mt-6">
  <h3 className="text-lg font-semibold mb-3">Payment Details</h3>
  <p><strong>Bank:</strong> {invoiceData.bankName}</p>
  <p><strong>Account Name:</strong> {invoiceData.accountName}</p>
  <p><strong>Account Number:</strong> {invoiceData.accountNumber}</p>
  <p><strong>IFSC:</strong> {invoiceData.ifsc}</p>
</div>

                    <div className="text-sm text-gray-700 italic mt-4">
                        <strong></strong>{invoiceData.note}
                    </div>
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                        <textarea
                            value={invoiceData.note}
                            onChange={(e) => setInvoiceData({ ...invoiceData, note: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                            rows="3"
                            placeholder="e.g. Additional charges may apply for extended work on site."
                        />
                    </div>

                </div>

                <div className='flex justify-center gap-12'>
                    <div className="text-center mt-4">
                        <button
                            onClick={generatePDF}
                            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors mx-auto"
                        >
                            <Download size={20} />
                            Generate PDF Invoice
                        </button>
                    </div>
                    <div className="text-center mt-4">
                        <button
                            onClick={async () => await saveInvoiceToFirebase(invoiceData)}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors mx-auto"
                        >
                            <FileText size={20} />
                            Save Invoice Data
                        </button>
                    </div>
                    <div className="text-center">
                        <button
                            onClick={exportToExcel}
                            className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 transition-colors mx-auto mt-4"
                        >
                            <Download size={20} />
                            Export to Excel
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BrandInvoice;