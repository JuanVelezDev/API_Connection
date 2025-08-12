import { db } from '../config/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadFinancialData() {
    try {
        console.log('📊 Cargando datos financieros desde archivos CSV...');

        // Load clientes data
        console.log('👥 Cargando datos de clientes...');
        const clientesPath = path.join(__dirname, '../../data/Clientes.csv');
        const clientesData = fs.readFileSync(clientesPath, 'utf-8');
        const clientesLines = clientesData.split('\n').slice(1); // Skip header

        for (const line of clientesLines) {
            if (line.trim()) {
                const [nombre, id, direccion, correo, numeroIdentificacion, telefono, idPlatform] = line.split(',');
                
                // Clean up the data
                const cleanNombre = nombre?.replace(/"/g, '').trim();
                const cleanId = id?.trim();
                const cleanDireccion = direccion?.replace(/"/g, '').trim();
                const cleanCorreo = correo?.trim();
                const cleanNumeroIdentificacion = numeroIdentificacion?.trim();
                const cleanTelefono = telefono?.trim();
                const cleanIdPlatform = idPlatform?.trim();

                if (cleanId && cleanNombre) {
                    await db.query(`
                        INSERT INTO clientes (id, nombre, direccion, correo, numero_identificacion, telefono, id_platform)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        ON CONFLICT (id) DO UPDATE SET
                        nombre = EXCLUDED.nombre,
                        direccion = EXCLUDED.direccion,
                        correo = EXCLUDED.correo,
                        numero_identificacion = EXCLUDED.numero_identificacion,
                        telefono = EXCLUDED.telefono,
                        id_platform = EXCLUDED.id_platform
                    `, [cleanId, cleanNombre, cleanDireccion, cleanCorreo, cleanNumeroIdentificacion, cleanTelefono, cleanIdPlatform]);
                }
            }
        }

        console.log(' Datos de clientes cargados exitosamente');

        // Load invoices data
        console.log('🧾 Cargando datos de facturas...');
        const invoicesPath = path.join(__dirname, '../../data/Invoices.csv');
        const invoicesData = fs.readFileSync(invoicesPath, 'utf-8');
        const invoicesLines = invoicesData.split('\n').slice(1); // Skip header

        for (const line of invoicesLines) {
            if (line.trim()) {
                const [invoiceNumber, idClient, billingPeriod, invoicedAmount, amountPaid] = line.split(',');
                
                const cleanInvoiceNumber = invoiceNumber?.trim();
                const cleanIdClient = idClient?.trim();
                const cleanBillingPeriod = billingPeriod?.trim();
                const cleanInvoicedAmount = parseFloat(invoicedAmount) || 0;
                const cleanAmountPaid = parseFloat(amountPaid) || 0;

                if (cleanInvoiceNumber && cleanIdClient) {
                    await db.query(`
                        INSERT INTO invoices (invoice_number, id_client, billing_period, invoiced_amount, amount_paid)
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (invoice_number) DO UPDATE SET
                        id_client = EXCLUDED.id_client,
                        billing_period = EXCLUDED.billing_period,
                        invoiced_amount = EXCLUDED.invoiced_amount,
                        amount_paid = EXCLUDED.amount_paid
                    `, [cleanInvoiceNumber, cleanIdClient, cleanBillingPeriod, cleanInvoicedAmount, cleanAmountPaid]);
                }
            }
        }

        console.log(' Datos de facturas cargados exitosamente');

        // Load transactions data
        console.log(' Cargando datos de transacciones...');
        const transactionsPath = path.join(__dirname, '../../data/transactions.csv');
        const transactionsData = fs.readFileSync(transactionsPath, 'utf-8');
        const transactionsLines = transactionsData.split('\n').slice(1); // Skip header

        for (const line of transactionsLines) {
            if (line.trim()) {
                const [idTransaction, idClient, dateTimeTransaction, amountTransaction, statusTransaction, typeTransaction] = line.split(',');
                
                const cleanIdTransaction = idTransaction?.trim();
                const cleanIdClient = idClient?.trim();
                const cleanDateTimeTransaction = dateTimeTransaction?.trim();
                const cleanAmountTransaction = parseFloat(amountTransaction) || 0;
                const cleanStatusTransaction = statusTransaction?.trim();
                const cleanTypeTransaction = typeTransaction?.trim();

                if (cleanIdTransaction && cleanIdClient) {
                    await db.query(`
                        INSERT INTO transactions (id_transaction, id_client, date_time_transaction, amount_transaction, status_transaction, type_transaction)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        ON CONFLICT (id_transaction) DO UPDATE SET
                        id_client = EXCLUDED.id_client,
                        date_time_transaction = EXCLUDED.date_time_transaction,
                        amount_transaction = EXCLUDED.amount_transaction,
                        status_transaction = EXCLUDED.status_transaction,
                        type_transaction = EXCLUDED.type_transaction
                    `, [cleanIdTransaction, cleanIdClient, cleanDateTimeTransaction, cleanAmountTransaction, cleanStatusTransaction, cleanTypeTransaction]);
                }
            }
        }

        console.log('✅ Datos de transacciones cargados exitosamente');

        // Get summary statistics
        const clientesCount = await db.query('SELECT COUNT(*) FROM clientes');
        const invoicesCount = await db.query('SELECT COUNT(*) FROM invoices');
        const transactionsCount = await db.query('SELECT COUNT(*) FROM transactions');

        console.log('📊 Resumen de datos cargados:');
        console.log(`   - ${clientesCount.rows[0].count} clientes`);
        console.log(`   - ${invoicesCount.rows[0].count} facturas`);
        console.log(`   - ${transactionsCount.rows[0].count} transacciones`);

        console.log('🎉 Todos los datos financieros han sido cargados exitosamente!');

    } catch (error) {
        console.error('❌ Error cargando datos financieros:', error);
        process.exit(1);
    } finally {
        await db.end();
    }
}

loadFinancialData();
