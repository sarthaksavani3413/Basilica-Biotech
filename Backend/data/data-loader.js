/**
 * data-loader.js  —  Basilica Biotech · Personal Care
 * ─────────────────────────────────────────────────────
 * Loads two separate JSON data files:
 *   1. products-list.json   → id, name, description, image
 *   2. products-detail.json → id, name, image, keyIngredients, keyBenefits
 *
 * Merges them by product `id` and returns the combined
 * object in the same shape your personal-care.html expects:
 *
 *   data.products.personalcare = [ { name, description, image,
 *                                    keyIngredients, keyBenefits }, ... ]
 *
 * Usage in HTML:
 *   <script src="data-loader.js"></script>
 *   Then replace  fetch('/api/site-data')
 *   with          getSiteData()
 *
 * ─────────────────────────────────────────────────────
 * HOW TO SWAP IN  (one line change in personal-care.html):
 *
 *   BEFORE:  const res  = await fetch('/api/site-data');
 *            const data = await res.json();
 *
 *   AFTER:   const data = await getSiteData();
 * ─────────────────────────────────────────────────────
 */

'use strict';

/* ── Paths (adjust if your files live in a sub-folder) ── */
const DATA_LIST_URL = '/data/products-list.json';
const DATA_DETAIL_URL = '/data/products-detail.json';

/* ─────────────────────────────────────────────────────────
   getSiteData()
   Returns: Promise<{ products: { personalcare: Product[] } }>
   Each Product:
   {
     id            : string,
     name          : string,
     description   : string,
     image         : string,
     keyIngredients: [ { title, description }, ... ],
     keyBenefits   : [ { title, description }, ... ]
   }
───────────────────────────────────────────────────────── */
async function getSiteData() {

    /* 1 ── Fetch both files in parallel */
    const [listRes, detailRes] = await Promise.all([
        fetch(DATA_LIST_URL),
        fetch(DATA_DETAIL_URL)
    ]);

    if (!listRes.ok) {
        throw new Error('Could not load products-list.json  (HTTP ' + listRes.status + ')');
    }
    if (!detailRes.ok) {
        throw new Error('Could not load products-detail.json  (HTTP ' + detailRes.status + ')');
    }

    const listData = await listRes.json();
    const detailData = await detailRes.json();

    /* 2 ── Build a lookup map from products-detail.json  { id → detailObj } */
    const detailMap = {};
    (detailData.products || []).forEach(item => {
        if (item.id) detailMap[item.id] = item;
    });

    /* 3 ── Merge: start with list, attach ingredients + benefits from detail */
    const merged = (listData.products || []).map(listItem => {
        const detail = detailMap[listItem.id] || {};
        return {
            id: listItem.id || '',
            name: listItem.name || '',
            description: listItem.description || '',
            image: listItem.image || detail.image || '',
            keyIngredients: detail.keyIngredients || [],
            keyBenefits: detail.keyBenefits || []
        };
    });

    /* 4 ── Return in the shape the HTML page expects */
    return {
        products: {
            personalcare: merged
        }
    };
}


/* ─────────────────────────────────────────────────────────
   loadProductsFromFiles()
   Drop-in replacement for the loadPersonalCareProducts()
   function already in personal-care.html.
   Call this instead of the original if you prefer to keep
   all rendering logic outside the HTML file.
───────────────────────────────────────────────────────── */
async function loadProductsFromFiles() {

    const container = document.getElementById('dynamic-personalcare-products');
    if (!container) return;

    try {

        const data = await getSiteData();
        const products = data.products.personalcare;

        container.innerHTML = '';

        if (products.length === 0) {
            container.innerHTML = '<div class="no-products"><h3>No Products Found</h3></div>';
            return;
        }

        products.forEach(product => {

            /* Build the detail-page URL slug */
            const slug = product.name
                .toLowerCase()
                .trim()
                .replace(/&/g, 'and')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '') + '.html';

            const detailUrl = 'personal-care-details/' + slug;
            const metaHTML = buildIngredientsBenefitsHTML(product);

            container.innerHTML += `
        <div class="product-card ${metaHTML ? 'product-card--has-meta' : ''}">
          <a href="${detailUrl}" style="text-decoration:none;color:inherit;display:block;">

            <div class="product-img">
              <img
                src="/${escHtml(product.image)}"
                alt="${escHtml(product.name)}"
                onerror="this.style.display='none'"
              >
            </div>

            <div class="product-content">
              <h3>${escHtml(product.name)}</h3>
              <p>${escHtml(product.description)}</p>
              ${metaHTML}
            </div>

          </a>
        </div>
      `;
        });

    } catch (err) {
        console.error('[data-loader] loadProductsFromFiles error:', err);
        container.innerHTML = '<div class="no-products"><h3>Failed to load products</h3></div>';
    }
}


/* ─────────────────────────────────────────────────────────
   Helpers  (same logic as in your original HTML <script>)
───────────────────────────────────────────────────────── */

function buildIngredientsBenefitsHTML(product) {

    const ingredients = Array.isArray(product.keyIngredients)
        ? product.keyIngredients.filter(i => i && i.title)
        : [];

    const benefits = Array.isArray(product.keyBenefits)
        ? product.keyBenefits.filter(b => b && b.title)
        : [];

    if (ingredients.length === 0 && benefits.length === 0) return '';

    let html = '<div class="product-meta">';

    if (ingredients.length > 0) {
        html += `
      <div class="product-meta-section">
        <div class="product-meta-title">
          <i class="fas fa-flask"></i> Key Ingredients
        </div>
        <ul class="product-meta-list">
          ${ingredients.map(i => `
            <li>
              <strong>${escHtml(i.title)}</strong>
              ${i.description ? `<span>${escHtml(i.description)}</span>` : ''}
            </li>
          `).join('')}
        </ul>
      </div>
    `;
    }

    if (benefits.length > 0) {
        html += `
      <div class="product-meta-section">
        <div class="product-meta-title">
          <i class="fas fa-star"></i> Key Benefits
        </div>
        <ul class="product-meta-list">
          ${benefits.map(b => `
            <li>
              <strong>${escHtml(b.title)}</strong>
              ${b.description ? `<span>${escHtml(b.description)}</span>` : ''}
            </li>
          `).join('')}
        </ul>
      </div>
    `;
    }

    html += '</div>';
    return html;
}

function escHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}