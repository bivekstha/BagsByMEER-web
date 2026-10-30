// --- FIREBASE CONFIGURATION ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAU1Ahk2asBAEGZ-rjqfQ08iwA6i8XVUKa",
    authDomain: "bagsbymeer.firebaseapp.com",
    projectId: "bagsbymeer",
    storageBucket: "bagsbymeer.firebasestorage.app",
    messagingSenderId: "778662905536",
    appId: "1:778662905536:web:6a2840524c033c0d8a4f25",
    measurementId: "G-9Q7NREN303"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let products = [];
let snapshots = [];
let cart = [];
let activeFilter = 'all';
let activeSnapshotFilter = 'all';

// DOM Elements
const productGrid = document.getElementById('product-grid');
const snapshotGrid = document.getElementById('snapshot-grid');
const adminLoginModal = document.getElementById('admin-login-modal');
const adminModal = document.getElementById('admin-modal');
const adminToggleBtn = document.getElementById('admin-toggle-btn');
const closeLogin = document.getElementById('close-login');
const closeAdmin = document.getElementById('close-admin');
const loginForm = document.getElementById('login-form');
const productForm = document.getElementById('product-form');
const snapshotForm = document.getElementById('snapshot-form');
const adminProductList = document.getElementById('admin-product-list');
const adminSnapshotList = document.getElementById('admin-snapshot-list');

// Load Data from Firestore Database on Startup
async function loadData() {
    await loadProducts();
    await loadSnapshots();
}

// Load Products from Firestore
async function loadProducts() {
    try {
        const querySnapshot = await getDocs(collection(db, "bags"));
        products = [];
        querySnapshot.forEach((docSnap) => {
            products.push({ id: docSnap.id, ...docSnap.data() });
        });
        renderProducts(activeFilter);
        renderAdminList();
    } catch (error) {
        console.error("Error loading products:", error);
        productGrid.innerHTML = `<div class="col-span-full text-center py-8 text-red-600">Failed to load database. Check your Firebase credentials in script.js</div>`;
    }
}

// Load Snapshots from Firestore
async function loadSnapshots() {
    try {
        const querySnapshot = await getDocs(collection(db, "snapshots"));
        snapshots = [];
        querySnapshot.forEach((docSnap) => {
            snapshots.push({ id: docSnap.id, ...docSnap.data() });
        });
        renderSnapshots(activeSnapshotFilter);
        renderAdminSnapshotList();
    } catch (error) {
        console.error("Error loading snapshots:", error);
        snapshotGrid.innerHTML = `<div class="col-span-full text-center py-8 text-red-600">Failed to load snapshots gallery.</div>`;
    }
}

