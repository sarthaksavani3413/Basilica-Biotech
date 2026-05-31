/* ============================================================
   BASILICA BIOTECH - Admin Dashboard JavaScript
   ============================================================ */

let siteData = {};

/* ============================================================
   INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {

    await loadSiteData();

    setupNavigation();

    renderOverview();

    renderAllSections();

});

/* ============================================================
   LOAD SITE DATA
   ============================================================ */

async function loadSiteData() {

    try {

        const res = await fetch('/api/site-data');

        if (!res.ok) {
            throw new Error(`HTTP Error: ${res.status}`);
        }

        const data = await res.json();

        if (data.success && data.data) {
            siteData = data.data;
        } else {
            siteData = data;
        }

        if (!siteData.categories) siteData.categories = [];

        if (!siteData.products) {
            siteData.products = {};
        }

        const productCategories = [
            'skincare',
            'haircare',
            'personalcare',
            'bathsoap',
            'grooming'
        ];

        productCategories.forEach(cat => {
            if (!siteData.products[cat]) {
                siteData.products[cat] = [];
            }
            // Backward compat: ensure every product has ingredient/benefit arrays
            siteData.products[cat] = siteData.products[cat].map(p => ({
                ...p,
                keyIngredients: Array.isArray(p.keyIngredients) ? p.keyIngredients : [],
                keyBenefits: Array.isArray(p.keyBenefits) ? p.keyBenefits : []
            }));
        });

    } catch (error) {

        console.error('loadSiteData Error:', error);

        siteData = {
            categories: [],
            products: {
                skincare: [],
                haircare: [],
                personalcare: [],
                bathsoap: [],
                grooming: []
            }
        };

        showToast('Failed to load data', 'error');
    }
}

/* ============================================================
   NAVIGATION
   ============================================================ */

function setupNavigation() {

    document.querySelectorAll('.sidebar-nav a[data-section]')
        .forEach(link => {

            link.addEventListener('click', (e) => {

                e.preventDefault();

                const section = link.dataset.section;

                document.querySelectorAll('.sidebar-nav a')
                    .forEach(l => l.classList.remove('active'));

                link.classList.add('active');

                document.getElementById('headerTitle').textContent =
                    link.textContent.trim();

                showSection(section);

                document.getElementById('sidebar')
                    ?.classList.remove('open');

            });

        });

}

function showSection(section) {

    document.querySelectorAll('.section-panel')
        .forEach(panel => panel.classList.remove('active'));

    let panel = document.getElementById('panel-' + section);

    if (!panel) {

        panel = document.createElement('div');

        panel.className = 'section-panel';

        panel.id = 'panel-' + section;

        document.getElementById('adminContent')
            .appendChild(panel);

        renderSection(section, panel);
    }

    panel.classList.add('active');
}

/* ============================================================
   OVERVIEW
   ============================================================ */

function renderOverview() {

    const totalProducts = Object.values(siteData.products || {})
        .reduce((total, arr) => total + arr.length, 0);

    const totalCategories = siteData.categories.length;

    document.getElementById('overviewGrid').innerHTML = `

        <div class="overview-card">

            <div class="oc-icon">
                <i class="fas fa-box"></i>
            </div>

            <div class="oc-value">
                ${totalProducts}
            </div>

            <div class="oc-label">
                Total Products
            </div>

        </div>

        <div class="overview-card">

            <div class="oc-icon">
                <i class="fas fa-grip-horizontal"></i>
            </div>

            <div class="oc-value">
                ${totalCategories}
            </div>

            <div class="oc-label">
                Categories
            </div>

        </div>

    `;
}

/* ============================================================
   RENDER SECTIONS
   ============================================================ */

function renderAllSections() {

    const categoriesPanel =
        document.getElementById('panel-categories');

    if (categoriesPanel) {
        renderCategories(categoriesPanel);
        categoriesPanel.classList.add('active');
    }

}

