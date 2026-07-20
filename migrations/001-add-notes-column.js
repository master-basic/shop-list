module.exports = {
    name: '001-add-notes-column',
    up: async (conn) => {
        const rows = await conn.query("SHOW COLUMNS FROM items LIKE 'notes'");
        if (rows.length === 0) {
            await conn.query("ALTER TABLE items ADD COLUMN notes TEXT DEFAULT NULL");
        }
    },
    down: async (conn) => {
        await conn.query("ALTER TABLE items DROP COLUMN notes");
    }
};