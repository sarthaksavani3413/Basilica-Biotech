/* ============================================================
   BASILICA BIOTECH - COMPLETE EXPRESS BACKEND SERVER (SUPABASE)
   ============================================================ */

const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// ============================================================
// SUPABASE CLIENT INITIALIZATION
// ============================================================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// ============================================================
// STATIC FILES
// ============================================================

app.use(express.static(path.join(__dirname, '../frontend')));

// Gaurav Admin static files
app.use('/gaurav', express.static(path.join(__dirname, '../frontend/gaurav')));

// Uploads static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, '../frontend/uploads')));

app.use('/image', express.static(path.join(__dirname, '../frontend/image')));

// Public static files
app.use('/public', express.static(path.join(__dirname, 'public')));

// ============================================================
// HOME PAGE
// ============================================================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/index.html"));
});

// ============================================================
// PRODUCT DETAILS PAGE
// ============================================================

app.get('/personal-care-details/:slug.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'product-details.html'));
});

// ============================================================
// UPLOADS FOLDER
// ============================================================

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// ============================================================
// MULTER CONFIG
// ============================================================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// ============================================================
// SANITIZE ARRAY FIELD
// ============================================================

function sanitizeItemArray(input) {
    if (input === undefined || input === null) {
        return [];
    }
    if (typeof input === 'string') {
        try {
            input = JSON.parse(input);
        } catch (_) {
            return [];
        }
    }
    if (!Array.isArray(input)) {
        return [];
    }
    return input
        .filter(item => item && typeof item === 'object')
        .map(item => ({
            title: String(item.title || '').trim(),
            description: String(item.description || '').trim()
        }))
        .filter(item => item.title.length > 0);
}

// ============================================================
// SLUG GENERATION HELPER
// ============================================================

function generateSlug(name) {
    return String(name || '')
        .toLowerCase()
        .trim()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

const PRODUCT_CATEGORY_KEYS = [
    'skincare',
    'haircare',
    'personalcare',
    'bathsoap',
    'grooming'
];

const PRODUCT_ID_PREFIXES = {
    skincare: 'sk',
    haircare: 'hc',
    personalcare: 'pc',
    bathsoap: 'bs',
    grooming: 'gr'
};

function normalizeCategoryKey(category) {
    return String(category || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '');
}

function formatProduct(product) {
    return {
        id: product.id,
        name: product.name || '',
        description: product.description || '',
        image: product.image || '',
        slug: product.slug || generateSlug(product.name),
        keyIngredients: Array.isArray(product.ingredients) ? product.ingredients : [],
        keyBenefits: Array.isArray(product.benefits) ? product.benefits : []
    };
}

function getProductSortNumber(product) {
    const match = String(product.id || '').match(/-(\d+)$/);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function sortProductsById(products) {
    return products.sort((a, b) => {
        const numberDiff = getProductSortNumber(a) - getProductSortNumber(b);
        if (numberDiff !== 0) return numberDiff;
        return String(a.id || '').localeCompare(String(b.id || ''));
    });
}

function buildProductPayload(body, category) {
    const name = String(body.name || '').trim();

    return {
        name,
        description: String(body.description || '').trim(),
        image: String(body.image || '').trim(),
        ingredients: sanitizeItemArray(body.keyIngredients),
        benefits: sanitizeItemArray(body.keyBenefits),
        category: normalizeCategoryKey(category)
    };
}

function buildCategoryPayload(body) {
    return {
        id: String(body.id || '').trim(),
        name: String(body.name || '').trim(),
        description: String(body.description || '').trim(),
        image: String(body.image || '').trim(),
        link: String(body.link || '').trim()
    };
}

async function generateProductId(category) {
    const normalizedCategory = normalizeCategoryKey(category);
    const prefix = PRODUCT_ID_PREFIXES[normalizedCategory] || normalizedCategory.substring(0, 2) || 'pr';

    const { data: products, error } = await supabase
        .from('products')
        .select('id')
        .eq('category', normalizedCategory);

    if (error) throw error;

    let maxSuffix = 0;

    (products || []).forEach(product => {
        const match = String(product.id || '').match(new RegExp(`^${prefix}-(\\d+)$`));
        if (match) {
            maxSuffix = Math.max(maxSuffix, Number(match[1]));
        }
    });

    return `${prefix}-${maxSuffix + 1}`;
}

// ============================================================
// ADMIN LOGIN
// ============================================================

const ADMIN_USER = 'Gaurav';
const ADMIN_PASS = 'Basilica139@';

// ============================================================
// AUTH MIDDLEWARE
// ============================================================

function requireAuth(req, res, next) {
    if (req.session && req.session.isAdmin) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized. Please login.' });
    }
}

// ============================================================
// LOGIN API
// ============================================================

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USER && password === ADMIN_PASS) {
        req.session.isAdmin = true;
        res.json({
            success: true,
            message: 'Login successful!'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid username or password.'
        });
    }
});

