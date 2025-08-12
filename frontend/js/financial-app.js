//onality including CRUD operations, data loading, and UI interactions

const API_BASE_URL = 'http://localhost:4000/api';

// Global variables
let currentEditingId = null;

// Application initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('SQLFinance starting...');
    
    // Load initial data
    loadDashboardData();
    loadClients();
    loadInvoices();
    loadTransactions();
    loadPlatforms();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('SQLFinance started successfully');
});

// Configure event listeners for all interactive elements
function setupEventListeners() {
    // Form submissions
    const clientForm = document.getElementById('clientForm');
    const invoiceForm = document.getElementById('invoiceForm');
    const transactionForm = document.getElementById('transactionForm');
    const platformForm = document.getElementById('platformForm');
    
    if (clientForm) clientForm.addEventListener('submit', handleClientSubmit);
    if (invoiceForm) invoiceForm.addEventListener('submit', handleInvoiceSubmit);
    if (transactionForm) transactionForm.addEventListener('submit', handleTransactionSubmit);
    if (platformForm) platformForm.addEventListener('submit', handlePlatformSubmit);
    
    // Search functionality
    const clientSearch = document.getElementById('client-search');
    const invoiceSearch = document.getElementById('invoice-search');
    const transactionSearch = document.getElementById('transaction-search');
    
    if (clientSearch) clientSearch.addEventListener('input', debounce(filterClients, 300));
    if (invoiceSearch) invoiceSearch.addEventListener('input', debounce(filterInvoices, 300));
    if (transactionSearch) transactionSearch.addEventListener('input', debounce(filterTransactions, 300));
    
    // Tab navigation
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(e) {
            const target = e.target.getAttribute('data-bs-target');
            
            // Reload data when switching tabs
            if (target === '#dashboard') {
                loadDashboardData();
            } else if (target === '#clients') {
                loadClients();
            } else if (target === '#invoices') {
                loadInvoices();
            } else if (target === '#transactions') {
                loadTransactions();
            } else if (target === '#platforms') {
                loadPlatforms();
            }
        });
    });
}

// ==================== DASHBOARD FUNCTIONS ====================

