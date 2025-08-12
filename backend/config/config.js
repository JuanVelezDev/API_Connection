
export const config = {
    // Server configuration
    server: {
        port: 4000
    },
    
    // Database configuration (Supabase)
    database: {
        host: 'aws-0-us-east-2.pooler.supabase.com',
        user: 'postgres.izanqwxftprdyzrynnoc',
        password: 'jAF9TXNGtAzqUUai',
        database: 'postgres',
        port: 6543,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        max: 20
    },
    
    // Environment
    environment: 'development'
};

export default config;