// Render Catalog Grid with Multi-Image Gallery Support
function renderProducts(filter = 'all') {
    productGrid.innerHTML = '';
    const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);
    
    if (filtered.length === 0) {
        productGrid.innerHTML = `<div class="col-span-full text-center py-12 text-brand-600 font-light">No bags found in this category. Use the Admin panel to add some!</div>`;
        return;
    }

    filtered.forEach(product => {
        const isOutOfStock = product.stock === 'out';
        let imageUrls = product.image ? product.image.split(',').map(url => url.trim()).filter(url => url.length > 0) : ['logo.jpg'];
        if (imageUrls.length === 0) imageUrls = ['logo.jpg'];

        let imageHtml = '';
        if (imageUrls.length > 1) {
            const galleryId = `gallery-${product.id}`;
            let indicatorsHtml = '';
            imageUrls.forEach((url, idx) => {
                indicatorsHtml += `<button onclick="window.switchImage('${galleryId}', ${idx})" class="gallery-dot-${galleryId} w-2.5 h-2.5 rounded-full transition-all ${idx === 0 ? 'bg-white scale-125 shadow-md' : 'bg-white/50 hover:bg-white/80'}"></button>`;
            });

            imageHtml = `
                <div class="product-slider-container relative overflow-hidden aspect-[4/3] bg-brand-100 group/gallery" data-gallery-id="${galleryId}">
                    <img id="${galleryId}-img" src="${imageUrls[0]}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${isOutOfStock ? 'opacity-50 grayscale' : ''}" data-urls='${JSON.stringify(imageUrls)}' data-current="0">
                    <span class="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-brand-900 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">${product.category}</span>
                    ${isOutOfStock ? '<span class="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">Out of Stock</span>' : ''}
                    <div class="absolute bottom-3 inset-x-0 flex items-center justify-between px-4 opacity-90 transition-opacity">
                        <button onclick="window.prevImage('${galleryId}')" class="bg-black/40 hover:bg-black/70 text-white w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm text-xs transition">
                            <i class="fa-solid fa-chevron-left"></i>
                        </button>
                        <div class="flex space-x-1.5 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
                            ${indicatorsHtml}
                        </div>
                        <button onclick="window.nextImage('${galleryId}')" class="bg-black/40 hover:bg-black/70 text-white w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm text-xs transition">
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            `;
        } else {
            imageHtml = `
                <div class="relative overflow-hidden aspect-[4/3] bg-brand-100">
                    <img src="${imageUrls[0]}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500 ${isOutOfStock ? 'opacity-50 grayscale' : ''}">
                    <span class="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-brand-900 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">${product.category}</span>
                    ${isOutOfStock ? '<span class="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">Out of Stock</span>' : ''}
                </div>
            `;
        }

        const card = document.createElement('div');
        card.className = 'group bg-white rounded-3xl overflow-hidden border border-brand-200/60 shadow-sm hover:shadow-xl transition duration-300 flex flex-col justify-between relative';
        card.innerHTML = `
            ${imageHtml}
            <div class="p-6 flex flex-col flex-grow justify-between">
                <div>
                    <h3 class="font-serif text-xl font-bold text-brand-900">${product.name}</h3>
                    <p class="text-brand-700 text-sm font-light mt-1 line-clamp-2">${product.description}</p>
                </div>
                <div class="flex items-center justify-between mt-6 pt-4 border-t border-brand-100">
                    <span class="text-lg font-bold text-brand-900">Rs. ${Number(product.price).toFixed(2)}</span>
                    ${isOutOfStock 
                        ? '<span class="text-xs font-semibold text-red-500 uppercase tracking-wider">Unavailable</span>' 
                        : `<button onclick="window.addToCart('${product.id}')" class="bg-brand-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 transition shadow-sm">+ Add</button>`
                    }
                </div>
            </div>
        `;
        productGrid.appendChild(card);
    });
}

// Render Snapshots Gallery Grid (Supports multiple comma-separated photos per snapshot entry)
function renderSnapshots(filter = 'all') {
    snapshotGrid.innerHTML = '';
    const filtered = filter === 'all' ? snapshots : snapshots.filter(s => s.category === filter);

    if (filtered.length === 0) {
        snapshotGrid.innerHTML = `<div class="col-span-full text-center py-12 text-brand-600 font-light">No snapshots found in this category. Use the Admin panel to add photos!</div>`;
        return;
    }

    filtered.forEach(snapshot => {
        let imageUrls = snapshot.image ? snapshot.image.split(',').map(url => url.trim()).filter(url => url.length > 0) : ['logo.jpg'];
        if (imageUrls.length === 0) imageUrls = ['logo.jpg'];

        let imageHtml = '';
        if (imageUrls.length > 1) {
            const snapGalleryId = `snap-gallery-${snapshot.id}`;
            let indicatorsHtml = '';
            imageUrls.forEach((url, idx) => {
                indicatorsHtml += `<button onclick="window.switchSnapImage('${snapGalleryId}', ${idx})" class="snap-dot-${snapGalleryId} w-2 h-2 rounded-full transition-all ${idx === 0 ? 'bg-white scale-125 shadow-md' : 'bg-white/50 hover:bg-white/80'}"></button>`;
            });

            imageHtml = `
                <div class="snap-slider-container relative overflow-hidden w-full h-full group/snap" data-snap-gallery-id="${snapGalleryId}">
                    <img id="${snapGalleryId}-img" src="${imageUrls[0]}" alt="${snapshot.title}" class="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" data-urls='${JSON.stringify(imageUrls)}' data-current="0">
                    <div class="absolute bottom-2 inset-x-0 flex items-center justify-between px-3 opacity-90 transition-opacity">
                        <button onclick="window.prevSnapImage('${snapGalleryId}')" class="bg-black/40 hover:bg-black/70 text-white w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-sm text-[10px] transition">
                            <i class="fa-solid fa-chevron-left"></i>
                        </button>
                        <div class="flex space-x-1 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
                            ${indicatorsHtml}
                        </div>
                        <button onclick="window.nextSnapImage('${snapGalleryId}')" class="bg-black/40 hover:bg-black/70 text-white w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-sm text-[10px] transition">
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            `;
        } else {
            imageHtml = `
                <img src="${imageUrls[0]}" alt="${snapshot.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
            `;
        }

        const card = document.createElement('div');
        card.className = 'group relative rounded-3xl overflow-hidden shadow-md bg-white border border-brand-200 aspect-square';
        card.innerHTML = `
            ${imageHtml}
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end p-6 pointer-events-none">
                <div>
                    <span class="text-brand-200 text-xs uppercase tracking-wider font-semibold">${snapshot.category}</span>
                    <p class="text-white font-serif text-lg font-bold">${snapshot.title}</p>
                </div>
            </div>
        `;
        snapshotGrid.appendChild(card);
    });
}