async function refreshAdminData() {

    const activePanelId =
        document.querySelector('.section-panel.active')?.id;

    await loadSiteData();

    renderOverview();

    document.querySelectorAll('.section-panel')
        .forEach(panel => {

            if (panel.id === 'panel-overview') {
                return;
            }

            const section =
                panel.id.replace('panel-', '');

            renderSection(section, panel);

        });

    if (activePanelId) {
        document.querySelectorAll('.section-panel')
            .forEach(panel => panel.classList.remove('active'));

        document.getElementById(activePanelId)
            ?.classList.add('active');
    }
}

function renderSection(section, panel) {

    switch (section) {

        case 'categories':
            renderCategories(panel);
            break;

        case 'products-skincare':
            renderProducts(panel, 'skincare', 'Skin Care');
            break;

        case 'products-haircare':
            renderProducts(panel, 'haircare', 'Hair Care');
            break;

        case 'products-personalcare':
            renderProducts(panel, 'personalcare', 'Personal Care');
            break;

        case 'products-bathsoap':
            renderProducts(panel, 'bathsoap', 'Bath Soap');
            break;

        case 'products-grooming':
            renderProducts(panel, 'grooming', 'Grooming');
            break;
    }
}

/* ============================================================
   CATEGORIES
   ============================================================ */

function renderCategories(panel) {

    const categories = siteData.categories || [];

    let html = `

        <div class="panel-header">

            <div>

                <h3>Product Categories</h3>

                <p>Manage category details</p>

            </div>

            <button
                class="btn btn-success"
                onclick="addCategory()"
            >
                <i class="fas fa-plus"></i>
                Add Category
            </button>

        </div>

        <div class="product-admin-grid">

    `;

    categories.forEach((cat, index) => {

        html += `

            <div class="product-admin-card">

                <img
                    src="/${cat.image}"
                    class="product-admin-img"
                    alt="${esc(cat.name)}"
                >

                <div class="product-admin-body">

                    <h5>${esc(cat.name)}</h5>

                    <p>${esc(cat.description || 'No description')}</p>

                    <div class="product-admin-actions">

                        <button
                            class="btn btn-primary btn-sm"
                            onclick="editCategory(${index})"
                        >
                            <i class="fas fa-edit"></i>
                            Edit
                        </button>

                        <button
                            class="btn btn-danger btn-sm"
                            onclick="deleteCategory(${index})"
                        >
                            <i class="fas fa-trash"></i>
                            Delete
                        </button>

                    </div>

                </div>

            </div>

        `;
    });

    html += `</div>`;

    panel.innerHTML = html;
}

function buildCategoryModalShell({
    title,
    icon,
    id = '',
    name = '',
    description = '',
    image = '',
    link = '',
    idReadonly = false,
    onSave
}) {

    const imgStyle = image ? '' : 'style="display:none;"';
    const readonlyAttr = idReadonly ? 'readonly' : '';

    return `

        <h3>
            <i class="${icon}"></i>
            ${title}
        </h3>

        <div class="form-group">
            <label>Category ID *</label>
            <input
                class="form-control"
                id="modal-cid"
                value="${esc(id)}"
                placeholder="e.g. cat-1"
                ${readonlyAttr}
            >
        </div>

        <div class="form-group">
            <label>Category Name *</label>
            <input
                class="form-control"
                id="modal-cname"
                value="${esc(name)}"
                placeholder="Enter category name"
            >
        </div>

        <div class="form-group">
            <label>Description</label>
            <textarea
                class="form-control"
                id="modal-cdesc"
                rows="3"
                placeholder="Describe the category..."
            >${esc(description)}</textarea>
        </div>

        <div class="form-group">
            <label>Category Link</label>
            <input
                class="form-control"
                id="modal-clink"
                value="${esc(link)}"
                placeholder="./skincare.html"
            >
        </div>

        <div class="form-group">
            <label>Category Image</label>
            <div class="img-preview-wrap">
                <img
                    src="${image ? '/' + image : ''}"
                    class="img-preview"
                    id="modal-cimg-preview"
                    ${imgStyle}
                >
                <label class="file-upload-btn">
                    <i class="fas fa-upload"></i>
                    ${image ? 'Change Image' : 'Upload Image'}
                    <input
                        type="file"
                        accept="image/*"
                        onchange="uploadAndSet(this, 'modal-cimg-preview', 'modal-cimg-path')"
                    >
                </label>
            </div>
            <input type="hidden" id="modal-cimg-path" value="${esc(image)}">
        </div>

        <div class="modal-actions">

            <button
                type="button"
                class="btn btn-danger"
                onclick="closeModal()"
            >
                <i class="fas fa-times"></i>
                Cancel
            </button>

            <button
                type="button"
                class="btn btn-primary"
                id="modalSaveBtn"
                onclick="${onSave}"
            >
                <i class="fas fa-save"></i>
                Save Category
            </button>

        </div>

    `;
}

