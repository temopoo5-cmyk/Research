const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth')(db));
app.use('/api/research', require('./routes/research')(db));
app.use('/api/users', require('./routes/users')(db));
app.use('/api/programs', require('./routes/programs')(db));
app.use('/api/categories', require('./routes/categories')(db));
app.use('/api/stats', require('./routes/stats')(db));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
