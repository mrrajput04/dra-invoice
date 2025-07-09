// ================================
// 3. OFFLINE MANAGER HOOK
// ================================

import { useState, useEffect } from 'react';
import { loadInvoicesFromFirebase } from '../../firebase-functions';
import { OfflineStorageManager } from '../utils/OfflineStorageManager';

export const useOfflineManager = () => {
	const [isOnline, setIsOnline] = useState(navigator.onLine);
	const [storageManager, setStorageManager] = useState(null);
	const [pendingSyncCount, setPendingSyncCount] = useState(0);

	useEffect(() => {
		const initStorage = async () => {
			const manager = new OfflineStorageManager();
			await manager.init();
			setStorageManager(manager);
		};

		initStorage();

		// Listen for online/offline events
		const handleOnline = () => {
			setIsOnline(true);
			syncPendingData();
		};

		const handleOffline = () => {
			setIsOnline(false);
		};

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []);

	const syncPendingData = async () => {
		if (!storageManager || !isOnline) return;

		try {
			const pendingItems = await storageManager.getPendingSyncItems();
			setPendingSyncCount(pendingItems.length);

			for (const item of pendingItems) {
				try {
					if (item.type === 'invoice') {
						if (item.action === 'save') {
							await syncInvoiceToFirebase(item.data);
						} else if (item.action === 'delete') {
							await deleteInvoiceFromFirebase(item.data.id);
						}
					}

					// Clear synced item
					await storageManager.clearSyncItem(item.id);
				} catch (error) {
					console.error('Sync error for item:', item.id, error);
				}
			}

			setPendingSyncCount(0);
		} catch (error) {
			console.error('Sync process error:', error);
		}
	};

	const syncInvoiceToFirebase = async (invoiceData) => {
		// Your existing Firebase save logic
		const docRef = doc(db, 'invoices', invoiceData.invoiceNumber);
		await setDoc(docRef, invoiceData, { merge: true });
	};

	const deleteInvoiceFromFirebase = async (invoiceId) => {
		// Your existing Firebase delete logic
		await deleteDoc(doc(db, 'invoices', invoiceId));
	};

	return {
		isOnline,
		storageManager,
		pendingSyncCount,
		syncPendingData
	};
};

// ================================
// 4. ENHANCED INVOICE MANAGER
// ================================

export const useEnhancedInvoiceManager = () => {
	const { isOnline, storageManager, pendingSyncCount, syncPendingData } = useOfflineManager();
	const [invoices, setInvoices] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadInvoices();
	}, [storageManager, isOnline]);

	const loadInvoices = async () => {
		setLoading(true);

		try {
			if (isOnline) {
				// Load from Firebase when online
				const firebaseInvoices = await loadInvoicesFromFirebase();
				setInvoices(firebaseInvoices);

				// Update offline storage
				if (storageManager) {
					for (const invoice of firebaseInvoices) {
						await storageManager.saveInvoice({
							...invoice,
							syncStatus: 'synced'
						});
					}
				}
			} else {
				// Load from offline storage when offline
				if (storageManager) {
					const offlineInvoices = await storageManager.getInvoices();
					setInvoices(offlineInvoices);
				}
			}
		} catch (error) {
			console.error('Error loading invoices:', error);

			// Fallback to offline storage
			if (storageManager) {
				const offlineInvoices = await storageManager.getInvoices();
				setInvoices(offlineInvoices);
			}
		} finally {
			setLoading(false);
		}
	};

	const saveInvoice = async (invoiceData) => {
		try {
			if (isOnline) {
				// Save to Firebase when online
				await saveInvoiceToFirebase(invoiceData);
			}

			// Always save to offline storage
			if (storageManager) {
				await storageManager.saveInvoice(invoiceData);
			}

			// Update local state
			setInvoices(prev => {
				const index = prev.findIndex(inv => inv.id === invoiceData.id);
				if (index >= 0) {
					const updated = [...prev];
					updated[index] = invoiceData;
					return updated;
				}
				return [...prev, invoiceData];
			});

			if (!isOnline) {
				alert('Invoice saved offline. It will sync when you\'re back online.');
			}
		} catch (error) {
			console.error('Error saving invoice:', error);
			alert('Error saving invoice. Please try again.');
		}
	};

	const deleteInvoice = async (invoiceId) => {
		try {
			if (isOnline) {
				// Delete from Firebase when online
				await deleteInvoiceFromFirebase(invoiceId);
			}

			// Always delete from offline storage
			if (storageManager) {
				await storageManager.deleteInvoice(invoiceId);
			}

			// Update local state
			setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));

			if (!isOnline) {
				alert('Invoice deleted offline. Changes will sync when you\'re back online.');
			}
		} catch (error) {
			console.error('Error deleting invoice:', error);
			alert('Error deleting invoice. Please try again.');
		}
	};

	return {
		invoices,
		loading,
		isOnline,
		pendingSyncCount,
		saveInvoice,
		deleteInvoice,
		syncPendingData,
		refreshInvoices: loadInvoices
	};
};

// ================================
// 5. OFFLINE STATUS COMPONENT
// ================================

export const OfflineStatusBar = ({ isOnline, pendingSyncCount }) => {
	return (
		<div className={`fixed top-0 left-0 right-0 z-50 p-2 text-center text-sm ${isOnline ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
			}`}>
			{isOnline ? (
				<span>✓ Online {pendingSyncCount > 0 && `- Syncing ${pendingSyncCount} items...`}</span>
			) : (
				<span>⚠️ Offline - Changes will sync when connection is restored</span>
			)}
		</div>
	);
};