// Load and display dashboard statistics
async function loadDashboardData() {
    try {
        console.log('Loading dashboard...');
        
        const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Dashboard data:', data);
        
        if (data.success) {
            updateDashboardStats(data.data);
            updateDashboardTables(data.data);
        } else {
            console.error('Dashboard response error:', data);
            showError('Error loading dashboard data');
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Error loading dashboard data: ' + error.message);
    }
}

// Update dashboard statistics cards
function updateDashboardStats(data) {
    console.log('Updating dashboard statistics:', data);
    
    const totalClients = document.getElementById('total-clients');
    const totalInvoices = document.getElementById('total-invoices');
    const totalTransactions = document.getElementById('total-transactions');
    const totalRevenue = document.getElementById('total-revenue');
    
    if (totalClients) totalClients.textContent = data.general.total_clientes || '0';
    if (totalInvoices) totalInvoices.textContent = data.general.total_facturas || '0';
    if (totalTransactions) totalTransactions.textContent = data.general.total_transacciones || '0';
    if (totalRevenue) totalRevenue.textContent = formatCurrency(data.invoices.total_facturado || 0);
}

// Update dashboard tables (top clients and recent invoices)
function updateDashboardTables(data) {
    console.log('Updating dashboard tables:', data);
    
    // Top 5 Clients table
    const topClientsTable = document.getElementById('top-clients-table');
    if (topClientsTable) {
        const tbody = topClientsTable.getElementsByTagName('tbody')[0];
        if (tbody) {
            tbody.innerHTML = '';
            
            if (data.topClients && data.topClients.length > 0) {
                data.topClients.forEach(client => {
                    const row = tbody.insertRow();
                    row.innerHTML = `
                        <td>${client.nombre || 'N/A'}</td>
                        <td>${formatCurrency(client.total_facturado || 0)}</td>
                    `;
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="2">No data available</td></tr>';
            }
        }
    }
    
    // Recent Invoices table
    const recentInvoicesTable = document.getElementById('recent-invoices-table');
    if (recentInvoicesTable) {
        const tbody = recentInvoicesTable.getElementsByTagName('tbody')[0];
        if (tbody) {
            tbody.innerHTML = '';
            
            if (data.recentInvoices && data.recentInvoices.length > 0) {
                data.recentInvoices.forEach(invoice => {
                    const row = tbody.insertRow();
                    row.innerHTML = `
                        <td>${invoice.invoice_number || 'N/A'}</td>
                        <td>${invoice.cliente_nombre || 'N/A'}</td>
                        <td>${formatCurrency(invoice.invoiced_amount || 0)}</td>
                    `;
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="3">No data available</td></tr>';
            }
        }
    }
}

// ==================== CLIENTS FUNCTIONS ====================

// Load and display all clients
async function loadClients() {
    try {
        console.log('Loading clients...');
        
        const response = await fetch(`${API_BASE_URL}/clientes`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Clients data:', data);
        
        if (data.success) {
            displayClients(data.data);
        } else {
            console.error('Clients response error:', data);
            showError('Error loading clients');
        }
    } catch (error) {
        console.error('Error loading clients:', error);
        showError('Error loading clients: ' + error.message);
    }
}

// Display clients in the table
function displayClients(clients) {
    console.log('Displaying clients:', clients);
    
    const tbody = document.getElementById('clients-tbody');
    if (tbody) {
        tbody.innerHTML = '';
        
        if (clients && clients.length > 0) {
            clients.forEach(client => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${client.nombre || 'N/A'}</td>
                    <td>${client.correo || 'N/A'}</td>
                    <td>${client.telefono || 'N/A'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="editClient('${client.id}')">Edit</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteClient('${client.id}')">Delete</button>
                    </td>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4">No clients available</td></tr>';
        }
    }
}

// Open client modal for creating or editing
function openClientModal(clientId = null) {
    currentEditingId = clientId;
    const modal = new bootstrap.Modal(document.getElementById('clientModal'));
    const title = document.getElementById('clientModalTitle');
    
    if (clientId) {
        title.textContent = 'Edit Client';
        loadClientData(clientId);
    } else {
        title.textContent = 'New Client';
        document.getElementById('clientForm').reset();
    }
    
    modal.show();
}

// Load specific client data for editing
async function loadClientData(clientId) {
    try {
        const response = await fetch(`${API_BASE_URL}/clientes/${clientId}`);
        const data = await response.json();
        
        if (data.success) {
            const client = data.data;
            document.getElementById('clientName').value = client.nombre || '';
            document.getElementById('clientEmail').value = client.correo || '';
            document.getElementById('clientPhone').value = client.telefono || '';
        }
    } catch (error) {
        console.error('Error loading client data:', error);
        showError('Error loading client data');
    }
}

// Handle client form submission (create or update)
async function handleClientSubmit(e) {
    e.preventDefault();
    
    const formData = {
        nombre: document.getElementById('clientName').value,
        correo: document.getElementById('clientEmail').value,
        telefono: document.getElementById('clientPhone').value
    };
    
    try {
        const url = currentEditingId 
            ? `${API_BASE_URL}/clientes/${currentEditingId}`
            : `${API_BASE_URL}/clientes`;
        
        const method = currentEditingId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(currentEditingId ? 'Client updated successfully' : 'Client created successfully');
            bootstrap.Modal.getInstance(document.getElementById('clientModal')).hide();
            loadClients();
            loadDashboardData();
        } else {
            showError(data.message || 'Error processing client');
        }
    } catch (error) {
        console.error('Error processing client:', error);
        showError('Error processing client');
    }
}

// Edit client function (called from table)
async function editClient(clientId) {
    openClientModal(clientId);
}

// Delete client function
async function deleteClient(clientId) {
    if (!confirm('Are you sure you want to delete this client?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/clientes/${clientId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Client deleted successfully');
            loadClients();
            loadDashboardData();
        } else {
            showError(data.message || 'Error deleting client');
        }
    } catch (error) {
        console.error('Error deleting client:', error);
        showError('Error deleting client');
    }
}

// Filter clients based on search input
function filterClients() {
    const searchTerm = document.getElementById('client-search').value.toLowerCase();
    const tbody = document.getElementById('clients-tbody');
    
    if (tbody) {
        const rows = tbody.getElementsByTagName('tr');
        
        Array.from(rows).forEach(row => {
            const cells = row.getElementsByTagName('td');
            if (cells.length === 0) return;
            
            const name = cells[0].textContent.toLowerCase();
            const email = cells[1].textContent.toLowerCase();
            
            const matchesSearch = name.includes(searchTerm) || email.includes(searchTerm);
            row.style.display = matchesSearch ? '' : 'none';
        });
    }
}

// ==================== INVOICES FUNCTIONS ====================

// Load and display all invoices
async function loadInvoices() {
    try {
        console.log('Loading invoices...');
        
        const response = await fetch(`${API_BASE_URL}/invoices`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Invoices data:', data);
        
        if (data.success) {
            displayInvoices(data.data);
        } else {
            console.error('Invoices response error:', data);
            showError('Error loading invoices');
        }
    } catch (error) {
        console.error('Error loading invoices:', error);
        showError('Error loading invoices: ' + error.message);
    }
}

// Display invoices in the table
function displayInvoices(invoices) {
    console.log('Displaying invoices:', invoices);
    
    const tbody = document.getElementById('invoices-tbody');
    if (tbody) {
        tbody.innerHTML = '';
        
        if (invoices && invoices.length > 0) {
            invoices.forEach(invoice => {
                const row = tbody.insertRow();
                const status = getInvoiceStatus(invoice.invoiced_amount, invoice.amount_paid);
                row.innerHTML = `
                    <td>${invoice.invoice_number || 'N/A'}</td>
                    <td>${invoice.cliente_nombre || 'N/A'}</td>
                    <td>${formatCurrency(invoice.invoiced_amount || 0)}</td>
                    <td><span class="badge bg-${status.color}">${status.text}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="editInvoice('${invoice.invoice_number}')">Edit</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteInvoice('${invoice.invoice_number}')">Delete</button>
                    </td>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5">No invoices available</td></tr>';
        }
    }
}

// Open invoice modal for creating or editing
function openInvoiceModal(invoiceNumber = null) {
    currentEditingId = invoiceNumber;
    const modal = new bootstrap.Modal(document.getElementById('invoiceModal'));
    const title = document.getElementById('invoiceModalTitle');
    
    // Always load client options first
    loadClientOptions().then(() => {
        if (invoiceNumber) {
            title.textContent = 'Edit Invoice';
            loadInvoiceData(invoiceNumber);
        } else {
            title.textContent = 'New Invoice';
            document.getElementById('invoiceForm').reset();
        }
        
        modal.show();
    });
}

// Load client options for invoice form
async function loadClientOptions() {
    try {
        const response = await fetch(`${API_BASE_URL}/clientes`);
        const data = await response.json();
        
        if (data.success) {
            const clientSelect = document.getElementById('invoiceClient');
            if (clientSelect) {
                clientSelect.innerHTML = '<option value="">Select client</option>';
                
                data.data.forEach(client => {
                    clientSelect.innerHTML += `<option value="${client.id}">${client.nombre}</option>`;
                });
            }
        }
        return Promise.resolve();
    } catch (error) {
        console.error('Error loading clients:', error);
        return Promise.reject(error);
    }
}

// Load specific invoice data for editing
async function loadInvoiceData(invoiceNumber) {
    try {
        const response = await fetch(`${API_BASE_URL}/invoices/${invoiceNumber}`);
        const data = await response.json();
        
        if (data.success) {
            const invoice = data.data;
            document.getElementById('invoiceClient').value = invoice.id_client || '';
            document.getElementById('invoiceAmount').value = invoice.invoiced_amount || '';
        }
    } catch (error) {
        console.error('Error loading invoice data:', error);
        showError('Error loading invoice data');
    }
}

// Handle invoice form submission (create or update)
async function handleInvoiceSubmit(e) {
    e.preventDefault();
    
    const formData = {
        id_client: document.getElementById('invoiceClient').value,
        invoiced_amount: parseFloat(document.getElementById('invoiceAmount').value) || 0,
        amount_paid: 0
    };
    
    try {
        const url = currentEditingId 
            ? `${API_BASE_URL}/invoices/${currentEditingId}`
            : `${API_BASE_URL}/invoices`;
        
        const method = currentEditingId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(currentEditingId ? 'Invoice updated successfully' : 'Invoice created successfully');
            bootstrap.Modal.getInstance(document.getElementById('invoiceModal')).hide();
            loadInvoices();
            loadDashboardData();
        } else {
            showError(data.message || 'Error processing invoice');
        }
    } catch (error) {
        console.error('Error processing invoice:', error);
        showError('Error processing invoice');
    }
}

// Edit invoice function (called from table)
async function editInvoice(invoiceNumber) {
    openInvoiceModal(invoiceNumber);
}

// Delete invoice function
async function deleteInvoice(invoiceNumber) {
    if (!confirm('Are you sure you want to delete this invoice?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/invoices/${invoiceNumber}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Invoice deleted successfully');
            loadInvoices();
            loadDashboardData();
        } else {
            showError(data.message || 'Error deleting invoice');
        }
    } catch (error) {
        console.error('Error deleting invoice:', error);
        showError('Error deleting invoice');
    }
}

// Filter invoices based on search input
function filterInvoices() {
    const searchTerm = document.getElementById('invoice-search').value.toLowerCase();
    const tbody = document.getElementById('invoices-tbody');
    
    if (tbody) {
        const rows = tbody.getElementsByTagName('tr');
        
        Array.from(rows).forEach(row => {
            const cells = row.getElementsByTagName('td');
            if (cells.length === 0) return;
            
            const number = cells[0].textContent.toLowerCase();
            const client = cells[1].textContent.toLowerCase();
            
            const matchesSearch = number.includes(searchTerm) || client.includes(searchTerm);
            row.style.display = matchesSearch ? '' : 'none';
        });
    }
}

// ==================== TRANSACTIONS FUNCTIONS ====================

// Load and display all transactions
async function loadTransactions() {
    try {
        console.log('Loading transactions...');
        
        const response = await fetch(`${API_BASE_URL}/transactions`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Transactions data:', data);
        
        if (data.success) {
            displayTransactions(data.data);
        } else {
            console.error('Transactions response error:', data);
            showError('Error loading transactions');
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        showError('Error loading transactions: ' + error.message);
    }
}

// Display transactions in the table
function displayTransactions(transactions) {
    console.log('Displaying transactions:', transactions);
    
    const tbody = document.getElementById('transactions-tbody');
    if (tbody) {
        tbody.innerHTML = '';
        
        if (transactions && transactions.length > 0) {
            transactions.forEach(transaction => {
                const row = tbody.insertRow();
                const statusClass = getTransactionStatusClass(transaction.status_transaction);
                
                row.innerHTML = `
                    <td>${transaction.id_transaction || 'N/A'}</td>
                    <td>${transaction.cliente_nombre || 'N/A'}</td>
                    <td>${formatCurrency(transaction.amount_transaction || 0)}</td>
                    <td><span class="badge bg-${statusClass}">${transaction.status_transaction || 'N/A'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="editTransaction('${transaction.id_transaction}')">Edit</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteTransaction('${transaction.id_transaction}')">Delete</button>
                    </td>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5">No transactions available</td></tr>';
        }
    }
}

// Open transaction modal for creating or editing
function openTransactionModal(transactionId = null) {
    currentEditingId = transactionId;
    const modal = new bootstrap.Modal(document.getElementById('transactionModal'));
    const title = document.getElementById('transactionModalTitle');
    
    // Always load client options first
    loadClientOptionsForTransaction().then(() => {
        if (transactionId) {
            title.textContent = 'Edit Transaction';
            loadTransactionData(transactionId);
        } else {
            title.textContent = 'New Transaction';
            document.getElementById('transactionForm').reset();
        }
        
        modal.show();
    });
}

// Load client options for transaction form
async function loadClientOptionsForTransaction() {
    try {
        const response = await fetch(`${API_BASE_URL}/clientes`);
        const data = await response.json();
        
        if (data.success) {
            const clientSelect = document.getElementById('transactionClient');
            if (clientSelect) {
                clientSelect.innerHTML = '<option value="">Select client</option>';
                
                data.data.forEach(client => {
                    clientSelect.innerHTML += `<option value="${client.id}">${client.nombre}</option>`;
                });
            }
        }
        return Promise.resolve();
    } catch (error) {
        console.error('Error loading clients:', error);
        return Promise.reject(error);
    }
}

// Load specific transaction data for editing
async function loadTransactionData(transactionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}`);
        const data = await response.json();
        
        if (data.success) {
            const transaction = data.data;
            document.getElementById('transactionClient').value = transaction.id_client || '';
            document.getElementById('transactionAmount').value = transaction.amount_transaction || '';
            document.getElementById('transactionStatus').value = transaction.status_transaction || '';
        }
    } catch (error) {
        console.error('Error loading transaction data:', error);
        showError('Error loading transaction data');
    }
}

// Handle transaction form submission (create or update)
async function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const formData = {
        id_client: document.getElementById('transactionClient').value,
        amount_transaction: parseFloat(document.getElementById('transactionAmount').value) || 0,
        status_transaction: document.getElementById('transactionStatus').value,
        type_transaction: 'Pago de Factura'
    };
    
    try {
        const url = currentEditingId 
            ? `${API_BASE_URL}/transactions/${currentEditingId}`
            : `${API_BASE_URL}/transactions`;
        
        const method = currentEditingId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(currentEditingId ? 'Transaction updated successfully' : 'Transaction created successfully');
            bootstrap.Modal.getInstance(document.getElementById('transactionModal')).hide();
            loadTransactions();
            loadDashboardData();
        } else {
            showError(data.message || 'Error processing transaction');
        }
    } catch (error) {
        console.error('Error processing transaction:', error);
        showError('Error processing transaction');
    }
}

// Edit transaction function (called from table)
async function editTransaction(transactionId) {
    openTransactionModal(transactionId);
}

// Delete transaction function
async function deleteTransaction(transactionId) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Transaction deleted successfully');
            loadTransactions();
            loadDashboardData();
        } else {
            showError(data.message || 'Error deleting transaction');
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        showError('Error deleting transaction');
    }
}

// Filter transactions based on search input
function filterTransactions() {
    const searchTerm = document.getElementById('transaction-search').value.toLowerCase();
    const tbody = document.getElementById('transactions-tbody');
    
    if (tbody) {
        const rows = tbody.getElementsByTagName('tr');
        
        Array.from(rows).forEach(row => {
            const cells = row.getElementsByTagName('td');
            if (cells.length === 0) return;
            
            const id = cells[0].textContent.toLowerCase();
            const client = cells[1].textContent.toLowerCase();
            
            const matchesSearch = id.includes(searchTerm) || client.includes(searchTerm);
            row.style.display = matchesSearch ? '' : 'none';
        });
    }
}

// ==================== PLATFORMS FUNCTIONS ====================

// Load and display all platforms
async function loadPlatforms() {
    try {
        console.log('Loading platforms...');
        
        const response = await fetch(`${API_BASE_URL}/platform`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Platforms data:', data);
        
        if (data.success) {
            displayPlatforms(data.data);
        } else {
            console.error('Platforms response error:', data);
            showError('Error loading platforms');
        }
    } catch (error) {
        console.error('Error loading platforms:', error);
        showError('Error loading platforms: ' + error.message);
    }
}

// Display platforms in the table
function displayPlatforms(platforms) {
    console.log('Displaying platforms:', platforms);
    
    const tbody = document.getElementById('platforms-tbody');
    if (tbody) {
        tbody.innerHTML = '';
        
        if (platforms && platforms.length > 0) {
            platforms.forEach(platform => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${platform.platform_name || 'N/A'}</td>
                    <td>${platform.clientes || 0}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="editPlatform('${platform.id}')">Edit</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deletePlatform('${platform.id}')">Delete</button>
                    </td>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="3">No platforms available</td></tr>';
        }
    }
}

// Open platform modal for creating or editing
function openPlatformModal(platformId = null) {
    currentEditingId = platformId;
    const modal = new bootstrap.Modal(document.getElementById('platformModal'));
    const title = document.getElementById('platformModalTitle');
    
    if (platformId) {
        title.textContent = 'Edit Platform';
        loadPlatformData(platformId);
    } else {
        title.textContent = 'New Platform';
        document.getElementById('platformForm').reset();
    }
    
    modal.show();
}

// Load specific platform data for editing
async function loadPlatformData(platformId) {
    try {
        const response = await fetch(`${API_BASE_URL}/platform/${platformId}`);
        const data = await response.json();
        
        if (data.success) {
            const platform = data.data;
            document.getElementById('platformName').value = platform.platform_name || '';
        }
    } catch (error) {
        console.error('Error loading platform data:', error);
        showError('Error loading platform data');
    }
}

// Handle platform form submission (create or update)
async function handlePlatformSubmit(e) {
    e.preventDefault();
    
    const formData = {
        platform_name: document.getElementById('platformName').value
    };
    
    try {
        const url = currentEditingId 
            ? `${API_BASE_URL}/platform/${currentEditingId}`
            : `${API_BASE_URL}/platform`;
        
        const method = currentEditingId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(currentEditingId ? 'Platform updated successfully' : 'Platform created successfully');
            bootstrap.Modal.getInstance(document.getElementById('platformModal')).hide();
            loadPlatforms();
            loadDashboardData();
        } else {
            showError(data.message || 'Error processing platform');
        }
    } catch (error) {
        console.error('Error processing platform:', error);
        showError('Error processing platform');
    }
}

// Edit platform function (called from table)
async function editPlatform(platformId) {
    openPlatformModal(platformId);
}

// Delete platform function
async function deletePlatform(platformId) {
    if (!confirm('Are you sure you want to delete this platform?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/platform/${platformId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Platform deleted successfully');
            loadPlatforms();
            loadDashboardData();
        } else {
            showError(data.message || 'Error deleting platform');
        }
    } catch (error) {
        console.error('Error deleting platform:', error);
        showError('Error deleting platform');
    }
}

// ==================== UTILITY FUNCTIONS ====================

// Show success message to user
function showSuccess(message) {
    console.log('Success:', message);
    
    const alert = document.createElement('div');
    alert.className = 'alert alert-success alert-dismissible fade show';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.main-content .container');
    if (container) {
        container.insertBefore(alert, container.firstChild);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 3000);
    }
}

// Show error message to user
function showError(message) {
    console.error('Error:', message);
    
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.main-content .container');
    if (container) {
        container.insertBefore(alert, container.firstChild);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
    }
}

// Format currency values
function formatCurrency(amount) {
    if (!amount || isNaN(amount)) return '$0';
    
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

// Get invoice status based on amounts
function getInvoiceStatus(invoicedAmount, amountPaid) {
    const invoiced = parseFloat(invoicedAmount) || 0;
    const paid = parseFloat(amountPaid) || 0;
    
    if (paid >= invoiced) {
        return { text: 'Paid', color: 'success' };
    } else if (paid > 0) {
        return { text: 'Partial', color: 'warning' };
    } else {
        return { text: 'Pending', color: 'danger' };
    }
}

// Get transaction status CSS class
function getTransactionStatusClass(status) {
    switch (status) {
        case 'Completada':
            return 'success';
        case 'Pendiente':
            return 'warning';
        case 'Fallida':
            return 'danger';
        default:
            return 'info';
    }
}

// Debounce function for search inputs
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions for global use
window.openClientModal = openClientModal;
window.openInvoiceModal = openInvoiceModal;
window.openTransactionModal = openTransactionModal;
window.openPlatformModal = openPlatformModal;
window.editClient = editClient;
window.deleteClient = deleteClient;
window.editInvoice = editInvoice;
window.deleteInvoice = deleteInvoice;
window.editTransaction = editTransaction;
window.deleteTransaction = deleteTransaction;
window.editPlatform = editPlatform;
window.deletePlatform = deletePlatform;