function addCategory() {

    document.getElementById('modalContent').innerHTML = buildCategoryModalShell({
        icon: 'fas fa-plus-circle',
        title: 'Add Category',
        onSave: 'saveNewCategory()'
    });

    openModal();
}

function editCategory(index) {

    const category = siteData.categories?.[index];

    if (!category) {
        showToast('Category not found', 'error');
        return;
    }

    document.getElementById('modalContent').innerHTML = buildCategoryModalShell({
        icon: 'fas fa-edit',
        title: 'Edit Category',
        id: category.id || '',
        name: category.name || '',
        description: category.description || '',
        image: category.image || '',
        link: category.link || '',
        idReadonly: true,
        onSave: `saveEditCategory('${category.id}', ${index})`
    });

    openModal();
}

function getCategoryBody() {

    return {
        id: gv('modal-cid').trim(),
        name: gv('modal-cname').trim(),
        description: gv('modal-cdesc'),
        image: gv('modal-cimg-path'),
        link: gv('modal-clink')
    };
}

async function saveNewCategory() {

    const body = getCategoryBody();

    if (!body.id) {
        highlightError('modal-cid', 'Category ID is required');
        return;
    }

    if (!body.name) {
        highlightError('modal-cname', 'Category name is required');
        return;
    }

    setSaveBtnLoading(true);

    try {

        const res = await fetch('/api/admin/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.success) {
            closeModal();
            await refreshAdminData();
            showToast('Category added successfully!');
        } else {
            showToast(data.error || 'Failed to add category', 'error');
        }

    } catch (error) {
        console.error('saveNewCategory error:', error);
        showToast('Server error. Please try again.', 'error');
    } finally {
        setSaveBtnLoading(false);
    }
}

async function saveEditCategory(id, index) {

    const body = getCategoryBody();

    if (!body.name) {
        highlightError('modal-cname', 'Category name is required');
        return;
    }

    setSaveBtnLoading(true);

    try {

        const data = await apiPut(`/api/admin/categories/${id}`, body);

        if (data.success) {
            closeModal();
            await refreshAdminData();
            showToast('Category updated successfully!');
        } else {
            showToast(data.error || 'Failed to update category', 'error');
        }

    } catch (error) {
        console.error('saveEditCategory error:', error);
        showToast('Server error. Please try again.', 'error');
    } finally {
        setSaveBtnLoading(false);
    }
}

async function deleteCategory(index) {

    const category = siteData.categories?.[index];

    if (!category) {
        showToast('Category not found', 'error');
        return;
    }

    if (!confirm('Are you sure you want to delete this category?')) {
        return;
    }

    try {

        const res = await fetch(`/api/admin/categories/${category.id}`, {
            method: 'DELETE'
        });

        const data = await res.json();

        if (data.success) {
            await refreshAdminData();
            showToast('Category deleted successfully!');
        } else {
            showToast(data.error || 'Delete failed', 'error');
        }

    } catch (error) {
        console.error('deleteCategory error:', error);
        showToast('Delete failed', 'error');
    }
}

function rerenderCategoriesPanel() {

    const panel = document.getElementById('panel-categories');

    if (panel) {
        renderCategories(panel);
    }
}

/* ============================================================
   PRODUCTS
   ============================================================ */

