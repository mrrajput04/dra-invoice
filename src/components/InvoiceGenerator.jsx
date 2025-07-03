import React, { useState } from 'react';
import { Plus, Trash2, FileText, Download } from 'lucide-react';
import draLogo from '/logo.svg'

const InvoiceGenerator = () => {
	const [invoiceData, setInvoiceData] = useState({
		invoiceNumber: '',
		date: new Date().toISOString().split('T')[0],
		clientName: '',
		clientAddress: '',
		items: [{ sno: 1, name: '', quantity: 1, price: 0, total: 0 }]
	});

	const numberToWords = (num) => {
		const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
		const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
		const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

		if (num === 0) return 'Zero';

		const convertHundreds = (n) => {
			let result = '';
			if (n >= 100) {
				result += ones[Math.floor(n / 100)] + ' Hundred ';
				n %= 100;
			}
			if (n >= 20) {
				result += tens[Math.floor(n / 10)] + ' ';
				n %= 10;
			} else if (n >= 10) {
				result += teens[n - 10] + ' ';
				return result;
			}
			if (n > 0) {
				result += ones[n] + ' ';
			}
			return result;
		};

		let word = '';

		// Handle crores (10,000,000)
		if (num >= 10000000) {
			word += convertHundreds(Math.floor(num / 10000000)) + 'Crore ';
			num %= 10000000;
		}

		// Handle lakhs (100,000)
		if (num >= 100000) {
			word += convertHundreds(Math.floor(num / 100000)) + 'Lakh ';
			num %= 100000;
		}

		// Handle thousands (1,000)
		if (num >= 1000) {
			word += convertHundreds(Math.floor(num / 1000)) + 'Thousand ';
			num %= 1000;
		}

		// Handle remaining hundreds, tens, and ones
		if (num > 0) {
			word += convertHundreds(num);
		}

		return word.trim();
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

	const calculateTotal = () => {
		return invoiceData.items.reduce((sum, item) => sum + item.total, 0);
	};

	const generatePDF = () => {
		const total = calculateTotal();
		const totalInWords = numberToWords(Math.floor(total));

		const printContent = `
      <html>
        <head>
          <title>Invoice - ${invoiceData.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #DAA520; padding-bottom: 20px; }
            .logo { width: 80px; height: 80px; margin: 0 auto 10px; }
            .company-name { font-size: 24px; font-weight: bold; color: #DAA520; margin: 10px 0; }
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
           <div className="w-25 h-20 mx-auto mb-4 bg-slate-600 rounded-lg flex items-center justify-center">
					<img src={draLogo} className="logo" alt="Dynamic Range Architects logo" />
			</div>
            <div class="company-name">DYNAMIC RANGE ARCHITECTS</div>
            <div class="company-tagline">Professional Architectural Services</div>
          </div>
          
          <div class="invoice-details">
            <div class="client-info">
              <h3>Bill To:</h3>
              <strong>${invoiceData.clientName}</strong><br>
              ${invoiceData.clientAddress.replace(/\n/g, '<br>')}
            </div>
            <div class="invoice-info">
              <h3>Invoice Details:</h3>
              <strong>Invoice #:</strong> ${invoiceData.invoiceNumber}<br>
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
		<div className="max-w-6xl mx-auto p-6 bg-white">
			<div className="text-center mb-8 border-b-2 border-yellow-600 pb-6">
				<div className="w-25 h-20 mx-auto mb-4 bg-slate-600 rounded-lg flex items-center justify-center">
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
								<th className="border border-gray-300 p-3 text-left">S.No</th>
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

			<div className="bg-gray-50 p-6 rounded-lg mb-8">
				<div className="flex justify-between items-center mb-4">
					<span className="text-xl font-semibold">Grand Total:</span>
					<span className="text-2xl font-bold text-yellow-600">₹{calculateTotal().toFixed(2)}</span>
				</div>
				<div className="text-sm text-gray-600">
					<strong>Amount in Words:</strong> {numberToWords(Math.floor(calculateTotal()))} Rupees Only
				</div>
			</div>

			<div className="text-center">
				<button
					onClick={generatePDF}
					className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors mx-auto"
				>
					<Download size={20} />
					Generate PDF Invoice
				</button>
			</div>
		</div>
	);
};

export default InvoiceGenerator;