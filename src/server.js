const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Simple File-based DB
let db = {
    users: [],
    workouts: {},
    weights: {},
    chat: []
};

// Load DB
if (fs.existsSync(DB_FILE)) {
    try {
        db = JSON.parse(fs.readFileSync(DB_FILE));
    } catch (e) {
        console.error('Error loading DB:', e);
    }
}

const saveDB = () => {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
};

// Routes

// Auth
app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'User already exists' });
    }
    const newUser = { id: Math.random().toString(36).substr(2, 9), name, email, password, role: 'student', joined: new Date() };
    db.users.push(newUser);
    saveDB();
    res.json(newUser);
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    // Admin Backdoor
    if (email === 'admin' && password === 'admin') {
        return res.json({ id: 'admin', name: 'Treinador', email: 'admin', role: 'admin' });
    }

    const user = db.users.find(u => u.email === email && u.password === password);
    if (user) {
        res.json(user);
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Data
app.get('/api/data/:userId', (req, res) => {
    const { userId } = req.params;
    res.json({
        workouts: db.workouts[userId] || {},
        weights: db.weights[userId] || [],
        chat: db.chat.filter(m => m.userId === userId || m.to === userId)
    });
});

app.post('/api/workouts', (req, res) => {
    const { userId, dateKey, status } = req.body;
    if (!db.workouts[userId]) db.workouts[userId] = {};
    db.workouts[userId][dateKey] = status;
    saveDB();
    res.json({ success: true });
});

app.post('/api/weights', (req, res) => {
    const { userId, weight } = req.body;
    if (!db.weights[userId]) db.weights[userId] = [];
    db.weights[userId].push({ date: new Date(), weight });
    saveDB();
    res.json({ success: true });
});

app.post('/api/chat', (req, res) => {
    const { userId, sender, text } = req.body;
    const message = { userId, sender, text, timestamp: new Date() };
    db.chat.push(message);

    // Auto-reply simulation
    if (sender === 'student') {
        setTimeout(() => {
            db.chat.push({
                userId,
                sender: 'trainer',
                text: 'Olá! Recebi sua mensagem. Como posso ajudar?',
                timestamp: new Date()
            });
            saveDB();
        }, 1000);
    }

    saveDB();
    res.json({ success: true });
});

// Admin
app.get('/api/users', (req, res) => {
    res.json(db.users.filter(u => u.role !== 'admin'));
});

app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    db.users = db.users.filter(u => u.id !== id);
    saveDB();
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
