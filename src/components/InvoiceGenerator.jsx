import React, { useEffect, useState } from 'react';
import { Plus, Trash2, FileText, Download, Copy } from 'lucide-react';
import draLogo from '/logo.svg'
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Navbar from './Navbar';
import { numberToWords } from '../utils/utils';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';

const saveInvoiceToFirebase = async (invoiceData) => {
	try {
		const docId = invoiceData.invoiceNumber || `temp${Math.random().toString(10).substring(2, 10)}`;
		const docRef = doc(db, 'invoices', docId);

		// Check if document exists
		const docSnap = await getDoc(docRef);
		if (docSnap.exists()) {
			// Update existing document
			await setDoc(docRef, invoiceData, { merge: true });
			alert('Invoice updated in Firebase!');
		} else {
			// Create new document
			await setDoc(docRef, invoiceData);
			alert('Invoice saved to Firebase!');
		}
	} catch (error) {
		console.error('Error saving invoice:', error);
		alert('Error saving invoice. Please try again.');
	}
};

const InvoiceGenerator = () => {
	const [invoiceData, setInvoiceData] = useState({
		invoiceNumber: '',
		date: new Date().toISOString().split('T')[0],
		panNumber:"CJWPC9884M",
		clientName: '',
		clientAddress: '',
		clientGST:'',
		note: 'If any work is extended on site, the additional amount will be added during the final completion and may be collected before the site is handed over.',
		items: [{ sno: 1, name: '', quantity: 1, price: 0, total: 0 }],
		brandInvoice:false
	});

	const { invoiceId } = useParams();

	useEffect(() => {
		const loadInvoice = async () => {
			const docRef = doc(db, 'invoices', invoiceId); // or dynamic ID
			const docSnap = await getDoc(docRef);
			if (docSnap.exists()) {
				setInvoiceData(docSnap.data());
			}
		};

		loadInvoice();
	}, []);

	const calculateTotal = () => {
		return invoiceData.items.reduce((sum, item) => sum + item.total, 0);
	};

	const copyInvoiceAsNew = async () => {
	try {
		// First, save the current invoice to Firebase
		if (invoiceData.invoiceNumber && invoiceData.clientName) {
			const currentDocId = invoiceData.invoiceNumber || `temp${Math.random().toString(10).substring(2, 10)}`;
			const currentDocRef = doc(db, 'invoices', currentDocId);
			await setDoc(currentDocRef, invoiceData);
			console.log('Current invoice saved to Firebase');
		}

		// Create a new invoice with the same data but different ID
		const newInvoiceData = {
			...invoiceData,
			invoiceNumber: '', // Clear invoice number for new invoice
			date: new Date().toISOString().split('T')[0], // Set current date
		};

		// Update the state with new invoice data
		setInvoiceData(newInvoiceData);

		alert('Invoice copied! You can now edit the new invoice and assign a new invoice number.');
		
	} catch (error) {
		console.error('Error copying invoice:', error);
		alert('Error copying invoice. Please try again.');
	}
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
			.logo-container { width: 150px; height: 100px; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; }
            .logo { width: 150px; height: 100px; margin: 0 auto 10px; }
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
           <div class="logo-container">
              <img src="https://res.cloudinary.com/dvstorage/image/upload/v1751884378/1000168781-removebg-preview_xjquev.png" class="logo" alt="Dynamic Range Architects logo" />
            </div>
            <div class="company-name">DYNAMIC RANGE ARCHITECTS</div>
            <div class="company-tagline">Professional Architectural Services</div>
          </div>
          
          <div class="invoice-details">
            <div class="client-info">
              <h3>Bill To:</h3>
              <strong>${invoiceData.clientName}</strong><br>
              ${invoiceData.clientAddress.replace(/\n/g, '<br>')}
			  <strong>Client GST:</strong> ${invoiceData.clientGST}
            </div>
            <div class="invoice-info">
              <h3>Invoice Details:</h3>
              <strong>Invoice #:</strong> ${invoiceData.invoiceNumber}<br>
              <strong>Date:</strong> ${new Date(invoiceData.date).toLocaleDateString()}
			  <strong>PAN Number:</strong> ${invoiceData.panNumber}
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

		  <div style="margin-top: 30px; font-style: italic; color: #333; font-size: 14px;">
 		  ⚠️ <strong>Note:</strong> ${invoiceData.note}
		  </div>

		<div style="margin-top: 60px; display: flex; justify-content: space-between;">
		<div style="text-align: center;">
			<div style="border-top: 1px solid #999; width: 200px; margin: 0 auto; padding-top: 8px;">
			Architect Signature
			</div>
		</div>
		<div style="text-align: center;">
			<div style="border-top: 1px solid #999; width: 200px; margin: 0 auto; padding-top: 8px;">
			Client Signature
			</div>
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

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
					<div>
						<h2 className="text-xl font-semibold mb-4">Invoice Details</h2>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
								<input
									type="text"
									value={invoiceData.invoiceNumber}
									onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
									className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
									placeholder="INV-001"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
								<input
									type="date"
									value={invoiceData.date}
									onChange={(e) => setInvoiceData({ ...invoiceData, date: e.target.value })}
									className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
								<input
									type="text"
									value={invoiceData.panNumber}
									onChange={(e) => setInvoiceData({ ...invoiceData, panNumber: e.target.value })}
									className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
								/>
							</div>
						</div>
					</div>

					<div>
						<h2 className="text-xl font-semibold mb-4">Client Information</h2>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
								<input
									type="text"
									value={invoiceData.clientName}
									onChange={(e) => setInvoiceData({ ...invoiceData, clientName: e.target.value })}
									className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
									placeholder="Client Name"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Client Address</label>
								<textarea
									value={invoiceData.clientAddress}
									onChange={(e) => setInvoiceData({ ...invoiceData, clientAddress: e.target.value })}
									className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
									rows="3"
									placeholder="Client Address"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Client GST</label>
								<input
									type="text"
									value={invoiceData.clientGST}
									onChange={(e) => setInvoiceData({ ...invoiceData, clientGST: e.target.value })}
									className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
									placeholder="Client GST"
								/>
							</div>
						</div>
					</div>
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

					<div className="text-sm text-gray-700 italic mt-4">
						⚠️ <strong>Note:</strong>{invoiceData.note}
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

					<div className="flex justify-between items-center pt-8">
						<div className="text-center">
							<p className="text-sm text-gray-700 border-t border-gray-400 pt-2 w-48 mx-auto">Architect Signature</p>
						</div>
						<div className="text-center">
							<p className="text-sm text-gray-700 border-t border-gray-400 pt-2 w-48 mx-auto">Client Signature</p>
						</div>
					</div>
				</div>

				<div className='flex justify-center gap-12'>
					<div className="text-center mt-4">
						<button
							onClick={generatePDF}
							className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors mx-auto"
						>
							<Download size={16} />
							Generate PDF Invoice
						</button>
					</div>
					<div className="text-center mt-4">
						<button
							onClick={async () => await saveInvoiceToFirebase(invoiceData)}
							className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors mx-auto"
						>
							<FileText size={16} />
							Save Invoice Data
						</button>
					</div>
					<div className="text-center">
						<button
							onClick={exportToExcel}
							className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 transition-colors mx-auto mt-4"
						>
							<Download size={16} />
							Export to Excel
						</button>
					</div>
					<div className="text-center">
					<button
						onClick={copyInvoiceAsNew}
						className="flex items-center gap-2 bg-cyan-700 text-white px-6 py-3 rounded-md hover:bg-cyan-900 transition-colors mx-auto mt-4"
					>
						<Copy size={16} />
						Copy as New Invoice
					</button>
				</div>
				</div>
			</div>
		</>
	);
};

export default InvoiceGenerator;