function renderProducts(panel, category, title) {

    const products =
        siteData.products?.[category] || [];

    let html = `

        <div class="panel-header">

            <div>

                <h3>${title} Products</h3>

                <p>Manage products</p>

            </div>

            <button
                class="btn btn-success"
                onclick="addProduct('${category}', '${title}')"
            >

                <i class="fas fa-plus"></i>
                Add Product

            </button>

        </div>

        <div class="product-admin-grid">

    `;

    products.forEach((product, index) => {

        const ingredientCount = (product.keyIngredients || []).length;
        const benefitCount = (product.keyBenefits || []).length;

        const badges = [
            ingredientCount > 0
                ? `<span class="meta-badge ingredient-badge">
                       <i class="fas fa-flask"></i> ${ingredientCount} Ingredient${ingredientCount !== 1 ? 's' : ''}
                   </span>`
                : '',
            benefitCount > 0
                ? `<span class="meta-badge benefit-badge">
                       <i class="fas fa-star"></i> ${benefitCount} Benefit${benefitCount !== 1 ? 's' : ''}
                   </span>`
                : ''
        ].filter(Boolean).join('');

        html += `

            <div class="product-admin-card">

                <img
                    src="/${product.image}"
                    class="product-admin-img"
                    alt="${esc(product.name)}"
                    onerror="this.src=''"
                >

                <div class="product-admin-body">

                    <h5>${esc(product.name)}</h5>

                    <p>${esc(product.description || '')}</p>

                    ${badges ? `<div class="meta-badges">${badges}</div>` : ''}

                    <div class="product-admin-actions">

                        <button
                            class="btn btn-primary btn-sm"
                            onclick="editProduct('${category}', ${index})"
                        >

                            <i class="fas fa-edit"></i>
                            Edit

                        </button>

                        <button
                            class="btn btn-danger btn-sm"
                            onclick="deleteProduct('${category}', ${index})"
                        >

                            <i class="fas fa-trash"></i>
                            Delete

                        </button>

                    </div>

                </div>

            </div>

        `;
    });

    html += `</div>`;

    panel.innerHTML = html;
}

/* ============================================================
   BUILD INGREDIENT ITEM HTML
   Used by both edit and add modals
   ============================================================ */

function buildIngredientItemHTML(title = '', description = '') {

    return `

        <div class="modern-item ingredient-item">

            <div class="modern-item-fields">

                <input
                    type="text"
                    class="form-control ingredient-title"
                    value="${esc(title)}"
                    placeholder="e.g. Vitamin C, Aloe Vera, Niacinamide"
                >

                <textarea
                    class="form-control ingredient-description"
                    placeholder="Describe what this ingredient does..."
                    rows="2"
                >${esc(description)}</textarea>

            </div>

            <button
                type="button"
                class="delete-modern-btn"
                title="Remove ingredient"
                onclick="removeItem(this)"
            >
                <i class="fas fa-times"></i>
            </button>

        </div>

    `;
}

/* ============================================================
   BUILD BENEFIT ITEM HTML
   ============================================================ */

function buildBenefitItemHTML(title = '', description = '') {

    return `

        <div class="modern-item benefit-item">

            <div class="modern-item-fields">

                <input
                    type="text"
                    class="form-control benefit-title"
                    value="${esc(title)}"
                    placeholder="e.g. Deep Hydration, Anti-Aging, Oil Control"
                >

                <textarea
                    class="form-control benefit-description"
                    placeholder="Describe this benefit in detail..."
                    rows="2"
                >${esc(description)}</textarea>

            </div>

            <button
                type="button"
                class="delete-modern-btn"
                title="Remove benefit"
                onclick="removeItem(this)"
            >
                <i class="fas fa-times"></i>
            </button>

        </div>

    `;
}

/* ============================================================
   REMOVE ITEM (ingredient or benefit)
   ============================================================ */

function removeItem(btn) {

    const item = btn.closest('.modern-item');

    if (!item) return;

    // Animate out
    item.style.opacity = '0';
    item.style.transform = 'translateX(20px)';
    item.style.transition = 'all 0.2s ease';

    setTimeout(() => item.remove(), 200);
}

/* ============================================================
   ADD INGREDIENT (called from modal buttons)
   ============================================================ */

