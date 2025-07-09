import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Your firebase config
import InvoiceForm from './components/InvoiceGenerator';
import Dashboard from './components/Dashboard';
import CreateNewInvoice from './components/CreateNewInvoice';
import { useEnhancedInvoiceManager, OfflineStatusBar } from './hooks/useOfflineManager';

// Wrapper component to handle invoice loading by ID
const InvoiceWrapper = ({ invoiceData, setInvoiceData }) => {
	const { invoiceId } = useParams();
	const [loading, setLoading] = useState(true);
	const { storageManager, isOnline } = useEnhancedInvoiceManager();

	useEffect(() => {
		const loadInvoice = async () => {
			if (invoiceId && invoiceId !== 'new') {
				try {
					let invoiceFound = false;

					// Try to load from Firebase first if online
					if (isOnline) {
						try {
							const docRef = doc(db, 'invoices', invoiceId);
							const docSnap = await getDoc(docRef);
							if (docSnap.exists()) {
								setInvoiceData(docSnap.data());
								invoiceFound = true;
							}
						} catch (error) {
							console.error('Error loading from Firebase:', error);
						}
					}

					// If not found online or offline, try offline storage
					if (!invoiceFound && storageManager) {
						try {
							const offlineInvoices = await storageManager.getInvoices();
							const offlineInvoice = offlineInvoices.find(inv =>
								inv.id === invoiceId || inv.invoiceNumber === invoiceId
							);
							if (offlineInvoice) {
								setInvoiceData(offlineInvoice);
								invoiceFound = true;
							}
						} catch (error) {
							console.error('Error loading from offline storage:', error);
						}
					}

					if (!invoiceFound) {
						alert('Invoice not found');
						// Redirect to dashboard or show empty form
						window.location.href = '/dra-invoice/';
					}
				} catch (error) {
					console.error('Error loading invoice:', error);
					alert('Error loading invoice');
				}
			} else {
				// New invoice - reset to default state
				setInvoiceData({
					invoiceNumber: '',
					date: new Date().toISOString().split('T')[0],
					clientName: '',
					clientAddress: '',
					note: '',
					items: [{ sno: 1, name: '', quantity: 1, price: 0, total: 0 }]
				});
			}
			setLoading(false);
		};

		loadInvoice();
	}, [invoiceId, storageManager, isOnline, setInvoiceData]);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-lg">Loading invoice...</div>
			</div>
		);
	}

	return (
		<InvoiceForm
			invoiceData={invoiceData}
			setInvoiceData={setInvoiceData}
		/>
	);
};

function App() {
	const [invoiceData, setInvoiceData] = useState({
		invoiceNumber: '',
		date: new Date().toISOString().split('T')[0],
		clientName: '',
		clientAddress: '',
		note: '',
		items: [{ sno: 1, name: '', quantity: 1, price: 0, total: 0 }]
	});

	const {
		invoices,
		loading,
		isOnline,
		pendingSyncCount,
		saveInvoice,
		deleteInvoice,
		syncPendingData,
		refreshInvoices
	} = useEnhancedInvoiceManager();

	// Enhanced load invoice function with offline support
	const loadInvoiceById = async (id) => {
		try {
			let invoiceFound = false;

			// Try Firebase first if online
			if (isOnline) {
				try {
					const docRef = doc(db, 'invoices', id);
					const docSnap = await getDoc(docRef);
					if (docSnap.exists()) {
						setInvoiceData(docSnap.data());
						invoiceFound = true;
					}
				} catch (error) {
					console.error('Error loading from Firebase:', error);
				}
			}

			// Fallback to offline storage
			if (!invoiceFound) {
				const offlineInvoice = invoices.find(inv =>
					inv.id === id || inv.invoiceNumber === id
				);
				if (offlineInvoice) {
					setInvoiceData(offlineInvoice);
					invoiceFound = true;
				}
			}

			if (!invoiceFound) {
				alert('Invoice not found');
			}
		} catch (error) {
			console.error('Error loading invoice:', error);
			alert('Error loading invoice');
		}
	};

	// Enhanced save function with offline support
	const handleSaveInvoice = async (data) => {
		try {
			await saveInvoice(data);
			setInvoiceData(data);
		} catch (error) {
			console.error('Error saving invoice:', error);
			alert('Error saving invoice');
		}
	};

	// Enhanced delete function with offline support
	const handleDeleteInvoice = async (id) => {
		try {
			await deleteInvoice(id);
			await refreshInvoices();
		} catch (error) {
			console.error('Error deleting invoice:', error);
			alert('Error deleting invoice');
		}
	};

	return (
		<Router basename="/dra-invoice">
			<div className="app">
				{/* Offline Status Bar */}
				<OfflineStatusBar isOnline={isOnline} pendingSyncCount={pendingSyncCount} />

				{/* Main Content */}
				<div className={`${!isOnline ? 'pt-12' : 'pt-8'}`}>
					<Routes>
						{/* Invoice Form Route - handles both new and existing invoices */}
						<Route
							path="/invoice/:invoiceId"
							element={
								<InvoiceWrapper
									invoiceData={invoiceData}
									setInvoiceData={setInvoiceData}
								/>
							}
						/>

						{/* Create New Invoice Route */}
						<Route
							path="/create-new-invoice"
							element={
								<CreateNewInvoice
									onSave={handleSaveInvoice}
									isOffline={!isOnline}
								/>
							}
						/>

						{/* Dashboard Route */}
						<Route
							path="/"
							element={
								<Dashboard
									invoices={invoices}
									loading={loading}
									isOnline={isOnline}
									onInvoiceSelect={loadInvoiceById}
									onInvoiceDelete={handleDeleteInvoice}
									onRefresh={refreshInvoices}
									onSync={syncPendingData}
								/>
							}
						/>

						{/* Fallback Route */}
						<Route
							path="*"
							element={
								<div className="flex items-center justify-center min-h-screen">
									<div className="text-center">
										<h2 className="text-xl font-bold mb-4">Page Not Found</h2>
										<a href="/dra-invoice/" className="text-blue-600 hover:text-blue-800">
											Go to Dashboard
										</a>
									</div>
								</div>
							}
						/>
					</Routes>
				</div>
			</div>
		</Router>
	);
}

export default App;