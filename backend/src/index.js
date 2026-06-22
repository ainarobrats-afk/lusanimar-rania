import env from './config/env.js';
import app from './server.js';
import { connectDB } from './config/database.js';

const PORT = parseInt(env.PORT, 10) || 5000;

(async () => {
	await connectDB();
	app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
})();
