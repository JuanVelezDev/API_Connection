


DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS platform CASCADE;

-- Create platform table
CREATE TABLE platform (
    id VARCHAR(50) PRIMARY KEY,
    platform_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create clientes table
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

-- Create invoices table
CREATE TABLE invoices (
    invoice_number VARCHAR(50) PRIMARY KEY,
    id_client VARCHAR(50) NOT NULL REFERENCES clientes(id),
    billing_period VARCHAR(20),
    invoiced_amount DECIMAL(15,2),
    amount_paid DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE transactions (
    id_transaction VARCHAR(50) PRIMARY KEY,
    id_client VARCHAR(50) NOT NULL REFERENCES clientes(id),
    date_time_transaction TIMESTAMP,
    amount_transaction DECIMAL(15,2),
    status_transaction VARCHAR(50),
    type_transaction VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert platform data
INSERT INTO platform (id, platform_name) VALUES 
('1', 'Nequi'),
('2', 'Daviplata')
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clientes_platform ON clientes(id_platform);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(id_client);
CREATE INDEX IF NOT EXISTS idx_transactions_client ON transactions(id_client);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date_time_transaction);
CREATE INDEX IF NOT EXISTS idx_invoices_period ON invoices(billing_period);
