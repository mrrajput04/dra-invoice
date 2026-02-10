import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import {
	collection,
	getDocs,
	deleteDoc,
	doc,
	query,
	orderBy,
	limit,
	startAfter
} from 'firebase/firestore';
import { Trash2 } from 'lucide-react';
import Navbar from './Navbar';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = ({ onInvoiceSelect }) => {
	const [invoices, setInvoices] = useState([]);
	const [lastVisible, setLastVisible] = useState(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [refresh, setRefresh] = useState(false);
	const PAGE_SIZE = 5;

	useEffect(() => {
		fetchInvoices();
	}, [refresh]);

	const fetchInvoices = async () => {
		let q = query(collection(db, 'invoices'), orderBy('date', 'desc'), limit(PAGE_SIZE));
		const snapshot = await getDocs(q);
		setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
		setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
	};

	const fetchNextPage = async () => {
		const q = query(
			collection(db, 'invoices'),
			orderBy('date', 'desc'),
			startAfter(lastVisible),
			limit(PAGE_SIZE)
		);
		const snapshot = await getDocs(q);
		if (!snapshot.empty) {
			setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
			setInvoices(prev => [...prev, ...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))]);
		}
	};

	const deleteInvoice = async (id) => {
		if (window.confirm('Are you sure you want to delete this invoice?')) {
			await deleteDoc(doc(db, 'invoices', id));
			setRefresh(prev => !prev);
		}
	};

	const filteredInvoices = invoices.filter(inv =>
		inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
		inv.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
	);
console.log(filteredInvoices);
	return (
		<>
			<Navbar />
			<div className="p-4">
				<h2 className="text-xl font-semibold mb-4">Saved Invoices</h2>

				<input
					type="text"
					placeholder="Search by invoice or client"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="w-full mb-4 p-2 border rounded-md focus:ring-2 focus:ring-yellow-500"
				/>

				<div className="space-y-3">
					{filteredInvoices.length === 0 ? (
						<p className="text-gray-500">No invoices found.</p>
					) : (
						filteredInvoices.map((inv) => (
							<div
								key={inv.id}
								className="flex justify-between items-center p-3 rounded border border-gray-300 hover:bg-gray-100 transition"
							>
								{inv.brandInvoice===true?<Link to={`/brand-invoice/${inv.id}`} className="cursor-pointer flex-1">
									<div className="font-semibold">{inv.invoiceNumber || inv.id}</div>
									<div className="text-sm text-gray-600">
										{inv.clientName} • ₹{inv.items?.reduce((sum, i) => sum + i.total, 0).toFixed(2)} • {inv.date}
									</div>
								</Link>:
								<Link to={`/invoice/${inv.id}`} className="cursor-pointer flex-1">
									<div className="font-semibold">{inv.invoiceNumber || inv.id}</div>
									<div className="text-sm text-gray-600">
										{inv.clientName} • ₹{inv.items?.reduce((sum, i) => sum + i.total, 0).toFixed(2)} • {inv.date}
									</div>
								</Link>}
								<button
									onClick={() => deleteInvoice(inv.id)}
									className="text-red-600 hover:text-red-800 ml-2"
								>
									<Trash2 size={18} />
								</button>
							</div>
						))
					)}
				</div>

				{invoices.length >= PAGE_SIZE && (
					<button
						onClick={fetchNextPage}
						className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
					>
						Load More
					</button>
				)}
			</div >
		</>
	);
};

export default Dashboard;