// Automatic Slideshow Interval (Every 4 Seconds)
setInterval(() => {
    document.querySelectorAll('.product-slider-container').forEach(container => {
        const galleryId = container.getAttribute('data-gallery-id');
        if (galleryId) window.nextImage(galleryId);
    });
    document.querySelectorAll('.snap-slider-container').forEach(container => {
        const snapGalleryId = container.getAttribute('data-snap-gallery-id');
        if (snapGalleryId) window.nextSnapImage(snapGalleryId);
    });
}, 4000);

// Product Gallery Controls
window.switchImage = function(galleryId, index) {
    const imgElement = document.getElementById(`${galleryId}-img`);
    if (!imgElement) return;
    const urls = JSON.parse(imgElement.getAttribute('data-urls'));
    if (urls && urls[index]) {
        imgElement.setAttribute('data-current', index);
        imgElement.style.opacity = '0.3';
        setTimeout(() => {
            imgElement.src = urls[index];
            imgElement.style.opacity = '1';
        }, 150);

        const dots = document.querySelectorAll(`.gallery-dot-${galleryId}`);
        dots.forEach((dot, idx) => {
            dot.className = idx === index 
                ? `gallery-dot-${galleryId} w-2.5 h-2.5 rounded-full transition-all bg-white scale-125 shadow-md` 
                : `gallery-dot-${galleryId} w-2.5 h-2.5 rounded-full transition-all bg-white/50 hover:bg-white/80`;
        });
    }
}
window.nextImage = function(galleryId) {
    const imgElement = document.getElementById(`${galleryId}-img`);
    if (!imgElement) return;
    const urls = JSON.parse(imgElement.getAttribute('data-urls'));
    let current = parseInt(imgElement.getAttribute('data-current')) || 0;
    window.switchImage(galleryId, (current + 1) % urls.length);
}
window.prevImage = function(galleryId) {
    const imgElement = document.getElementById(`${galleryId}-img`);
    if (!imgElement) return;
    const urls = JSON.parse(imgElement.getAttribute('data-urls'));
    let current = parseInt(imgElement.getAttribute('data-current')) || 0;
    window.switchImage(galleryId, (current - 1 + urls.length) % urls.length);
}

// Snapshot Gallery Controls
window.switchSnapImage = function(snapGalleryId, index) {
    const imgElement = document.getElementById(`${snapGalleryId}-img`);
    if (!imgElement) return;
    const urls = JSON.parse(imgElement.getAttribute('data-urls'));
    if (urls && urls[index]) {
        imgElement.setAttribute('data-current', index);
        imgElement.style.opacity = '0.3';
        setTimeout(() => {
            imgElement.src = urls[index];
            imgElement.style.opacity = '1';
        }, 150);

        const dots = document.querySelectorAll(`.snap-dot-${snapGalleryId}`);
        dots.forEach((dot, idx) => {
            dot.className = idx === index 
                ? `snap-dot-${snapGalleryId} w-2 h-2 rounded-full transition-all bg-white scale-125 shadow-md` 
                : `snap-dot-${snapGalleryId} w-2 h-2 rounded-full transition-all bg-white/50 hover:bg-white/80`;
        });
    }
}
window.nextSnapImage = function(snapGalleryId) {
    const imgElement = document.getElementById(`${snapGalleryId}-img`);
    if (!imgElement) return;
    const urls = JSON.parse(imgElement.getAttribute('data-urls'));
    let current = parseInt(imgElement.getAttribute('data-current')) || 0;
    window.switchSnapImage(snapGalleryId, (current + 1) % urls.length);
}
window.prevSnapImage = function(snapGalleryId) {
    const imgElement = document.getElementById(`${snapGalleryId}-img`);
    if (!imgElement) return;
    const urls = JSON.parse(imgElement.getAttribute('data-urls'));
    let current = parseInt(imgElement.getAttribute('data-current')) || 0;
    window.switchSnapImage(snapGalleryId, (current - 1 + urls.length) % urls.length);
}

