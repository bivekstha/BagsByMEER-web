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
let cart = [];
let activeFilter = 'all';

// DOM Elements
const productGrid = document.getElementById('product-grid');
const adminLoginModal = document.getElementById('admin-login-modal');
const adminModal = document.getElementById('admin-modal');
const adminToggleBtn = document.getElementById('admin-toggle-btn');
const closeLogin = document.getElementById('close-login');
const closeAdmin = document.getElementById('close-admin');
const loginForm = document.getElementById('login-form');
const productForm = document.getElementById('product-form');
const adminProductList = document.getElementById('admin-product-list');

// Load Products from Firestore Database on Startup
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

// Render Catalog Grid
function renderProducts(filter = 'all') {
    productGrid.innerHTML = '';
    const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);
    
    if (filtered.length === 0) {
        productGrid.innerHTML = `<div class="col-span-full text-center py-12 text-brand-600 font-light">No bags found in this category. Use the Admin panel to add some!</div>`;
        return;
    }

    filtered.forEach(product => {
        const isOutOfStock = product.stock === 'out';
        const card = document.createElement('div');
        card.className = 'group bg-white rounded-3xl overflow-hidden border border-brand-200/60 shadow-sm hover:shadow-xl transition duration-300 flex flex-col justify-between relative';
        card.innerHTML = `
            <div class="relative overflow-hidden aspect-[4/3] bg-brand-100">
                <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500 ${isOutOfStock ? 'opacity-50 grayscale' : ''}">
                <span class="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-brand-900 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">${product.category}</span>
                ${isOutOfStock ? '<span class="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">Out of Stock</span>' : ''}
            </div>
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

// Render Admin List
function renderAdminList() {
    adminProductList.innerHTML = '';
    products.forEach(p => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between bg-white p-3 rounded-xl border border-brand-200 text-sm';
        item.innerHTML = `
            <div class="flex items-center space-x-3">
                <img src="${p.image}" class="w-10 h-10 object-cover rounded-lg">
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

// Handle Form Submit (Add or Update Item via Firestore Database)
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('edit-product-id').value;
    const name = document.getElementById('p-name').value;
    const category = document.getElementById('p-category').value;
    const price = parseFloat(document.getElementById('p-price').value);
    const stock = document.getElementById('p-stock').value;
    const description = document.getElementById('p-desc').value;
    let image = document.getElementById('p-image').value || 'logo.jpg';

    const saveBtn = document.getElementById('save-product-btn');
    saveBtn.textContent = 'Saving to Database...';
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
        alert("Failed to save product.");
        saveBtn.textContent = 'Save Item to Database';
        saveBtn.disabled = false;
    }
});

// Edit Product Helper
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

// Delete Product Helper
window.deleteProduct = function(id) {
    if (confirm("Are you sure you want to delete this bag from the database?")) {
        deleteDoc(doc(db, "bags", id)).then(() => loadProducts());
    }
}

// Filter buttons
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

// Cart Management
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
        cartItemsContainer.innerHTML += `
            <div class="flex items-center space-x-4 bg-brand-100/50 p-3 rounded-2xl">
                <img src="${item.image}" class="w-16 h-16 object-cover rounded-xl">
                <div class="flex-grow">
                    <h4 class="text-sm font-bold text-brand-900">${item.name}</h4>
                    <p class="text-xs text-brand-600">Rs. ${Number(item.price).toFixed(2)} × ${item.quantity}</p>
                </div>
            </div>`;
    });
    document.getElementById('cart-subtotal').textContent = `Rs. ${subtotal.toFixed(2)}`;
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
document.getElementById('cart-btn').addEventListener('click', () => document.getElementById('cart-drawer').classList.remove('hidden'));
document.getElementById('close-cart').addEventListener('click', () => document.getElementById('cart-drawer').classList.add('hidden'));
document.getElementById('mobile-menu-btn').addEventListener('click', () => document.getElementById('mobile-menu').classList.remove('hidden'));
// Function to auto-fill the query text when a quick button is clicked
window.setQuery = function(questionText) {
    document.getElementById('inquiry-message').value = questionText;
    document.getElementById('inquiry-message').focus();
}

// Handle Customer Inquiry Submission
const inquiryForm = document.getElementById('inquiry-form');
if (inquiryForm) {
    inquiryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('inquiry-name').value;
        const contact = document.getElementById('inquiry-contact').value;
        const message = document.getElementById('inquiry-message').value;
        const submitBtn = document.getElementById('inquiry-submit-btn');

        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        try {
            // Save the customer inquiry into a 'messages' collection in Firestore
            await addDoc(collection(db, "messages"), {
                name,
                contact,
                message,
                timestamp: new Date().toISOString()
            });

            alert('Thank you! Your message has been sent successfully to BagsByMeer.');
            inquiryForm.reset();
            submitBtn.textContent = 'Send Inquiry';
            submitBtn.disabled = false;
        } catch (error) {
            console.error("Error sending inquiry:", error);
            alert('Failed to send message. Please try again.');
            submitBtn.textContent = 'Send Inquiry';
            submitBtn.disabled = false;
        }
    });
}
document.getElementById('close-mobile-menu').addEventListener('click', () => document.getElementById('mobile-menu').classList.add('hidden'));

// Initial Load
loadProducts();
