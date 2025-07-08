import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import InvoiceForm from './components/InvoiceGenerator'; // Your main invoice form component
import Dashboard from './components/Dashboard';     // The dashboard component we built
import CreateNewInvoice from './components/CreateNewInvoice';

function App() {
	const [invoiceData, setInvoiceData] = useState({
		invoiceNumber: '',
		date: new Date().toISOString().split('T')[0],
		clientName: '',
		clientAddress: '',
		note: '',
		items: [{ sno: 1, name: '', quantity: 1, price: 0, total: 0 }]
	});

	// Function to load invoice by id (pass to Dashboard)
	const loadInvoiceById = async (id) => {
		const docRef = doc(db, 'invoices', id);
		const docSnap = await getDoc(docRef);
		if (docSnap.exists()) {
			setInvoiceData(docSnap.data());
		} else {
			alert('Invoice not found');
		}
	};

	return (
		<Router basename="/dra-invoice">
			<Routes>
				<Route
					path="/invoice/:invoiceId"
					element={
						<InvoiceForm
							invoiceData={invoiceData}
							setInvoiceData={setInvoiceData}
						/>
					}
				/>
				<Route
					path="/create-new-invoice"
					element={
						<CreateNewInvoice />
					}
				/>

				<Route
					path="/"
					element={<Dashboard onInvoiceSelect={loadInvoiceById} />}
				/>
			</Routes>
		</Router>
	);
}

export default App;
