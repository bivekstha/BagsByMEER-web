// Product Data for BagsByMeer
const products = [
    {
        id: 1,
        name: "The Heirloom Canvas Tote",
        category: "tote",
        price: 85.00,
        image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800",
        description: "Spacious, sturdy, and effortlessly elegant. Hand-sewn from heavy-duty organic canvas with reinforced vegetable-tanned leather straps."
    },
    {
        id: 2,
        name: "Chestnut Leather Crossbody",
        category: "crossbody",
        price: 120.00,
        image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=800",
        description: "Compact yet surprisingly roomy. Crafted with rich chestnut-toned fabric and brass hardware for your everyday adventures."
    },
    {
        id: 3,
        name: "Artisan Quilted Backpack",
        category: "backpack",
        price: 145.00,
        image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800",
        description: "Features custom hand-quilted stitching, secure drawstring closure, and comfortable padded shoulder straps."
    },
    {
        id: 4,
        name: "Minimalist Linen Market Bag",
        category: "tote",
        price: 65.00,
        image: "https://images.unsplash.com/photo-1598532163257-ae3c6c2524b6?auto=format&fit=crop&q=80&w=800",
        description: "Lightweight, breathable, and foldable. Perfect for farmers markets, bookstore trips, or sunny beach days."
    },
    {
        id: 5,
        name: "Midnight Velvet Evening Pouch",
        category: "crossbody",
        price: 75.00,
        image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&q=80&w=800",
        description: "Luxurious deep midnight velvet with a delicate chain strap. Designed for weddings, dinners, and evening elegance."
    },
    {
        id: 6,
        name: "Urban Corduroy Daypack",
        category: "backpack",
        price: 130.00,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800",
        description: "Textured vintage corduroy meets modern compartmentalization. Built for students and daily commuters alike."
    }
];

let cart = [];
let activeFilter = 'all';

// DOM Elements
const productGrid = document.getElementById('product-grid');
const cartDrawer = document.getElementById('cart-drawer');
const cartBtn = document.getElementById('cart-btn');
const closeCart = document.getElementById('close-cart');
const cartBadge = document.getElementById('cart-badge');
const cartCountHeader = document.getElementById('cart-count-header');
const cartItemsContainer = document.getElementById('cart-items');
const cartSubtotal = document.getElementById('cart-subtotal');
const mobileMenu = document.getElementById('mobile-menu');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const closeMobileMenu = document.getElementById('close-mobile-menu');
const productModal = document.getElementById('product-modal');
const closeModal = document.getElementById('close-modal');

// Render Products
function renderProducts(filter = 'all') {
    productGrid.innerHTML = '';
    const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);

    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'group bg-white rounded-3xl overflow-hidden border border-brand-200/60 shadow-sm hover:shadow-xl transition duration-300 flex flex-col justify-between cursor-pointer';
        card.innerHTML = `
            <div class="relative overflow-hidden aspect-[4/3] bg-brand-100" onclick="openProductModal(${product.id})">
                <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                <span class="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-brand-900 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">${product.category}</span>
            </div>
            <div class="p-6 flex flex-col flex-grow justify-between">
                <div onclick="openProductModal(${product.id})">
                    <h3 class="font-serif text-xl font-bold text-brand-900 group-hover:text-brand-600 transition">${product.name}</h3>
                    <p class="text-brand-700 text-sm font-light mt-1 line-clamp-2">${product.description}</p>
                </div>
                <div class="flex items-center justify-between mt-6 pt-4 border-t border-brand-100">
                    <span class="text-lg font-bold text-brand-900">$${product.price.toFixed(2)}</span>
                    <button onclick="addToCart(${product.id})" class="bg-brand-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 transition shadow-sm">
                        + Add
                    </button>
                </div>
            </div>
        `;
        productGrid.appendChild(card);
    });
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
        renderProducts(e.target.getAttribute('data-filter'));
    });
});

// Cart Management
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCartUI();
    cartDrawer.classList.remove('hidden');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
}

function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalCount;
    cartCountHeader.textContent = totalCount;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<p class="text-center text-brand-600 py-8 font-light">Your bag is currently empty.</p>`;
        cartSubtotal.textContent = '$0.00';
        return;
    }

    cartItemsContainer.innerHTML = '';
    let subtotal = 0;

    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        const itemEl = document.createElement('div');
        itemEl.className = 'flex items-center space-x-4 bg-brand-100/50 p-3 rounded-2xl';
        itemEl.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-xl">
            <div class="flex-grow">
                <h4 class="text-sm font-bold text-brand-900">${item.name}</h4>
                <p class="text-xs text-brand-600">$${item.price.toFixed(2)} × ${item.quantity}</p>
            </div>
            <button onclick="removeFromCart(${item.id})" class="text-brand-800 hover:text-red-600 p-2"><i class="fa-solid fa-trash-can text-sm"></i></button>
        `;
        cartItemsContainer.appendChild(itemEl);
    });

    cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
}

// Modal View
function openProductModal(productId) {
    const product = products.find(p => p.id === productId);
    document.getElementById('modal-img').src = product.image;
    document.getElementById('modal-category').textContent = product.category;
    document.getElementById('modal-title').textContent = product.name;
    document.getElementById('modal-price').textContent = `$${product.price.toFixed(2)}`;
    document.getElementById('modal-desc').textContent = product.description;

    document.getElementById('modal-add-btn').onclick = () => {
        addToCart(product.id);
        productModal.classList.add('hidden');
        productModal.classList.remove('flex');
    };

    productModal.classList.remove('hidden');
    productModal.classList.add('flex');
}

closeModal.addEventListener('click', () => {
    productModal.classList.add('hidden');
    productModal.classList.remove('flex');
});

// Cart Drawer Toggles
cartBtn.addEventListener('click', () => cartDrawer.classList.remove('hidden'));
closeCart.addEventListener('click', () => cartDrawer.classList.add('hidden'));

// Mobile Menu Toggles
mobileMenuBtn.addEventListener('click', () => mobileMenu.classList.remove('hidden'));
closeMobileMenu.addEventListener('click', () => mobileMenu.classList.add('hidden'));
document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
});

// Initialize catalog on load
renderProducts();
