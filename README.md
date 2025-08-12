# SQLFinance - Financial Management System

## 📋 System Description

SQLFinance is a comprehensive financial management system designed to organize and structure financial information from Fintech platforms like Nequi and Daviplata. The system provides a complete CRUD (Create, Read, Update, Delete) interface for managing clients, invoices, transactions, and payment platforms, along with advanced analytical queries for financial reporting.

### 🎯 Key Features

- **Client Management**: Complete CRUD operations for client information
- **Invoice Management**: Track billing periods, amounts, and payment status
- **Transaction Tracking**: Monitor payment transactions with status and type
- **Platform Integration**: Support for multiple payment platforms (Nequi, Daviplata)
- **Advanced Analytics**: Pre-built queries for financial reporting
- **Real-time Dashboard**: Visual representation of key metrics
- **RESTful API**: Complete API for integration with other systems

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database 
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SQLFinance
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure database connection**
   - Update `backend/config/config.js` with your Supabase credentials
   - Or use the provided configuration for testing

4. **Setup database**
   ```bash
   npm run db:setup
   ```

5. **Load sample data**
   ```bash
   npm run db:load
   ```

6. **Start the application**
   ```bash
   npm start
   ```

7. **Access the application**
   - Frontend: http://localhost:4000
   

## 🛠️ Technologies Used

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework for API development
- **PostgreSQL**: Primary database (via Supabase)
- **pg**: PostgreSQL client for Node.js
- **CORS**: Cross-origin resource sharing

### Frontend
- **HTML5**: Structure and semantics
- **CSS3**: Styling and responsive design
- **Bootstrap 5**: UI framework for modern design
- **Vanilla JavaScript**: Client-side functionality


### Database
- **Supabase**: PostgreSQL hosting and management
- **SQL**: Query language for data manipulation

### Development Tools
- **Git**: Version control
- **npm**: Package management
- **nodemon**: Development server with auto-reload

## 🗄️ Database Normalization

### Normalization Process

The database follows **Third Normal Form (3NF)** to eliminate data redundancy and ensure data integrity:

#### **1NF (First Normal Form)**
- All attributes contain atomic values
- No repeating groups or arrays
- Primary keys are defined for each table

#### **2NF (Second Normal Form)**
- All non-key attributes are fully dependent on the primary key
- No partial dependencies exist

#### **3NF (Third Normal Form)**
- No transitive dependencies
- Platform information is separated from client data
- Each table has a single responsibility

### Table Structure

