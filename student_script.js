// student_script.js (Client-side logic)
const API_URL = 'http://localhost:3000';
let currentOrder = {};
let selectedPayment = '';
let menuItems = [];

document.addEventListener('DOMContentLoaded', init);

// --- Utility Functions (Keep these local to the client) ---
function showNotification(message, type = 'success') {
    // Re-implemented locally since we removed data.js
    const notification = document.getElementById('notification');
    if (!notification) return;
    notification.textContent = message;
    notification.style.background = type === 'success' ? '#4CAF50' : '#f44336';
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

document.addEventListener('DOMContentLoaded', init);

// --- New Toggle Logic ---
const menuToggleButton = document.getElementById('menu-toggle-btn');
const menuContainer = document.getElementById('menu-container');

if (menuToggleButton) {
    menuToggleButton.addEventListener('click', () => {
        menuContainer.classList.toggle('open');
        menuToggleButton.classList.toggle('active');
        
        // Change text based on state
        const heading = menuToggleButton.querySelector('h2');
        const arrow = menuToggleButton.querySelector('.arrow');
        
        if (menuContainer.classList.contains('open')) {
            heading.innerHTML = '📋 Tap to Hide Menu';
            arrow.classList.remove('fa-chevron-down');
            arrow.classList.add('fa-chevron-up');
        } else {
            heading.innerHTML = '📋 Tap to View Today\'s Menu';
            arrow.classList.remove('fa-chevron-up');
            arrow.classList.add('fa-chevron-down');
        }
    });
}

// --- Main Init Function ---
async function init() {
    await fetchMenu();
    renderMenu();
}

// --- API Interaction ---
async function fetchMenu() {
    try {
        const response = await fetch(`${API_URL}/api/menu`);
        if (!response.ok) throw new Error('Failed to fetch menu');
        menuItems = await response.json();
    } catch (error) {
        console.error('Error fetching menu:', error);
        showNotification('Failed to load menu. Check server status.', 'error');
    }
}

// --- UI Rendering and Interaction ---

function renderMenu() {
    const menuListBody = document.getElementById('menu-list-body');
    menuListBody.innerHTML = '';

    menuItems.forEach(item => {
        // Initialize quantity display from currentOrder or 0
        const qty = currentOrder[item.id] ? currentOrder[item.id].quantity : 0;

        const menuItemDiv = document.createElement('div');
        menuItemDiv.className = 'menu-list-item';

        menuItemDiv.innerHTML = `
            <span class="col-name">
                <strong>${item.name}</strong> 
                <small style="display: block; color: #666;">(${item.category})</small>
            </span>
            <span class="col-price">₹${item.price}</span>
            <span class="col-qty">
                <div class="quantity-controls">
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span class="qty-display" id="qty-${item.id}">${qty}</span>
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
            </span>
        `;
        menuListBody.appendChild(menuItemDiv);
    });
}

window.updateQuantity = function(itemId, change) {
    const item = menuItems.find(i => i.id === itemId);
    if (!currentOrder[itemId]) {
        currentOrder[itemId] = { ...item, quantity: 0 };
    }
    
    currentOrder[itemId].quantity += change;
    
    if (currentOrder[itemId].quantity <= 0) {
        delete currentOrder[itemId];
    }
    
    const qtyDisplay = document.getElementById(`qty-${item.id}`);
    if (qtyDisplay) {
        qtyDisplay.textContent = currentOrder[itemId] ? currentOrder[itemId].quantity : 0;
    }
    
    updateOrderSummary();
}

function updateOrderSummary() {
    // ... (This function remains largely the same as the previous implementation)
    const orderSummary = document.getElementById('order-summary');
    const orderItems = document.getElementById('order-items');
    const totalAmount = document.getElementById('total-amount');
    const orderKeys = Object.keys(currentOrder);
    
    if (orderKeys.length === 0) {
        orderSummary.style.display = 'none';
        return;
    }
    
    orderSummary.style.display = 'block';
    orderItems.innerHTML = '';
    
    let total = 0;
    orderKeys.forEach(key => {
        const item = currentOrder[key];
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const orderItemDiv = document.createElement('div');
        orderItemDiv.className = 'order-item';
        orderItemDiv.innerHTML = `<span>${item.name} x ${item.quantity}</span><span>₹${itemTotal}</span>`;
        orderItems.appendChild(orderItemDiv);
    });
    
    totalAmount.textContent = `Total: ₹${total}`;
}

window.selectPayment = function(method) {
    // ... (This function remains the same as the previous implementation)
    selectedPayment = method;
    const options = document.querySelectorAll('#payment-options-container .payment-option');
    options.forEach(option => option.classList.remove('selected'));
    const selectedOption = Array.from(options).find(opt => opt.onclick.toString().includes(`selectPayment('${method}')`));
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
}

// --- Final API Call to Place Order ---
window.placeOrder = async function() {
    const customerName = document.getElementById('customer-name').value;
    const customerId = document.getElementById('customer-id').value;
    const pickupTime = document.getElementById('pickup-time').value;
    
    if (!customerName || !customerId || !pickupTime || !selectedPayment || Object.keys(currentOrder).length === 0) {
        showNotification('Please fill all required fields and select items!', 'error');
        return;
    }
    
    const orderData = {
        customerName,
        customerId,
        pickupTime,
        paymentMode: selectedPayment,
        items: currentOrder,
        total: Object.values(currentOrder).reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    
    try {
        const response = await fetch(`${API_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.message || 'Failed to place order.');

        // Reset UI on success
        currentOrder = {};
        selectedPayment = '';
        document.getElementById('customer-name').value = '';
        document.getElementById('customer-id').value = '';
        document.getElementById('pickup-time').value = '';
        document.querySelectorAll('#payment-options-container .payment-option').forEach(opt => opt.classList.remove('selected'));
        document.querySelectorAll('.qty-display').forEach(qty => qty.textContent = '0');
        updateOrderSummary();
        
        showNotification(`${result.message} Order ID: #${result.orderId}`, 'success');

    } catch (error) {
        console.error('Error placing order:', error);
        showNotification('Failed to place order. Server error.', 'error');
    }
}