function addIngredient() {

    const container = document.getElementById('ingredientsContainer');

    if (!container) return;

    // Remove "no items" placeholder if present
    const placeholder = container.querySelector('.empty-msg');
    if (placeholder) placeholder.remove();

    container.insertAdjacentHTML('beforeend', buildIngredientItemHTML());

    // Focus the new title input
    const inputs = container.querySelectorAll('.ingredient-title');
    if (inputs.length) {
        inputs[inputs.length - 1].focus();
    }
}

/* ============================================================
   ADD BENEFIT (called from modal buttons)
   ============================================================ */

function addBenefit() {

    const container = document.getElementById('benefitsContainer');

    if (!container) return;

    // Remove "no items" placeholder if present
    const placeholder = container.querySelector('.empty-msg');
    if (placeholder) placeholder.remove();

    container.insertAdjacentHTML('beforeend', buildBenefitItemHTML());

    // Focus the new title input
    const inputs = container.querySelectorAll('.benefit-title');
    if (inputs.length) {
        inputs[inputs.length - 1].focus();
    }
}

/* ============================================================
   COLLECT INGREDIENTS from DOM
   ============================================================ */

function collectIngredients() {

    const items = [];

    document.querySelectorAll('.ingredient-item').forEach(item => {

        const title = (item.querySelector('.ingredient-title')?.value || '').trim();
        const desc = (item.querySelector('.ingredient-description')?.value || '').trim();

        // Only include rows that have at least a title
        if (title) {
            items.push({ title, description: desc });
        }

    });

    return items;
}

/* ============================================================
   COLLECT BENEFITS from DOM
   ============================================================ */

function collectBenefits() {

    const items = [];

    document.querySelectorAll('.benefit-item').forEach(item => {

        const title = (item.querySelector('.benefit-title')?.value || '').trim();
        const desc = (item.querySelector('.benefit-description')?.value || '').trim();

        if (title) {
            items.push({ title, description: desc });
        }

    });

    return items;
}

/* ============================================================
   EMPTY STATE HTML for containers
   ============================================================ */

function emptyStateHTML(type) {

    const icon = type === 'ingredient' ? 'fas fa-flask' : 'fas fa-star';
    const label = type === 'ingredient' ? 'ingredient' : 'benefit';

    return `
        <div class="empty-msg">
            <i class="${icon}"></i>
            No ${label}s added yet. Click the button below to add one.
        </div>
    `;
}

/* ============================================================
   MODAL SHELL — shared structure for add/edit modals
   ============================================================ */

function buildModalShell({
    icon,
    title,
    ingredients = [],
    benefits = [],
    onSave,
    imgSrc = '',
    imgPath = '',
    name = '',
    description = ''
}) {

    const ingredientsHTML = ingredients.length
        ? ingredients.map(i => buildIngredientItemHTML(i.title, i.description)).join('')
        : emptyStateHTML('ingredient');

    const benefitsHTML = benefits.length
        ? benefits.map(b => buildBenefitItemHTML(b.title, b.description)).join('')
        : emptyStateHTML('benefit');

    const imgStyle = imgSrc ? '' : 'style="display:none;"';

    return `

        <h3>
            <i class="${icon}"></i>
            ${title}
        </h3>

        <!-- NAME -->
        <div class="form-group">
            <label>Product Name *</label>
            <input
                class="form-control"
                id="modal-pname"
                value="${esc(name)}"
                placeholder="Enter product name"
            >
        </div>

        <!-- DESCRIPTION -->
        <div class="form-group">
            <label>Description</label>
            <textarea
                class="form-control"
                id="modal-pdesc"
                rows="3"
                placeholder="Describe the product..."
            >${esc(description)}</textarea>
        </div>

        <!-- IMAGE -->
        <div class="form-group">
            <label>Product Image</label>
            <div class="img-preview-wrap">
                <img
                    src="${imgSrc ? '/' + imgSrc : ''}"
                    class="img-preview"
                    id="modal-pimg-preview"
                    ${imgStyle}
                >
                <label class="file-upload-btn">
                    <i class="fas fa-upload"></i>
                    ${imgSrc ? 'Change Image' : 'Upload Image'}
                    <input
                        type="file"
                        accept="image/*"
                        onchange="uploadAndSet(this, 'modal-pimg-preview', 'modal-pimg-path')"
                    >
                </label>
            </div>
            <input type="hidden" id="modal-pimg-path" value="${esc(imgPath)}">
        </div>

        <hr>

        <!-- INGREDIENTS -->
        <div class="section-subheader">
            <h4><i class="fas fa-flask"></i> Key Ingredients</h4>
            <span class="section-hint">Add active ingredients with their functions</span>
        </div>

        <div id="ingredientsContainer">
            ${ingredientsHTML}
        </div>

        <button
            type="button"
            class="btn btn-outline-add"
            onclick="addIngredient()"
        >
            <i class="fas fa-plus"></i>
            Add Ingredient
        </button>

        <hr>

        <!-- BENEFITS -->
        <div class="section-subheader">
            <h4><i class="fas fa-star"></i> Key Benefits</h4>
            <span class="section-hint">Add the key benefits customers will experience</span>
        </div>

        <div id="benefitsContainer">
            ${benefitsHTML}
        </div>

        <button
            type="button"
            class="btn btn-outline-add"
            onclick="addBenefit()"
        >
            <i class="fas fa-plus"></i>
            Add Benefit
        </button>

        <!-- ACTIONS -->
        <div class="modal-actions">

            <button
                type="button"
                class="btn btn-danger"
                onclick="closeModal()"
            >
                <i class="fas fa-times"></i>
                Cancel
            </button>

            <button
                type="button"
                class="btn btn-primary"
                id="modalSaveBtn"
                onclick="${onSave}"
            >
                <i class="fas fa-save"></i>
                Save Product
            </button>

        </div>

    `;
}

