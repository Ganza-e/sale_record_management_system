import express from 'express';
import mysql from 'mysql2';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static('public'));


const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database: ', err);
        return;
    }
    console.log('Connected to MySQL SRMS Database successfully!');
});



const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access Denied: Token Missing' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or Expired Token' });
        req.user = user;
        next();
    });
};




app.post('/api/auth/register', async (req, res) => {
    const { firstName, lastName, telephone, address, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO Customer (firstName, lastName, telephone, address, password) VALUES (?, ?, ?, ?, ?)';
        
        db.query(query, [firstName, lastName, telephone, address, hashedPassword], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: 'Customer registered successfully!' });
        });
    } catch {
        res.status(500).json({ message: 'Server registration error' });
    }
});


app.post('/api/auth/login', (req, res) => {
    const { CustomerNumber, password } = req.body;
    const query = 'SELECT * FROM Customer WHERE CustomerNumber = ?';

    db.query(query, [CustomerNumber], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Customer not found' });

        const customer = results[0];
        const isMatch = await bcrypt.compare(password, customer.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid password credentials' });

        const token = jwt.sign({ id: customer.CustomerNumber }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful', token });
    });
});




app.get('/api/customers', (req, res) => {
    db.query('SELECT CustomerNumber, firstName, lastName, telephone, address FROM Customer', (err, data) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(data);
    });
});

app.put('/api/customers/:id', authenticateToken, (req, res) => {
    const { firstName, lastName, telephone, address } = req.body;
    const query = 'UPDATE Customer SET firstName = ?, lastName = ?, telephone = ?, address = ? WHERE CustomerNumber = ?';
    db.query(query, [firstName, lastName, telephone, address, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Customer profile updated successfully' });
    });
});

app.delete('/api/customers/:id', authenticateToken, (req, res) => {
    db.query('DELETE FROM Customer WHERE CustomerNumber = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Customer account deleted' });
    });
});



app.post('/api/products', (req, res) => {
    const { productName, unitPrice } = req.body;
    const query = 'INSERT INTO Product (productName, unitPrice) VALUES (?, ?)';
    db.query(query, [productName, unitPrice], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Product added successfully', productCode: result.insertId });
    });
});

app.get('/api/products', (req, res) => {
    db.query('SELECT * FROM Product', (err, data) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(data);
    });
});

app.put('/api/products/:id', (req, res) => {
    const { productName, unitPrice } = req.body;
    const query = 'UPDATE Product SET productName = ?, unitPrice = ? WHERE ProductCode = ?';
    db.query(query, [productName, unitPrice, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Product metrics updated' });
    });
});

app.delete('/api/products/:id', (req, res) => {
    db.query('DELETE FROM Product WHERE ProductCode = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Product removed' });
    });
});



app.post('/api/sales', authenticateToken, (req, res) => {
    const { paymentMethod, totalAmountPaid, CustomerNumber, items } = req.body; 


    const saleQuery = 'INSERT INTO Sale (paymentMethod, totalAmountPaid, CustomerNumber) VALUES (?, ?, ?)';
    
    db.query(saleQuery, [paymentMethod, totalAmountPaid, CustomerNumber], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        const invoiceNumber = result.insertId;


        const itemValues = items.map(item => [invoiceNumber, item.ProductCode, item.quantitySold]);
        const itemsQuery = 'INSERT INTO Sale_Items (InvoiceNumber, ProductCode, quantitySold) VALUES ?';

        db.query(itemsQuery, [itemValues], (itemsErr) => {
            if (itemsErr) return res.status(500).json({ error: itemsErr.message });
            res.status(201).json({ message: 'Sale recorded cleanly!', InvoiceNumber: invoiceNumber });
        });
    });
});

app.get('/api/sales', (req, res) => {
    const query = `
        SELECT s.InvoiceNumber, s.salesDate, s.paymentMethod, s.totalAmountPaid, c.firstName, c.lastName 
        FROM Sale s 
        LEFT JOIN Customer c ON s.CustomerNumber = c.CustomerNumber
    `;
    db.query(query, (err, data) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(data);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running smoothly on port ${PORT}`);
});

// Serve frontend for non-API routes
app.get('/', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ message: 'API route not found' });
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});