// ============================================================
// AUTH CHECK
// ============================================================

app.get('/api/auth-check', (req, res) => {
    res.json({
        isAuthenticated: !!(req.session && req.session.isAdmin)
    });
});

// ============================================================
// LOGOUT
// ============================================================

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({
        success: true,
        message: 'Logged out successfully.'
    });
});

// ============================================================
// GET FULL SITE DATA (FROM SUPABASE)
// ============================================================

app.get('/api/site-data', async (req, res) => {
    try {
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('*')
            .order('id', { ascending: true });

        if (catError) throw catError;

        // Fetch Products
        const { data: products, error: prodError } = await supabase
            .from('products')
            .select('*')
            .order('id', { ascending: true });

        if (prodError) throw prodError;

        const groupedProducts = PRODUCT_CATEGORY_KEYS.reduce((acc, key) => {
            acc[key] = [];
            return acc;
        }, {});

        (products || []).forEach(product => {
            const category = normalizeCategoryKey(product.category);

            if (groupedProducts[category]) {
                groupedProducts[category].push(formatProduct(product));
            } else {
                groupedProducts[category] = [formatProduct(product)];
            }
        });

        Object.keys(groupedProducts).forEach(category => {
            groupedProducts[category] = sortProductsById(groupedProducts[category]);
        });

        res.json({
            categories: categories || [],
            products: groupedProducts
        });

    } catch (err) {
        console.error('Fetch site data error:', err);
        res.status(500).json({ error: 'Failed to read site data.' });
    }
});

// ============================================================
// GET SINGLE PRODUCT (FROM SUPABASE)
// ============================================================

app.get('/api/products/:category/:id', async (req, res) => {
    try {
        const { category, id } = req.params;

        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .eq('category', normalizeCategoryKey(category))
            .single();

        if (error || !product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        res.json(formatProduct(product));

    } catch (err) {
        console.error('Fetch single product error:', err);
        res.status(500).json({ error: 'Failed to fetch product.' });
    }
});

// ============================================================
// SLUG PRODUCT API (FROM SUPABASE)
// ============================================================

app.get('/api/products/slug/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const { data: products, error } = await supabase
            .from('products')
            .select('*');

        if (error) throw error;

        const product = (products || []).find(item =>
            generateSlug(item.slug || item.name) === slug
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        res.json(formatProduct(product));

    } catch (err) {
        console.error('Fetch product by slug error:', err);
        res.status(404).json({ error: "Product not found" });
    }
});

// ============================================================
// ADD PRODUCT (TO SUPABASE)
// ============================================================

app.post('/api/admin/products/:category', requireAuth, async (req, res) => {
    try {
        const { category } = req.params;
        const productPayload = buildProductPayload(req.body, category);

        if (!productPayload.name) {
            return res.status(400).json({ error: 'Product name is required.' });
        }

        const newId = req.body.id ? String(req.body.id).trim() : await generateProductId(category);

        if (!newId) {
            return res.status(400).json({ error: 'Product ID could not be generated.' });
        }

        const { data: existingProduct, error: existingError } = await supabase
            .from('products')
            .select('id')
            .eq('id', newId);

        if (existingError) throw existingError;

        if (existingProduct && existingProduct.length > 0) {
            return res.status(409).json({ error: `Product ID "${newId}" already exists.` });
        }

        const { data: insertedProduct, error: insertError } = await supabase
            .from('products')
            .insert({ id: newId, ...productPayload })
            .select()
            .single();

        if (insertError) throw insertError;

        res.json({
            success: true,
            message: 'Product added successfully!',
            data: formatProduct(insertedProduct)
        });

    } catch (err) {
        console.error('Add product error:', err);
        res.status(500).json({ error: 'Failed to add product.' });
    }
});

// ============================================================
// UPDATE PRODUCT (IN SUPABASE)
// ============================================================

