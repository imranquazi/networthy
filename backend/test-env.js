import dotenv from 'dotenv';

dotenv.config();

console.log('PG_CONNECTION_STRING:', process.env.PG_CONNECTION_STRING);
console.log('Connection string length:', process.env.PG_CONNECTION_STRING?.length);
console.log('First 50 chars:', process.env.PG_CONNECTION_STRING?.substring(0, 50)); 