import { db } from './firebase'; // adjust path as needed
import { collection, getDocs } from 'firebase/firestore';

export const loadInvoicesFromFirebase = async () => {
	try {
		const invoicesCollection = collection(db, 'invoices');
		const invoicesSnapshot = await getDocs(invoicesCollection);
		const invoices = invoicesSnapshot.docs.map(doc => ({
			id: doc.id,
			...doc.data()
		}));
		return invoices;
	} catch (error) {
		console.error('Error loading invoices from Firebase:', error);
		throw error;
	}
};