```sql
-- Platform table (Independent entity)
CREATE TABLE platform (
    id VARCHAR(50) PRIMARY KEY,
    platform_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients table (Depends on platform)
CREATE TABLE clientes (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    direccion TEXT,
    correo VARCHAR(255),
    numero_identificacion VARCHAR(50),
    telefono VARCHAR(50),
    id_platform VARCHAR(50) REFERENCES platform(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table (Depends on clients)
CREATE TABLE invoices (
    invoice_number VARCHAR(50) PRIMARY KEY,
    id_client VARCHAR(50) NOT NULL REFERENCES clientes(id),
    billing_period VARCHAR(20),
    invoiced_amount DECIMAL(15,2),
    amount_paid DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table (Depends on clients)
CREATE TABLE transactions (
    id_transaction VARCHAR(50) PRIMARY KEY,
    id_client VARCHAR(50) NOT NULL REFERENCES clientes(id),
    date_time_transaction TIMESTAMP,
    amount_transaction DECIMAL(15,2),
    status_transaction VARCHAR(50),
    type_transaction VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Benefits of Normalization

- **Data Integrity**: Foreign key constraints prevent orphaned records
- **Elimination of Redundancy**: Platform information stored once
- **Easier Maintenance**: Changes to platform data affect all related records
- **Query Performance**: Optimized indexes on foreign keys
- **Scalability**: Easy to add new platforms or modify existing ones

## 📊 CSV Bulk Loading

### Supported CSV Files

The system supports bulk loading from the following CSV files:

1. **Clientes.csv**: Client information
2. **Invoices.csv**: Invoice data
3. **transactions.csv**: Transaction records
4. **platform.csv**: List of platforms

### CSV Loading Process

```bash
# Load all data from CSV files
npm run db:load
```

### CSV File Structure

#### Clientes.csv
```csv
Nombre del Cliente,ID,Dirección,Correo,Numero de Identificacion,Telefono,ID Platform
Angel Daniel,1,"USNS Davis FPO AP 78518",rmiller@boyer.com,149186547,(873)222-2692x09480,1
```

#### Invoices.csv
```csv
invoice_number,id_client,billing_period,invoiced_amount,amount_paid
INV-001,1,2024-01,150000,150000
```

#### transactions.csv
```csv
id_transaction,id_client,date_time_transaction,amount_transaction,status_transaction,type_transaction
TXN-001,1,2024-01-15 10:30:00,150000,Completada,Pago de Factura
```

### Loading Features

- **Automatic Data Cleaning**: Removes quotes and trims whitespace
- **Conflict Resolution**: Uses `ON CONFLICT` for upsert operations
- **Error Handling**: Continues processing even if individual records fail
- **Progress Tracking**: Console output shows loading progress

## 🔍 Advanced Queries

### 1. Total Paid by Each Client

**Business Context**: "As a system administrator, I need to know how much each client has paid in total to track income and verify overall balances."

**Endpoint**: `GET /api/queries/total-paid-by-client`

**Query Logic**:
```sql
SELECT
    c.id,
    c.nombre as client_name,
    c.correo as client_email,
    p.platform_name,
    COALESCE(SUM(i.amount_paid), 0) as total_paid,
    COALESCE(SUM(i.invoiced_amount), 0) as total_invoiced,
    COALESCE(SUM(i.invoiced_amount) - SUM(i.amount_paid), 0) as pending_balance
FROM clientes c
LEFT JOIN platform p ON c.id_platform = p.id
LEFT JOIN invoices i ON c.id = i.id_client
GROUP BY c.id, c.nombre, c.correo, p.platform_name
ORDER BY total_paid DESC
```

### 2. Pending Invoices with Client Information

**Business Context**: "As a finance manager, I need to identify invoices that have not yet been fully paid, along with client name and associated transaction information, to manage collection or follow-up."

**Endpoint**: `GET /api/queries/pending-invoices`

**Query Logic**:
```sql
SELECT
    i.invoice_number,
    i.billing_period,
    i.invoiced_amount,
    i.amount_paid,
    (i.invoiced_amount - i.amount_paid) as pending_amount,
    c.nombre as client_name,
    c.correo as client_email,
    c.telefono as client_phone,
    p.platform_name,
    t.id_transaction,
    t.amount_transaction,
    t.status_transaction,
    t.date_time_transaction
FROM invoices i
LEFT JOIN clientes c ON i.id_client = c.id
LEFT JOIN platform p ON c.id_platform = p.id
LEFT JOIN transactions t ON i.id_client = t.id_client
    AND t.type_transaction = 'Pago de Factura'
WHERE i.amount_paid < i.invoiced_amount
ORDER BY (i.invoiced_amount - i.amount_paid) DESC
```

### 3. Transactions by Platform

**Business Context**: "As an analyst, I need to be able to see all transactions made from a specific platform (like Nequi or Daviplata), including which client they belong to and which invoice they are paying."

**Endpoint**: `GET /api/queries/transactions-by-platform/:platformId`

**Query Logic**:
```sql
SELECT
    t.id_transaction,
    t.amount_transaction,
    t.status_transaction,
    t.type_transaction,
    t.date_time_transaction,
    c.nombre as client_name,
    c.correo as client_email,
    i.invoice_number,
    i.invoiced_amount,
    i.amount_paid,
    p.platform_name
