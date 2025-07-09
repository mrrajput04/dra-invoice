export class OfflineStorageManager {
	constructor() {
		this.dbName = 'InvoiceOfflineDB';
		this.version = 1;
		this.db = null;
		this.init();
	}

	async init() {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.dbName, this.version);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				this.db = request.result;
				resolve(this.db);
			};

			request.onupgradeneeded = (event) => {
				const db = event.target.result;

				// Create object stores
				if (!db.objectStoreNames.contains('invoices')) {
					const invoiceStore = db.createObjectStore('invoices', { keyPath: 'id' });
					invoiceStore.createIndex('invoiceNumber', 'invoiceNumber', { unique: false });
					invoiceStore.createIndex('clientName', 'clientName', { unique: false });
					invoiceStore.createIndex('date', 'date', { unique: false });
				}

				if (!db.objectStoreNames.contains('clients')) {
					const clientStore = db.createObjectStore('clients', { keyPath: 'id' });
					clientStore.createIndex('name', 'name', { unique: false });
				}

				if (!db.objectStoreNames.contains('pendingSync')) {
					const syncStore = db.createObjectStore('pendingSync', { keyPath: 'id' });
					syncStore.createIndex('timestamp', 'timestamp', { unique: false });
				}
			};
		});
	}

	async saveInvoice(invoice) {
		const transaction = this.db.transaction(['invoices'], 'readwrite');
		const store = transaction.objectStore('invoices');

		const invoiceWithMeta = {
			...invoice,
			lastModified: new Date().toISOString(),
			syncStatus: 'pending'
		};

		await store.put(invoiceWithMeta);

		// Add to sync queue
		await this.addToSyncQueue('invoice', 'save', invoiceWithMeta);

		return invoiceWithMeta;
	}

	async getInvoices() {
		const transaction = this.db.transaction(['invoices'], 'readonly');
		const store = transaction.objectStore('invoices');

		return new Promise((resolve, reject) => {
			const request = store.getAll();
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}

	async deleteInvoice(id) {
		const transaction = this.db.transaction(['invoices'], 'readwrite');
		const store = transaction.objectStore('invoices');

		await store.delete(id);
		await this.addToSyncQueue('invoice', 'delete', { id });
	}

	async addToSyncQueue(type, action, data) {
		const transaction = this.db.transaction(['pendingSync'], 'readwrite');
		const store = transaction.objectStore('pendingSync');

		const syncItem = {
			id: Date.now() + Math.random(),
			type,
			action,
			data,
			timestamp: new Date().toISOString()
		};

		await store.add(syncItem);
	}

	async getPendingSyncItems() {
		const transaction = this.db.transaction(['pendingSync'], 'readonly');
		const store = transaction.objectStore('pendingSync');

		return new Promise((resolve, reject) => {
			const request = store.getAll();
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}

	async clearSyncItem(id) {
		const transaction = this.db.transaction(['pendingSync'], 'readwrite');
		const store = transaction.objectStore('pendingSync');
		await store.delete(id);
	}
}