// Render Admin Inventory List
function renderAdminList() {
    adminProductList.innerHTML = '';
    products.forEach(p => {
        const firstImg = p.image ? p.image.split(',')[0].trim() : 'logo.jpg';
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between bg-white p-3 rounded-xl border border-brand-200 text-sm';
        item.innerHTML = `
            <div class="flex items-center space-x-3">
                <img src="${firstImg}" class="w-10 h-10 object-cover rounded-lg">
                <div>
                    <p class="font-bold text-brand-900">${p.name} <span class="text-xs font-normal text-brand-600">(Rs. ${p.price})</span></p>
                    <p class="text-xs ${p.stock === 'out' ? 'text-red-500' : 'text-green-600'}">${p.stock === 'out' ? 'Out of Stock' : 'In Stock'}</p>
                </div>
            </div>
            <div class="space-x-2">
                <button onclick="window.editProduct('${p.id}')" class="px-3 py-1 bg-brand-200 text-brand-900 rounded-lg text-xs font-medium">Edit</button>
                <button onclick="window.deleteProduct('${p.id}')" class="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">Delete</button>
            </div>
        `;
        adminProductList.appendChild(item);
    });
}

// Render Admin Snapshots List
function renderAdminSnapshotList() {
    adminSnapshotList.innerHTML = '';
    snapshots.forEach(s => {
        const firstImg = s.image ? s.image.split(',')[0].trim() : 'logo.jpg';
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between bg-white p-3 rounded-xl border border-brand-200 text-sm';
        item.innerHTML = `
            <div class="flex items-center space-x-3">
                <img src="${firstImg}" class="w-10 h-10 object-cover rounded-lg">
                <div>
                    <p class="font-bold text-brand-900">${s.title}</p>
                    <span class="text-xs font-semibold uppercase text-brand-600">${s.category}</span>
                </div>
            </div>
            <div class="space-x-2">
                <button onclick="window.editSnapshot('${s.id}')" class="px-3 py-1 bg-brand-200 text-brand-900 rounded-lg text-xs font-medium">Edit</button>
                <button onclick="window.deleteSnapshot('${s.id}')" class="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">Delete</button>
            </div>
        `;
        adminSnapshotList.appendChild(item);
    });
}

// Secure Admin Login Verification
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const enteredPin = document.getElementById('admin-pin-input').value;
    if (enteredPin === 'Meer@Admin2026') {
        adminLoginModal.classList.add('hidden');
        document.getElementById('admin-pin-input').value = '';
        adminModal.classList.remove('hidden');
    } else {
        alert('Incorrect admin passcode! Access denied.');
    }
});

// Handle Product Form Submit
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('edit-product-id').value;
    const name = document.getElementById('p-name').value;
    const category = document.getElementById('p-category').value;
    const price = parseFloat(document.getElementById('p-price').value);
    const stock = document.getElementById('p-stock').value;
    const description = document.getElementById('p-desc').value;
    let image = document.getElementById('p-image').value.trim() || 'logo.jpg';

    const saveBtn = document.getElementById('save-product-btn');
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    try {
        const productData = { name, category, price, stock, description, image };
        if (editId) {
            await updateDoc(doc(db, "bags", editId), productData);
        } else {
            await addDoc(collection(db, "bags"), productData);
        }
        productForm.reset();
        document.getElementById('edit-product-id').value = '';
        document.getElementById('form-title').textContent = 'Add New Item';
        saveBtn.textContent = 'Save Item to Database';
        saveBtn.disabled = false;
        loadProducts();
    } catch (error) {
        console.error("Error saving product:", error);
        saveBtn.textContent = 'Save Item to Database';
        saveBtn.disabled = false;
    }
});

