const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

router.get('/', async (req, res) => {
    try {
        const includeArchived = req.query.includeArchived === 'true';
        const { startDate, endDate, category } = req.query;

        if (startDate || endDate || (category && category !== 'all')) {
            const rows = await db.getFilteredItems(startDate, endDate, category, includeArchived);
            return res.json(rows);
        }

        const items = await db.getItems(includeArchived);
        res.json(items);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', requireAuth, async (req, res) => {
    try {
        const { name, price, quantity, date, category } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Item name is required' });
        }

        const newItem = {
            name: name.trim(),
            date: new Date().toISOString().slice(0, 19).replace('T', ' '),
            bought_date: null,
            category: category || null,
            price: parseFloat(price) || 0.00,
            quantity: parseInt(quantity) || 1,
            created_by: req.username
        };

        const addedItem = await db.addItem(newItem);

        if (!addedItem) {
            return res.status(500).json({ error: 'Failed to create item' });
        }

        res.status(201).json({ success: true, item: addedItem });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.put('/:id/bought', requireAuth, async (req, res) => {
    try {
        const itemId = req.params.id;
        const item = await db.getItemById(itemId);

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        if (item.bought_date) {
            await db.unbuyItem(itemId);
            res.json({ id: itemId, bought: false, bought_by: null });
        } else {
            await db.markAsBought(itemId, req.username);
            res.json({ id: itemId, bought: true, bought_by: req.username });
        }
    } catch (error) {
        console.error('Error toggling bought status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/:id', requireAuth, async (req, res) => {
    try {
        const itemId = req.params.id;
        const currentItem = await db.getItemById(itemId);

        if (!currentItem) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const updatedItem = {
            id: itemId,
            name: req.body.name !== undefined ? req.body.name : currentItem.name,
            date: req.body.date !== undefined ? req.body.date : currentItem.date,
            bought_date: req.body.bought_date !== undefined ? req.body.bought_date : currentItem.bought_date,
            category: req.body.category !== undefined ? req.body.category : currentItem.category,
            price: req.body.price !== undefined ? parseFloat(req.body.price) : parseFloat(currentItem.price),
            quantity: req.body.quantity !== undefined ? parseInt(req.body.quantity) : parseInt(currentItem.quantity)
        };

        await db.updateItem(updatedItem);
        res.json({ success: true, item: updatedItem });
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const itemId = req.params.id;
        await db.archiveItem(itemId);
        res.json({ id: itemId, archived: true });
    } catch (error) {
        console.error('Error archiving item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/:id/restore', requireAuth, async (req, res) => {
    try {
        const itemId = req.params.id;
        await db.unarchiveItem(itemId);
        res.json({ id: itemId, archived: false });
    } catch (error) {
        console.error('Error restoring item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