app.put('/api/admin/products/:category/:id', requireAuth, async (req, res) => {
    try {
        const { category, id } = req.params;
        const updatedData = buildProductPayload(req.body, category);

        if (!updatedData.name) {
            return res.status(400).json({ error: 'Product name is required.' });
        }

        const { data: updatedProduct, error: updateError } = await supabase
            .from('products')
            .update(updatedData)
            .eq('id', id)
            .eq('category', normalizeCategoryKey(category))
            .select()
            .single();

        if (updateError) throw updateError;

        res.json({
            success: true,
            message: 'Product updated successfully!',
            data: formatProduct(updatedProduct)
        });

    } catch (err) {
        console.error('Update product error:', err);
        res.status(500).json({ error: 'Failed to update product.' });
    }
});

// ============================================================
// DELETE PRODUCT (FROM SUPABASE)
// ============================================================

app.delete('/api/admin/products/:category/:id', requireAuth, async (req, res) => {
    try {
        const { category, id } = req.params;

        // Fetch product first to delete its image from local filesystem if applicable
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('image')
            .eq('id', id)
            .eq('category', normalizeCategoryKey(category))
            .single();

        if (fetchError || !product) {
            return res.status(404).json({ success: false, error: 'Product not found.' });
        }

        // Delete from local filesystem if it's in uploads/
        if (product.image && product.image.startsWith('uploads/')) {
            const imagePath = path.join(__dirname, product.image);
            if (fs.existsSync(imagePath)) {
                try {
                    fs.unlinkSync(imagePath);
                    console.log('Image deleted successfully:', imagePath);
                } catch (imgErr) {
                    console.error('Image delete error:', imgErr);
                }
            }
        }

        // Delete from Supabase
        const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .eq('id', id)
            .eq('category', normalizeCategoryKey(category));

        if (deleteError) throw deleteError;

        res.json({
            success: true,
            message: 'Product and image deleted successfully!'
        });

    } catch (err) {
        console.error('Delete product error:', err);
        res.status(500).json({ success: false, error: 'Failed to delete product.' });
    }
});

// ============================================================
// IMAGE UPLOAD
// ============================================================

app.post('/api/admin/upload', requireAuth, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const filePath = 'uploads/' + req.file.filename;

        res.json({
            success: true,
            message: 'Image uploaded successfully!',
            path: filePath,
            filename: req.file.filename
        });

    } catch (err) {
        console.error('Upload image error:', err);
        res.status(500).json({ error: 'Failed to upload image.' });
    }
});

// ============================================================
// CATEGORY CRUD ENDPOINTS (SUPABASE)
// ============================================================

app.post('/api/admin/categories', requireAuth, async (req, res) => {
    try {
        const newCategory = buildCategoryPayload(req.body);

        if (!newCategory.id || !newCategory.name) {
            return res.status(400).json({ error: 'Category ID and Name are required.' });
        }

        const { data: existingCategory, error: existingError } = await supabase
            .from('categories')
            .select('id')
            .eq('id', newCategory.id);

        if (existingError) throw existingError;

        if (existingCategory && existingCategory.length > 0) {
            return res.status(409).json({ error: `Category ID "${newCategory.id}" already exists.` });
        }

        const { data, error } = await supabase
            .from('categories')
            .insert(newCategory)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Category added successfully!',
            data
        });

    } catch (err) {
        console.error('Add category error:', err);
        res.status(500).json({ error: 'Failed to add category.' });
    }
});

app.put('/api/admin/categories/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = buildCategoryPayload({ ...req.body, id });
        delete updatedData.id;

        const { data, error } = await supabase
            .from('categories')
            .update(updatedData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Category updated successfully!',
            data
        });

    } catch (err) {
        console.error('Update category error:', err);
        res.status(500).json({ error: 'Failed to update category.' });
    }
});

app.delete('/api/admin/categories/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Category deleted successfully!'
        });

    } catch (err) {
        console.error('Delete category error:', err);
        res.status(500).json({ error: 'Failed to delete category.' });
    }
});

// ============================================================
// GAURAV ADMIN VIEWS
// ============================================================

app.get('/gaurav', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/gaurav/login.html'));
});

app.get('/gaurav/dashboard', (req, res) => {
    if (!req.session || !req.session.isAdmin) {
        return res.redirect('/gaurav');
    }
    res.sendFile(path.join(__dirname, '../frontend/gaurav/dashboard.html'));
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
    console.log(`
==================================================
🧴 BASILICA BIOTECH SERVER RUNNING (SUPABASE TRUTH)
==================================================

Website:
http://localhost:${PORT}

Admin Login:
http://localhost:${PORT}/gaurav

Username: Gaurav
Password: Basilica139@

==================================================
`);
});
