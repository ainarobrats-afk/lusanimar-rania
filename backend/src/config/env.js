import dotenv from 'dotenv';
dotenv.config();

const env = {
	PORT: process.env.PORT || '5000',
	NODE_ENV: process.env.NODE_ENV || 'development',
	MONGODB_URI: process.env.MONGODB_URI || '',
	SUPABASE_URL: process.env.SUPABASE_URL || '',
	SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
	SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
	JWT_SECRET: process.env.JWT_SECRET || 'SuperSecretKey12345!@#$%^&*()_+',
	JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
	FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
	XENDIT_SECRET_KEY: process.env.XENDIT_SECRET_KEY || '',
	GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
};

export default env;