/* ============================================================
   EDIT PRODUCT
   ============================================================ */

function editProduct(category, index) {

    const product =
        siteData?.products?.[category]?.[index];

    console.log('EDIT PRODUCT DATA =>', product);

    if (!product) {
        showToast('Product not found', 'error');
        return;
    }

    // ============================================================
    // SAFE ARRAYS
    // ============================================================

    const ingredients =
        Array.isArray(product.keyIngredients)
            ? product.keyIngredients
            : [];

    const benefits =
        Array.isArray(product.keyBenefits)
            ? product.keyBenefits
            : [];

    // ============================================================
    // RENDER MODAL HTML WITH UNIQUE DATABASE ID
    // ============================================================

    const modalContent =
        document.getElementById('modalContent');

    modalContent.innerHTML = buildModalShell({

        icon: 'fas fa-edit',

        title: 'Edit Product',

        name: '',

        description: '',

        imgSrc: '',

        imgPath: '',

        ingredients: ingredients,

        benefits: benefits,

        onSave: `saveEditProduct('${category}', '${product.id}', ${index})`

    });

    // ============================================================
    // OPEN MODAL
    // ============================================================

    openModal();

    // ============================================================
    // SET VALUES AFTER HTML LOAD
    // ============================================================

    requestAnimationFrame(() => {

        // NAME
        const nameInput =
            document.getElementById('modal-pname');

        if (nameInput) {
            nameInput.value = product.name || '';
        }

        // DESCRIPTION
        const descInput =
            document.getElementById('modal-pdesc');

        if (descInput) {
            descInput.value =
                product.description || '';
        }

        // IMAGE PATH
        const hiddenImg =
            document.getElementById('modal-pimg-path');

        if (hiddenImg) {
            hiddenImg.value =
                product.image || '';
        }

        // IMAGE PREVIEW
        const preview =
            document.getElementById('modal-pimg-preview');

        if (preview && product.image) {

            preview.src = '/' + product.image;

            preview.style.display = 'block';
        }

        // INGREDIENT INPUTS
        document.querySelectorAll('.ingredient-item')
            .forEach((row, i) => {

                const item = ingredients[i];

                if (!item) return;

                const titleInput =
                    row.querySelector('.ingredient-title');

                const descInput =
                    row.querySelector('.ingredient-description');

                if (titleInput) {
                    titleInput.value =
                        item.title || '';
                }

                if (descInput) {
                    descInput.value =
                        item.description || '';
                }

            });

        // BENEFIT INPUTS
        document.querySelectorAll('.benefit-item')
            .forEach((row, i) => {

                const item = benefits[i];

                if (!item) return;

                const titleInput =
                    row.querySelector('.benefit-title');

                const descInput =
                    row.querySelector('.benefit-description');

                if (titleInput) {
                    titleInput.value =
                        item.title || '';
                }

                if (descInput) {
                    descInput.value =
                        item.description || '';
                }

            });

    });

}

