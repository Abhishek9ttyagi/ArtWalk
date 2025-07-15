require('dotenv').config();
const express = require('express');
const cors = require('cors');
const tours = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Use CORS to allow our frontend to make requests to this backend
app.use(cors());

// The main API endpoint to get all tour data
app.get('/api/tours', (req, res) => {
    res.json(tours);
});

app.listen(PORT, () => {
    console.log(`ArtWalk backend running on http://localhost:${PORT}`);
});