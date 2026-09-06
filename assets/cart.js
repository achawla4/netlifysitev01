// Global Cart and Checkout Controller
(function() {
  // Config Defaults
  const config = window.REAL_CONFIG || {
    PAYEE_UPI_ID: "9953039224@ybl",
    PAYEE_NAME: "REAL Institute",
    DELIVERY_EMAIL: "aman.chawla@gmail.com"
  };

  // State
  let cart = [];

  // Initialize
  function initCart() {
    // Load from localStorage if available
    const saved = localStorage.getItem('real_cart');
    if (saved) {
      try {
        cart = JSON.parse(saved);
      } catch (e) {
        cart = [];
      }
    }

    // Parse URL query parameters to support external additions (e.g. from Leibnitz)
    const urlParams = new URLSearchParams(window.location.search);
    const itemToAdd = urlParams.get('add-to-cart');
    const priceToAdd = urlParams.get('price');
    const locToAdd = urlParams.get('loc'); // optional location info
    
    if (itemToAdd && priceToAdd) {
      const price = Number(priceToAdd);
      if (!isNaN(price)) {
        // Add to cart if not already present
        if (!cart.some(item => item.title === itemToAdd)) {
          cart.push({ title: itemToAdd, price: price, loc: locToAdd || undefined });
          saveCart();
        }
        
        // Clean URL to prevent duplicate adds on reload
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // Redirect to checkout.html if not already there
        if (!window.location.pathname.endsWith('checkout.html')) {
          window.location.href = 'checkout.html';
          return;
        }
      }
    }

    updateCartUI();
    
    // Check if we are on the checkout page
    if (document.getElementById('checkoutPageContainer')) {
      renderCheckoutPage();
    }
    
    // Legacy support: Bind click outside modals to close them (if modals exist)
    window.addEventListener('click', function(e) {
      const upiModal = document.getElementById('upiModal');
      const cartModal = document.getElementById('cartModal');
      const payModal = document.getElementById('payModal');
      if (e.target === upiModal) upiModal.style.display = 'none';
      if (e.target === cartModal) cartModal.style.display = 'none';
      if (e.target === payModal) payModal.style.display = 'none';
    });
  }

  // Save Cart to local storage
  function saveCart() {
    localStorage.setItem('real_cart', JSON.stringify(cart));
  }

  // Add Item
  window.addToCart = function(title, price, extra = {}) {
    if (cart.some(item => item.title === title)) {
      alert('This item is already in your cart.');
      return;
    }
    cart.push({ title, price: Number(price), ...extra });
    saveCart();
    updateCartUI();
    alert(`"${title}" has been added to your cart.`);
  };

  // Remove Item
  window.removeFromCart = function(title) {
    cart = cart.filter(item => item.title !== title);
    saveCart();
    updateCartUI();
    const container = document.getElementById('cartItemsContainer');
    if (container) renderCartItems();
  };

  // Helper for Checkout Page removal
  window.removeFromCartAndReload = function(title) {
    cart = cart.filter(item => item.title !== title);
    saveCart();
    updateCartUI();
    renderCheckoutPage();
  };

  // Update Badge & Button visibility
  function updateCartUI() {
    const count = cart.length;
    const badge = document.getElementById('cartBadge');
    const btn = document.getElementById('cartFloatingBtn');
    
    if (badge) badge.textContent = count;
    if (btn) btn.style.display = count > 0 ? 'flex' : 'none';
  }

  // Render Cart items in modal (legacy fallback / standard display)
  window.renderCartItems = function() {
    const container = document.getElementById('cartItemsContainer');
    if (!container) return;

    if (cart.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--ink-soft, #3c4c60); padding: 20px 0;">Your cart is empty.</p>';
      const totalDisplay = document.getElementById('cartTotalDisplay');
      if (totalDisplay) totalDisplay.textContent = '₹0';
      const checkoutBtn = document.getElementById('checkoutBtn');
      if (checkoutBtn) checkoutBtn.disabled = true;
      return;
    }
    
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) checkoutBtn.disabled = false;
    
    const usdRate = config.INR_TO_USD_RATE || 0.012;
    let total = 0;
    container.innerHTML = cart.map(item => {
      total += item.price;
      const usdPrice = Math.max(1, Math.round(item.price * usdRate * 100) / 100).toFixed(2);
      return `
        <div class="cart-item">
          <div class="cart-item-info">
            <div class="cart-item-title">${item.title}</div>
            <div class="cart-item-price">$${usdPrice} USD</div>
          </div>
          <button class="cart-item-remove" onclick="removeFromCart('${item.title.replace(/'/g, "\\'")}')">&times;</button>
        </div>
      `;
    }).join('');

    const usdTotal = Math.max(1, Math.round(total * usdRate * 100) / 100).toFixed(2);
    const totalDisplay = document.getElementById('cartTotalDisplay');
    if (totalDisplay) totalDisplay.textContent = `$${usdTotal} USD`;
  };

  // Redirect to Checkout page
  window.openCartModal = function() {
    window.location.href = 'checkout.html';
  };

  window.closeCartModal = function() {
    const modal = document.getElementById('cartModal');
    if (modal) modal.style.display = 'none';
  };

  // Build UPI links dynamically
  function buildUpiLink(amount, note, payeeName) {
    const cleanUpi = (config.PAYEE_UPI_ID || "9953039224@ybl").trim();
    const encodedNote = encodeURIComponent(note);
    const encodedName = encodeURIComponent(payeeName);
    return `upi://pay?pa=${cleanUpi}&pn=${encodedName}&am=${amount}&cu=INR&tn=${encodedNote}`;
  }

  // Generate QR Code data URI via Google Chart API
  function buildQrDataUri(text) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(text)}`;
  }

  let currentPaymentMethod = 'upi';

  window.switchPaymentTab = function(method) {
    currentPaymentMethod = method;
    const tabUpi = document.getElementById('tabBtnUpi');
    const tabPaypal = document.getElementById('tabBtnPaypal');
    const contentUpi = document.getElementById('paymentContentUpi');
    const contentPaypal = document.getElementById('paymentContentPaypal');
    const amountLabel = document.getElementById('paymentAmountLabel');
    const payAmountDisplay = document.getElementById('checkoutPayAmountDisplay');
    const utrLabel = document.getElementById('utrLabel');
    const utrInput = document.getElementById('utr');
    const paymentMethodInput = document.getElementById('orderPaymentMethodInput');

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const usdRate = config.INR_TO_USD_RATE || 0.012;
    const usdTotal = Math.max(1, Math.round(total * usdRate * 100) / 100).toFixed(2);

    const paypalPayBtn = document.getElementById('paypalPayBtn');
    if (paypalPayBtn) {
      const paypalMeBase = config.PAYEE_PAYPAL_ME || "https://paypal.me/amanalliance";
      paypalPayBtn.href = `${paypalMeBase}/${usdTotal}USD`;
    }

    if (method === 'upi') {
      if (tabUpi) {
        tabUpi.classList.add('active');
        tabUpi.style.background = 'var(--card, #faf5e8)';
        tabUpi.style.color = 'var(--brass-dark, #7e5a29)';
        tabUpi.style.borderColor = 'var(--brass, #a9793c)';
      }
      if (tabPaypal) {
        tabPaypal.classList.remove('active');
        tabPaypal.style.background = 'transparent';
        tabPaypal.style.color = 'var(--ink-soft, #3c4c60)';
        tabPaypal.style.borderColor = 'var(--rule, #cdbd94)';
      }
      if (contentUpi) contentUpi.style.display = 'block';
      if (contentPaypal) contentPaypal.style.display = 'none';
      if (amountLabel) amountLabel.textContent = 'Amount to Pay (₹)';
      if (payAmountDisplay) payAmountDisplay.textContent = `₹${total}`;
      if (utrLabel) utrLabel.textContent = 'UTR / UPI Transaction Reference ID (12-digit) *';
      if (utrInput) {
        utrInput.placeholder = 'e.g. 629845701923';
      }
      if (paymentMethodInput) paymentMethodInput.value = 'UPI / PhonePe';
    } else {
      if (tabPaypal) {
        tabPaypal.classList.add('active');
        tabPaypal.style.background = 'var(--card, #faf5e8)';
        tabPaypal.style.color = 'var(--brass-dark, #7e5a29)';
        tabPaypal.style.borderColor = 'var(--brass, #a9793c)';
      }
      if (tabUpi) {
        tabUpi.classList.remove('active');
        tabUpi.style.background = 'transparent';
        tabUpi.style.color = 'var(--ink-soft, #3c4c60)';
        tabUpi.style.borderColor = 'var(--rule, #cdbd94)';
      }
      if (contentUpi) contentUpi.style.display = 'none';
      if (contentPaypal) contentPaypal.style.display = 'block';
      if (amountLabel) amountLabel.textContent = 'Amount to Pay ($ USD)';
      if (payAmountDisplay) payAmountDisplay.textContent = `$${usdTotal} USD (approx ₹${total})`;
      if (utrLabel) utrLabel.textContent = 'PayPal Transaction ID / Payment Reference *';
      if (utrInput) {
        utrInput.placeholder = 'e.g. 54X19382AB817342L or PayPal email';
      }
      if (paymentMethodInput) paymentMethodInput.value = 'PayPal / Credit Card';
    }
  };

  window.closePayModal = function() {
    const payModal = document.getElementById('payModal') || document.getElementById('upiModal');
    if (payModal) payModal.style.display = 'none';
  };

  window.copyUpiId = function() {
    navigator.clipboard.writeText(config.PAYEE_UPI_ID).then(() => {
      const btn = event.target;
      const originalText = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = originalText; }, 1800);
    });
  };

  window.copyPaypalEmail = function() {
    const email = config.PAYEE_PAYPAL_EMAIL || "amanalliance@gmail.com";
    navigator.clipboard.writeText(email).then(() => {
      const btn = event.target;
      const originalText = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = originalText; }, 1800);
    });
  };

  // Render Dedicated Checkout Page
  function renderCheckoutPage() {
    const container = document.getElementById('checkoutCartItemsContainer');
    const paymentPanel = document.getElementById('checkoutPaymentPanel');
    const totalDisplay = document.getElementById('checkoutTotalDisplay');
    const payAmountDisplay = document.getElementById('checkoutPayAmountDisplay');
    
    if (!container) return;

    if (cart.length === 0) {
      container.innerHTML = `
        <div class="empty-cart-state">
          <p>Your shopping cart is empty.</p>
          <a href="javascript:history.back()" class="shop-btn">Continue Shopping</a>
        </div>
      `;
      if (totalDisplay) totalDisplay.textContent = '$0 USD';
      if (payAmountDisplay) payAmountDisplay.textContent = '0';
      if (paymentPanel) paymentPanel.style.display = 'none';
      return;
    }

    if (paymentPanel) paymentPanel.style.display = 'block';

    const usdRate = config.INR_TO_USD_RATE || 0.012;
    let total = 0;
    container.innerHTML = cart.map(item => {
      total += item.price;
      const usdPrice = Math.max(1, Math.round(item.price * usdRate * 100) / 100).toFixed(2);
      return `
        <div class="checkout-item">
          <div>
            <div class="checkout-item-title">${item.title}</div>
            <div class="checkout-item-price">$${usdPrice} USD</div>
          </div>
          <button class="checkout-item-remove" onclick="removeFromCartAndReload('${item.title.replace(/'/g, "\\'")}')">&times;</button>
        </div>
      `;
    }).join('');

    const usdTotal = Math.max(1, Math.round(total * usdRate * 100) / 100).toFixed(2);

    if (totalDisplay) totalDisplay.textContent = `$${usdTotal} USD`;

    const titles = cart.map(item => item.title).join(', ');
    const locations = cart.map(item => `${item.title} (${item.loc || 'Digital'})`).join('; ');
    
    const note = `REAL Institute - ${cart.length} items`;
    const upiLink = buildUpiLink(total, note, config.PAYEE_NAME);

    const phonepeLink = document.getElementById('phonepeLink');
    if (phonepeLink) phonepeLink.href = upiLink;
    
    const qrImg = document.getElementById('qrImg');
    if (qrImg) qrImg.src = buildQrDataUri(upiLink);

    // Sync tab interface and payment parameters
    switchPaymentTab(currentPaymentMethod);

    // Form fields
    const orderBookTitle = document.getElementById('orderBookTitle');
    if (orderBookTitle) orderBookTitle.textContent = titles;

    const orderBookInput = document.getElementById('orderBookInput');
    if (orderBookInput) orderBookInput.value = titles;

    const orderLocationInput = document.getElementById('orderLocationInput');
    if (orderLocationInput) orderLocationInput.value = locations;

    const orderAmountInput = document.getElementById('orderAmountInput');
    if (orderAmountInput) orderAmountInput.value = `₹${total} ($${usdTotal} USD)`;

    // Dynamic physical shipping fields
    const hasPhysical = cart.some(item => item.loc);
    const phoneField = document.getElementById('phoneField');
    const addressField = document.getElementById('addressField');
    const buyerPhone = document.getElementById('buyerPhone');
    const shippingAddress = document.getElementById('shippingAddress');

    if (phoneField && addressField && buyerPhone && shippingAddress) {
      if (hasPhysical) {
        phoneField.style.display = 'block';
        addressField.style.display = 'block';
        buyerPhone.required = true;
        shippingAddress.required = true;
      } else {
        phoneField.style.display = 'none';
        addressField.style.display = 'none';
        buyerPhone.required = false;
        shippingAddress.required = false;
      }
    }
  }

  // Submit Order handler
  window.handleOrderSubmit = async function(e, isDigital = true) {
    e.preventDefault();
    const form = e.currentTarget;
    const utrInput = document.getElementById('utr');
    const utr = utrInput ? utrInput.value.trim() : '';
    const status = document.getElementById('orderStatus');
    const submitBtn = document.getElementById('submitOrderBtn');
    
    if (currentPaymentMethod === 'upi') {
      if (!/^\d{12}$/.test(utr)) {
        if (status) {
          status.textContent = 'Please enter exactly 12 digits for the UTR / UPI reference ID.';
          status.className = 'order-status error';
          status.style.display = 'block';
        }
        return;
      }
    } else {
      if (utr.length < 3) {
        if (status) {
          status.textContent = 'Please enter your PayPal Transaction ID or payment reference email.';
          status.className = 'order-status error';
          status.style.display = 'block';
        }
        return;
      }
    }
    
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting…';
    }
    if (status) status.style.display = 'none';
    
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Submission failed');
      
      const hasPhysical = cart.some(item => item.loc);
      const refLabel = currentPaymentMethod === 'upi' ? 'UTR transaction reference' : 'PayPal payment reference';
      const successMsg = hasPhysical 
        ? `Thank you for your order. We are verifying ${refLabel} <strong>${utr}</strong>. Your physical items will be prepared for dispatch within 24 hours.`
        : `Thank you for your offering. We are verifying ${refLabel} <strong>${utr}</strong>. The requested items will be delivered to your email address <strong>${form.email.value}</strong> within 24 hours.`;

      // Replace layout with a gorgeous success message
      const layoutContainer = document.querySelector('.checkout-layout');
      if (layoutContainer) {
        layoutContainer.innerHTML = `
          <div class="checkout-panel" style="grid-column: span 2; text-align: center; padding: 60px 40px;">
            <div style="font-size: 4rem; color: var(--sage); margin-bottom: 20px;">✓</div>
            <h2 style="font-family: 'Fraunces', serif; font-size: 2.2rem; margin-bottom: 16px; border: none; padding: 0;">Order Submitted Successfully!</h2>
            <p style="font-size: 1.1rem; max-width: 600px; margin: 0 auto 30px; color: var(--ink-soft);">
              ${successMsg}
            </p>
            <a href="index.html" class="shop-btn" style="border: 2px solid var(--ink); color: var(--ink);">Return to Homepage</a>
          </div>
        `;
      }
      
      // Clear Cart
      cart = [];
      saveCart();
      updateCartUI();
      form.reset();
      
    } catch (err) {
      if (status) {
        status.textContent = `Failed to submit details. Please email your transaction reference and items to ${config.DELIVERY_EMAIL}.`;
        status.className = 'order-status error';
        status.style.display = 'block';
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Order & Verification Request';
      }
    }
  };

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCart);
  } else {
    initCart();
  }
})();
