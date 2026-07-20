const Joi = require('joi');

const itemSchema = Joi.object({
    name: Joi.string().trim().min(1).max(255).required().messages({
        'string.empty': 'Item name is required',
        'string.max': 'Item name must be at most 255 characters'
    }),
    price: Joi.number().min(0).max(999999.99).precision(2).allow(null, '').default(0.00),
    quantity: Joi.number().integer().min(1).max(999999).allow(null, '').default(1),
    category: Joi.string().trim().max(100).allow(null, '').default(null),
    date: Joi.string().allow(null, ''),
    bought_date: Joi.string().allow(null, '')
});

const updateItemSchema = Joi.object({
    name: Joi.string().trim().min(1).max(255),
    price: Joi.number().min(0).max(999999.99).precision(2).allow(null, ''),
    quantity: Joi.number().integer().min(1).max(999999).allow(null, ''),
    category: Joi.string().trim().max(100).allow(null, ''),
    date: Joi.string().allow(null, ''),
    bought_date: Joi.string().allow(null, '')
}).min(1).messages({ 'object.min': 'At least one field must be provided for update' });

const createUserSchema = Joi.object({
    username: Joi.string().trim().min(3).max(50).required().messages({
        'string.min': 'Username must be at least 3 characters',
        'string.max': 'Username must be at most 50 characters',
        'any.required': 'Username is required'
    }),
    password: Joi.string().min(4).max(128).required().messages({
        'string.min': 'Password must be at least 4 characters',
        'any.required': 'Password is required'
    }),
    isAdmin: Joi.boolean().default(false)
});

const updateUserSchema = Joi.object({
    username: Joi.string().trim().min(3).max(50),
    newUsername: Joi.string().trim().min(3).max(50),
    password: Joi.string().min(4).max(128).allow(null, ''),
    isAdmin: Joi.boolean()
}).min(1).messages({ 'object.min': 'At least one field must be provided for update' });

const loginSchema = Joi.object({
    username: Joi.string().trim().min(1).required().messages({ 'any.required': 'Username is required' }),
    password: Joi.string().min(1).required().messages({ 'any.required': 'Password is required' })
});

function validate(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            const messages = error.details.map(d => d.message).join('; ');
            return res.status(400).json({ error: messages });
        }
        req.body = value;
        next();
    };
}

module.exports = {
    validate,
    itemSchema,
    updateItemSchema,
    createUserSchema,
    updateUserSchema,
    loginSchema
};