// Handle Snapshot Form Submit (Supports multiple comma-separated URLs)
snapshotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('edit-snapshot-id').value;
    const title = document.getElementById('s-title').value;
    const category = document.getElementById('s-category').value;
    const image = document.getElementById('s-image').value.trim();

    const saveBtn = document.getElementById('save-snapshot-btn');
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    try {
        const snapshotData = { title, category, image };
        if (editId) {
            await updateDoc(doc(db, "snapshots", editId), snapshotData);
        } else {
            await addDoc(collection(db, "snapshots"), snapshotData);
        }
        snapshotForm.reset();
        document.getElementById('edit-snapshot-id').value = '';
        document.getElementById('snapshot-form-title').textContent = 'Add New Snapshot Photo';
        saveBtn.textContent = 'Save Snapshot';
        saveBtn.disabled = false;
        loadSnapshots();
    } catch (error) {
        console.error("Error saving snapshot:", error);
        saveBtn.textContent = 'Save Snapshot';
        saveBtn.disabled = false;
    }
});

window.editProduct = function(id) {
    const p = products.find(item => item.id === id);
    document.getElementById('edit-product-id').value = p.id;
    document.getElementById('p-name').value = p.name;
    document.getElementById('p-category').value = p.category;
    document.getElementById('p-price').value = p.price;
    document.getElementById('p-stock').value = p.stock || 'in';
    document.getElementById('p-image').value = p.image;
    document.getElementById('p-desc').value = p.description;
    document.getElementById('form-title').textContent = `Edit: ${p.name}`;
}

window.deleteProduct = function(id) {
    if (confirm("Are you sure you want to delete this bag?")) {
        deleteDoc(doc(db, "bags", id)).then(() => loadProducts());
    }
}

window.editSnapshot = function(id) {
    const s = snapshots.find(item => item.id === id);
    document.getElementById('edit-snapshot-id').value = s.id;
    document.getElementById('s-title').value = s.title;
    document.getElementById('s-category').value = s.category;
    document.getElementById('s-image').value = s.image;
    document.getElementById('snapshot-form-title').textContent = `Edit Snapshot: ${s.title}`;
}

window.deleteSnapshot = function(id) {
    if (confirm("Are you sure you want to delete this snapshot?")) {
        deleteDoc(doc(db, "snapshots", id)).then(() => loadSnapshots());
    }
}

// Filters & Tabs Setup
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => {
            b.classList.remove('bg-brand-800', 'text-brand-50');
            b.classList.add('bg-brand-200/60', 'text-brand-800');
        });
        e.target.classList.remove('bg-brand-200/60', 'text-brand-800');
        e.target.classList.add('bg-brand-800', 'text-brand-50');
        activeFilter = e.target.getAttribute('data-filter');
        renderProducts(activeFilter);
    });
});

document.querySelectorAll('.snapshot-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.snapshot-filter-btn').forEach(b => {
            b.classList.remove('bg-brand-800', 'text-brand-50');
            b.classList.add('bg-brand-200/60', 'text-brand-800');
        });
        e.target.classList.remove('bg-brand-200/60', 'text-brand-800');
        e.target.classList.add('bg-brand-800', 'text-brand-50');
        activeSnapshotFilter = e.target.getAttribute('data-filter');
        renderSnapshots(activeSnapshotFilter);
    });
});

const tabProductsBtn = document.getElementById('tab-products-btn');
const tabSnapshotsBtn = document.getElementById('tab-snapshots-btn');
const adminProductsSection = document.getElementById('admin-products-section');
const adminSnapshotsSection = document.getElementById('admin-snapshots-section');

if (tabProductsBtn && tabSnapshotsBtn) {
    tabProductsBtn.addEventListener('click', () => {
        tabProductsBtn.className = "admin-tab px-4 py-2 rounded-xl text-sm font-bold bg-brand-800 text-white transition";
        tabSnapshotsBtn.className = "admin-tab px-4 py-2 rounded-xl text-sm font-medium bg-brand-100 text-brand-800 hover:bg-brand-200 transition";
        adminProductsSection.classList.remove('hidden');
        adminSnapshotsSection.classList.add('hidden');
    });

    tabSnapshotsBtn.addEventListener('click', () => {
        tabSnapshotsBtn.className = "admin-tab px-4 py-2 rounded-xl text-sm font-bold bg-brand-800 text-white transition";
        tabProductsBtn.className = "admin-tab px-4 py-2 rounded-xl text-sm font-medium bg-brand-100 text-brand-800 hover:bg-brand-200 transition";
        adminSnapshotsSection.classList.remove('hidden');
        adminProductsSection.classList.add('hidden');
    });
}

