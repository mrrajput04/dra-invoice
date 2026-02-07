import { Link, useLocation } from 'react-router-dom';

function Navbar() {
	const location = useLocation();

	return (
		<nav className="p-4 bg-yellow-600 text-white flex gap-4">
			<Link
				to="/"
				className={`hover:underline px-3 py-2 rounded ${location.pathname === '/' ? 'bg-gray-600' : ''
					}`}
			>
				Dashboard
			</Link>
			<Link
				to="/create-new-invoice"
				className={`hover:underline px-3 py-2 rounded ${location.pathname === '/create-new-invoice' ? 'bg-gray-600' : ''
					}`}
			>
				Create New Invoice
			</Link>
			<Link
				to="/brand-invoice"
				className={`hover:underline px-3 py-2 rounded ${location.pathname === '/brand-invoice' ? 'bg-gray-600' : ''
					}`}
			>
				Brand Invoice
			</Link>

		</nav>
	);
}

export default Navbar;