/* ============================================================
   SAVE EDIT PRODUCT (USING SUPABASE ID)
   ============================================================ */

async function saveEditProduct(category, id, index) {

    const name = gv('modal-pname').trim();

    if (!name) {
        highlightError('modal-pname', 'Product name is required');
        return;
    }

    const body = {
        name,
        description: gv('modal-pdesc'),
        image: gv('modal-pimg-path'),
        keyIngredients: collectIngredients(),
        keyBenefits: collectBenefits()
    };

    setSaveBtnLoading(true);

    try {

        const result = await apiPut(
            `/api/admin/products/${category}/${id}`,
            body
        );

        if (result.success) {

            closeModal();

            await refreshAdminData();

            showToast('Product updated successfully!');

        } else {

            showToast(result.error || 'Failed to update product', 'error');

        }

    } catch (err) {

        console.error('saveEditProduct error:', err);

        showToast('Server error. Please try again.', 'error');

    } finally {

        setSaveBtnLoading(false);

    }
}

/* ============================================================
   ADD PRODUCT MODAL
   ============================================================ */

function addProduct(category, title) {

    document.getElementById('modalContent').innerHTML = buildModalShell({
        icon: 'fas fa-plus-circle',
        title: `Add ${title} Product`,
        onSave: `saveNewProduct('${category}', '${title}')`
    });

    openModal();
}

/* ============================================================
   SAVE NEW PRODUCT
   ============================================================ */