// Cart & Inquiry Toggles / Handlers
window.addToCart = function(productId) {
    const product = products.find(p => p.id === productId);
    const existing = cart.find(item => item.id === productId);
    if (existing) existing.quantity += 1;
    else cart.push({ ...product, quantity: 1 });
    updateCartUI();
    document.getElementById('cart-drawer').classList.remove('hidden');
}

function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-badge').textContent = totalCount;
    document.getElementById('cart-count-header').textContent = totalCount;

    const cartItemsContainer = document.getElementById('cart-items');
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<p class="text-center text-brand-600 py-8 font-light">Your bag is currently empty.</p>`;
        document.getElementById('cart-subtotal').textContent = 'Rs. 0.00';
        return;
    }

    cartItemsContainer.innerHTML = '';
    let subtotal = 0;
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        const firstImg = item.image ? item.image.split(',')[0].trim() : 'logo.jpg';
        cartItemsContainer.innerHTML += `
            <div class="flex items-center space-x-4 bg-brand-100/50 p-3 rounded-2xl">
                <img src="${firstImg}" class="w-16 h-16 object-cover rounded-xl">
                <div class="flex-grow">
                    <h4 class="text-sm font-bold text-brand-900">${item.name}</h4>
                    <p class="text-xs text-brand-600">Rs. ${Number(item.price).toFixed(2)} × ${item.quantity}</p>
                </div>
            </div>`;
    });
    document.getElementById('cart-subtotal').textContent = `Rs. ${subtotal.toFixed(2)}`;
}

window.setQuery = function(questionText) {
    document.getElementById('inquiry-message').value = questionText;
    document.getElementById('inquiry-message').focus();
}

const inquiryForm = document.getElementById('inquiry-form');
if (inquiryForm) {
    inquiryForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const submitBtn = document.getElementById('inquiry-submit-btn');
        const formResult = document.getElementById('form-result');
        submitBtn.textContent = 'Sending Message...';
        submitBtn.disabled = true;
        formResult.classList.add('hidden');

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(Object.fromEntries(new FormData(inquiryForm)))
            });
            const result = await response.json();
            if (response.status === 200) {
                formResult.textContent = "✅ Success! Your private message has been sent.";
                formResult.className = "text-sm font-medium text-center text-green-700 bg-green-50 p-3 rounded-xl border border-green-200";
                formResult.classList.remove('hidden');
                inquiryForm.reset();
            } else {
                formResult.textContent = `❌ Error: ${result.message || "Something went wrong."}`;
                formResult.className = "text-sm font-medium text-center text-red-700 bg-red-50 p-3 rounded-xl border border-red-200";
                formResult.classList.remove('hidden');
            }
        } catch (error) {
            console.error(error);
            formResult.textContent = "❌ Network error. Please try again.";
            formResult.className = "text-sm font-medium text-center text-red-700 bg-red-50 p-3 rounded-xl border border-red-200";
            formResult.classList.remove('hidden');
        } finally {
            submitBtn.textContent = 'Send Private Message';
            submitBtn.disabled = false;
        }
    });
}

// UI Toggles
adminToggleBtn.addEventListener('click', () => adminLoginModal.classList.remove('hidden'));
closeLogin.addEventListener('click', () => adminLoginModal.classList.add('hidden'));
closeAdmin.addEventListener('click', () => adminModal.classList.add('hidden'));

document.getElementById('reset-form').addEventListener('click', () => {
    productForm.reset();
    document.getElementById('edit-product-id').value = '';
    document.getElementById('form-title').textContent = 'Add New Item';
});

document.getElementById('reset-snapshot-form').addEventListener('click', () => {
    snapshotForm.reset();
    document.getElementById('edit-snapshot-id').value = '';
    document.getElementById('snapshot-form-title').textContent = 'Add New Snapshot Photo';
});

document.getElementById('cart-btn').addEventListener('click', () => document.getElementById('cart-drawer').classList.remove('hidden'));
document.getElementById('close-cart').addEventListener('click', () => document.getElementById('cart-drawer').classList.add('hidden'));
document.getElementById('mobile-menu-btn').addEventListener('click', () => document.getElementById('mobile-menu').classList.remove('hidden'));
document.getElementById('close-mobile-menu').addEventListener('click', () => document.getElementById('mobile-menu').classList.add('hidden'));

// Initial Load
loadData();
