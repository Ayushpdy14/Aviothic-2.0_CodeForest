// staff_script.js (Client-side logic)
const API_URL = 'http://localhost:3000';

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

// --- Main Init Function ---
function init() {
    loadAndRenderOrders();
}

// --- API Interaction ---
async function loadAndRenderOrders() {
    try {
        const response = await fetch(`${API_URL}/api/orders`);
        if (!response.ok) throw new Error('Failed to fetch orders');
        const orders = await response.json();
        renderStaffDashboard(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        showNotification('Failed to load orders. Check server connection.', 'error');
        document.getElementById('staff-dashboard-grid').innerHTML = '<div style="text-align: center; color: #f44336; grid-column: 1/-1;">Could not connect to the server.</div>';
    }
}

async function updateStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newStatus })
        });
        
        const result = await response.json();

        if (!response.ok) throw new Error(result.message || 'Failed to update status.');

        showNotification(result.message, 'success');
        loadAndRenderOrders(); // Refresh dashboard

    } catch (error) {
        console.error('Error updating status:', error);
        showNotification('Error updating order status. Try again.', 'error');
    }
}

// Publicly exposed functions for HTML buttons
window.updateOrderStatus = (orderId, newStatus) => updateStatus(orderId, newStatus);
window.completeOrder = (orderId) => updateStatus(orderId, 'delivered');
window.refreshOrders = () => loadAndRenderOrders();

// --- UI Rendering ---
function renderStaffDashboard(orders) {
    const dashboard = document.getElementById('staff-dashboard-grid');
    dashboard.innerHTML = '';
    
    if (orders.length === 0) {
        dashboard.innerHTML = '<div style="text-align: center; color: #666; grid-column: 1/-1;">No active orders.</div>';
        return;
    }
    
    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = `order-card ${order.status}`;
        
        const itemsList = Object.values(order.items).map(item => 
            `${item.name} x ${item.quantity}`
        ).join(', ');
        
        // Button Logic
        let buttonHTML = '';
        if (order.status === 'pending') {
            buttonHTML = `<button class="btn btn-primary" onclick="updateOrderStatus(${order.id}, 'preparing')">Start Preparing</button>`;
        } else if (order.status === 'preparing') {
            buttonHTML = `<button class="btn btn-primary" onclick="updateOrderStatus(${order.id}, 'ready')">Mark Ready</button>`;
        } else if (order.status === 'ready') {
            buttonHTML = `<button class="btn btn-secondary" onclick="completeOrder(${order.id})">Order Delivered</button>`;
        }
        
        orderCard.innerHTML = `
            <div class="order-status status-${order.status}">
                ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </div>
            <h4>Order #${order.id.toString().slice(-4)}</h4>
            <p><strong>Customer:</strong> ${order.customerName}</p>
            <p><strong>ID:</strong> ${order.customerId}</p>
            <p><strong>Items:</strong> ${itemsList}</p>
            <p><strong>Pickup Time:</strong> ${order.pickupTime}</p>
            <p><strong>Total:</strong> ₹${order.total}</p>
            <div style="margin-top: 15px;">${buttonHTML}</div>
        `;
        
        dashboard.appendChild(orderCard);
    });
}