FROM transactions t
LEFT JOIN clientes c ON t.id_client = c.id
LEFT JOIN platform p ON c.id_platform = p.id
LEFT JOIN invoices i ON t.id_client = i.id_client
WHERE p.id = $1
ORDER BY t.date_time_transaction DESC
```

## 🗂️ Relational Model

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    platform     │     │    clientes     │     │    invoices     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │◄────┤ id (PK)         │◄────┤ invoice_number  │
│ platform_name   │     │ nombre          │     │ (PK)            │
│ created_at      │     │ direccion       │     │ id_client (FK)  │
└─────────────────┘     │ correo          │     │ billing_period  │
                        │ numero_identif. │     │ invoiced_amount │
                        │ telefono        │     │ amount_paid     │
                        │ id_platform(FK) │     │ created_at      │
                        │ created_at      │     └─────────────────┘
                        └─────────────────┘
                                 │
                                 │
                        ┌─────────────────┐
                        │  transactions   │
                        ├─────────────────┤
                        │ id_transaction  │
                        │ (PK)            │
                        │ id_client (FK)  │
                        │ date_time_trans │
                        │ amount_trans    │
                        │ status_trans    │
                        │ type_trans      │
                        │ created_at      │
                        └─────────────────┘
```

### Entity Relationships

- **platform** (1) ←→ (N) **clientes**: One platform can have many clients
- **clientes** (1) ←→ (N) **invoices**: One client can have many invoices
- **clientes** (1) ←→ (N) **transactions**: One client can have many transactions

### Key Constraints

- **Primary Keys**: Unique identifiers for each entity
- **Foreign Keys**: Maintain referential integrity
- **NOT NULL**: Required fields for data completeness
- **UNIQUE**: Platform names must be unique
- **DEFAULT**: Timestamps automatically set

## 📋 API Endpoints

### Health Check
- `GET /api/health` - System health status

### CRUD Operations

#### Clients
- `GET /api/clientes` - Get all clients
- `GET /api/clientes/:id` - Get client by ID
- `POST /api/clientes` - Create new client
- `PUT /api/clientes/:id` - Update client
- `DELETE /api/clientes/:id` - Delete client

#### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:invoiceNumber` - Get invoice by number
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:invoiceNumber` - Update invoice
- `DELETE /api/invoices/:invoiceNumber` - Delete invoice

#### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

#### Platforms
- `GET /api/platform` - Get all platforms
- `GET /api/platform/:id` - Get platform by ID
- `POST /api/platform` - Create new platform
- `PUT /api/platform/:id` - Update platform
- `DELETE /api/platform/:id` - Delete platform

### Advanced Queries
- `GET /api/queries/total-paid-by-client` - Total paid by each client
- `GET /api/queries/pending-invoices` - Pending invoices with client info
- `GET /api/queries/transactions-by-platform/:platformId` - Transactions by platform

### Dashboard
- `GET /api/dashboard/stats` - General statistics
- `GET /api/dashboard/charts` - Chart data
- `GET /api/dashboard/search` - General search

## 🛠️ Development Commands

```bash
# Start the application
npm start

# Development mode with auto-reload
npm run dev

# Setup database structure
npm run db:setup

# Load data from CSV files
npm run db:load

# Clean running processes
npm run clean

# Restart application
npm run restart
```

## 🔧 Configuration

### Database Configuration
Update `backend/config/config.js` with your database credentials:

```javascript
export const config = {
    server: {
        port: 4000
    },
    database: {
        host: 'your-supabase-host',
        user: 'your-username',
        password: 'your-password',
        database: 'postgres',
        port: 6543,
        ssl: { rejectUnauthorized: false }
    }
};
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify Supabase credentials in `config.js`
   - Check network connectivity
   - Ensure SSL configuration is correct

2. **Port Already in Use**
   ```bash
   npm run clean
   npm start
   ```

3. **CSV Loading Errors**
   - Verify CSV file format
   - Check file paths in `load-financial-data.js`
   - Ensure database tables exist

4. **Frontend Not Loading**
   - Check if backend is running on port 4000
   - Verify static file serving configuration
   - Check browser console for JavaScript errors


### Developer Information
- **Name**: Juan Velez
- **Clan**: Gosling 
- **Email**: juanes.jevj@gmail.com
- **Project**: SQLFinance - Financial Management System