async function saveNewProduct(category, title) {

    const name = gv('modal-pname').trim();

    if (!name) {
        highlightError('modal-pname', 'Product name is required');
        return;
    }

    // ============================================================
    // 1. INGREDIENTS ARRAY
    // ============================================================

    const keyIngredients = [];

    document.querySelectorAll('.ingredient-item').forEach(row => {
        const title =
            row.querySelector('.ingredient-title')?.value.trim() || '';

        const description =
            row.querySelector('.ingredient-description')?.value.trim() || '';

        if (title) {
            keyIngredients.push({
                title: title,
                description: description
            });
        }
    });

    // ============================================================
    // 2. BENEFITS ARRAY
    // ============================================================

    const keyBenefits = [];

    document.querySelectorAll('.benefit-item').forEach(row => {
        const title =
            row.querySelector('.benefit-title')?.value.trim() || '';

        const description =
            row.querySelector('.benefit-description')?.value.trim() || '';

        if (title) {
            keyBenefits.push({
                title: title,
                description: description
            });
        }
    });

    // ============================================================
    // 3. BODY OBJECT
    // ============================================================

    const body = {
        name: name,
        description: gv('modal-pdesc'),
        image: gv('modal-pimg-path'),
        keyIngredients: keyIngredients,
        keyBenefits: keyBenefits
    };

    setSaveBtnLoading(true);

    try {

        const res = await fetch(`/api/admin/products/${category}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.success) {

            closeModal();

            await refreshAdminData();

            showToast('Product added successfully!');

        } else {

            showToast(data.error || 'Failed to add product', 'error');
        }

    } catch (err) {

        console.error('saveNewProduct error:', err);

        showToast('Server error. Please try again.', 'error');

    } finally {

        setSaveBtnLoading(false);
    }
}

/* ============================================================
   DELETE PRODUCT (USING SUPABASE ID)
   ============================================================ */

async function deleteProduct(category, index) {

    const product =
        siteData?.products?.[category]?.[index];

    if (!product) {
        showToast('Product not found', 'error');
        return;
    }

    // ============================================================
    // CONFIRM DELETE
    // ============================================================

    const confirmDelete = confirm(
        'Are you sure you want to delete this product?'
    );

    if (!confirmDelete) {
        return;
    }

    try {

        // ============================================================
        // API CALL WITH UNIQUE DB ID
        // ============================================================

        const res = await fetch(
            `/api/admin/products/${category}/${product.id}`,
            {
                method: 'DELETE'
            }
        );

        const data = await res.json();

        console.log('DELETE RESPONSE =>', data);

        // ============================================================
        // SUCCESS
        // ============================================================

        if (data.success) {

            await refreshAdminData();

            // SUCCESS MESSAGE
            showToast(
                'Product deleted successfully!'
            );

        } else {

            showToast(
                data.error || 'Delete failed',
                'error'
            );

        }

    } catch (error) {

        console.error(
            'DELETE ERROR =>',
            error
        );

        showToast(
            'Delete failed',
            'error'
        );
    }
}

/* ============================================================
   RE-RENDER PRODUCT PANEL
   ============================================================ */

function rerenderProductPanel(category) {

    const panel = document.getElementById('panel-products-' + category);

    const titles = {
        skincare: 'Skin Care',
        haircare: 'Hair Care',
        personalcare: 'Personal Care',
        bathsoap: 'Bath Soap',
        grooming: 'Grooming'
    };

    if (panel) {
        renderProducts(panel, category, titles[category] || category);
    }
}

/* ============================================================
   IMAGE UPLOAD
   ============================================================ */

async function uploadAndSet(input, previewId, hiddenId) {

    const file = input.files[0];

    if (!file) return;

    const formData = new FormData();

    formData.append('image', file);

    const preview = document.getElementById(previewId);
    const hidden = document.getElementById(hiddenId);

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = e => {
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);

    try {

        const res = await fetch('/api/admin/upload', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        if (data.success) {

            if (preview) preview.src = '/' + data.path;
            if (hidden) hidden.value = data.path;

            showToast('Image uploaded!');

        } else {

            showToast('Upload failed', 'error');
        }

    } catch (error) {

        console.error(error);

        showToast('Upload failed', 'error');
    }
}

/* ============================================================
   MODAL HELPERS
   ============================================================ */

function openModal() {

    document.getElementById('editModal')
        ?.classList.add('show');

    // Scroll modal to top
    const box = document.querySelector('.modal-box');
    if (box) box.scrollTop = 0;
}

function closeModal() {

    document.getElementById('editModal')
        ?.classList.remove('show');
}

function setSaveBtnLoading(loading) {

    const btn = document.getElementById('modalSaveBtn');

    if (!btn) return;

    if (loading) {
        btn.dataset.originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Saving...';
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.originalHtml || '<i class="fas fa-save"></i> Save';
        delete btn.dataset.originalHtml;
    }
}

function highlightError(inputId, message) {

    const input = document.getElementById(inputId);

    if (!input) return;

    input.style.borderColor = 'var(--danger)';
    input.focus();

    input.addEventListener('input', () => {
        input.style.borderColor = '';
    }, { once: true });

    showToast(message, 'error');
}

/* ============================================================
   UTILITIES
   ============================================================ */

function gv(id) {
    return document.getElementById(id)?.value || '';
}

function esc(str) {

    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

async function apiPut(url, body) {

    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    return await res.json();
}

function showToast(msg, type = 'success') {

    const toast = document.getElementById('toast');

    if (!toast) return;

    const icon = toast.querySelector('i');

    document.getElementById('toastMsg').textContent = msg;

    toast.className = 'toast ' + type;

    if (icon) {

        icon.className =
            type === 'success'
                ? 'fas fa-check-circle'
                : 'fas fa-exclamation-circle';
    }

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

/* ============================================================
   MODAL CLOSE on overlay click
   ============================================================ */

document.getElementById('editModal')
    ?.addEventListener('click', function (e) {

        if (e.target === this) {
            closeModal();
        }
    });

/* ============================================================
   LOGOUT
   ============================================================ */

async function handleLogout() {

    try {

        await fetch('/api/logout', {
            method: 'POST'
        });

        window.location.href = '/gaurav';

    } catch (error) {

        console.error(error);
    }
}
