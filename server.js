// server.js
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors'); // Needed if frontend runs on a different port/domain

const app = express();
const PORT = 3000;
const DB_FILE = 'db.json';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static frontend files (HTML, CSS, JS) from the current directory
app.use(express.static(__dirname));

// --- Data Persistence Functions ---
const readDB = () => {
    try {
        const data = fs.readFileSync(DB_FILE);
        return JSON.parse(data);
    } catch (e) {
        // If file doesn't exist or is invalid, return a default structure
        return { menuItems: [], orders: [] };
    }
};

const writeDB = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// --- API Endpoints ---

// 1. GET Menu Items
app.get('/api/menu', (req, res) => {
    const db = readDB();
    res.json(db.menuItems);
});

// 2. GET Orders (Staff View)
app.get('/api/orders', (req, res) => {
    const db = readDB();
    // Return orders sorted by status (pending first)
    const sortedOrders = [...db.orders].sort((a, b) => {
        const statusOrder = { 'pending': 1, 'preparing': 2, 'ready': 3, 'delivered': 4 };
        return statusOrder[a.status] - statusOrder[b.status];
    });
    res.json(sortedOrders);
});

// 3. POST New Order (Student View)
app.post('/api/orders', (req, res) => {
    const db = readDB();
    const newOrder = req.body;

    // Basic validation and generation of ID/Time
    newOrder.id = Date.now();
    newOrder.status = 'pending';
    newOrder.orderTime = new Date().toLocaleTimeString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit' });

    db.orders.push(newOrder);
    writeDB(db);
    
    res.status(201).json({ 
        message: 'Order placed successfully!', 
        orderId: newOrder.id.toString().slice(-4) 
    });
});

// 4. PUT Update Order Status (Staff View)
app.put('/api/orders/:id', (req, res) => {
    const orderId = parseInt(req.params.id);
    const { newStatus } = req.body;
    const db = readDB();
    
    const orderIndex = db.orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
        return res.status(404).json({ message: 'Order not found' });
    }

    db.orders[orderIndex].status = newStatus;
    
    // Remove 'delivered' orders from the list shown to staff
    if (newStatus === 'delivered') {
        db.orders.splice(orderIndex, 1);
    }
    
    writeDB(db);
    res.json({ message: `Order #${orderId.toString().slice(-4)} status updated to ${newStatus}` });
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`\n🎉 Server running on http://localhost:${PORT}`);
    console.log(`\nFrontend Entry: http://localhost:${PORT}/index.html`);
    console.log(`Staff Dashboard: http://localhost:${PORT}/staff_dashboard.html`);
    console.log(`Student Dashboard: http://localhost:${PORT}/student_dashboard.html\n`);
});