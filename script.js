// API base (local dev). Change if deploying to a different host.
const API_BASE = 'http://localhost:3000/api';
// Cheesecake Product Price
const PRODUCT_PRICE = 25.00;
const REVIEWS_STORAGE_KEY = 'gleejeyly_reviews';

// Reviews - try API first, fallback to localStorage
let reviews = [];

function loadReviewsFromStorage() {
    const stored = localStorage.getItem(REVIEWS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveReviewsToStorage() {
    try {
        localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
    } catch (e) {
        // ignore
    }
}

async function loadReviews() {
    // Try API
    try {
        const res = await fetch(`${API_BASE}/reviews`, { method: 'GET' });
        if (res.ok) {
            reviews = await res.json();
            // Mirror to localStorage for offline
            saveReviewsToStorage();
            displayReviews();
            return;
        }
    } catch (e) {
        // network error -> fallback
    }

    // Fallback
    reviews = loadReviewsFromStorage();
    displayReviews();
}

// Utility: escape HTML to prevent injection
function escapeHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function saveReviewToAPI(review) {
    try {
        const res = await fetch(`${API_BASE}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(review)
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.reviews) {
                reviews = data.reviews;
            }
            saveReviewsToStorage();
            return true;
        }
    } catch (e) {
        // ignore
    }
    return false;
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initFAQ();
    initOrderForm();
    initReviewForm();
    // Load reviews after review form is initialized
    loadReviews();
});

// 1. Navigation Manager
function initNavigation() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('nav');
    const navMenu = document.querySelector('nav ul');
    
    if (!mobileMenuBtn || !nav || !navMenu) return;
    
    // Mobile menu toggle
    mobileMenuBtn.addEventListener('click', () => {
        nav.classList.toggle('show');
        mobileMenuBtn.setAttribute('aria-expanded', nav.classList.contains('show'));
    });
    
    // Close menu when clicking on a link
    document.querySelectorAll('nav ul li a').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('show');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
        });
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                nav.classList.remove('show');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// 2. FAQ Accordion
function initFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const isExpanded = question.getAttribute('aria-expanded') === 'true';
            const answer = question.nextElementSibling;
            
            if (!answer) return;
            
            // Toggle current question
            question.setAttribute('aria-expanded', !isExpanded);
            
            // Toggle answer
            if (isExpanded) {
                answer.classList.remove('open');
            } else {
                // Close all other answers
                faqQuestions.forEach(q => {
                    if (q !== question) {
                        q.setAttribute('aria-expanded', 'false');
                        const nextAnswer = q.nextElementSibling;
                        if (nextAnswer) {
                            nextAnswer.classList.remove('open');
                        }
                    }
                });
                answer.classList.add('open');
            }
        });
    });
}

// 3. Order Form Handler
function initOrderForm() {
    const orderForm = document.getElementById('orderForm');
    if (!orderForm) return;
    
    // Quantity selector buttons
    const qtyMinus = document.getElementById('qtyMinus');
    const qtyPlus = document.getElementById('qtyPlus');
    const qtyDisplay = document.getElementById('quantity');
    const qtyValue = document.getElementById('quantityValue');
    
    if (qtyMinus && qtyPlus && qtyDisplay && qtyValue) {
        qtyMinus.addEventListener('click', (e) => {
            e.preventDefault();
            let qty = parseInt(qtyValue.value) || 0;
            if (qty > 1) {
                qty--;
                qtyValue.value = qty;
                qtyDisplay.textContent = qty;
                updateOrderSummary();
            }
        });

        qtyPlus.addEventListener('click', (e) => {
            e.preventDefault();
            let qty = parseInt(qtyValue.value) || 0;
            qty++;
            qtyValue.value = qty;
            qtyDisplay.textContent = qty;
            updateOrderSummary();
        });
    }
    
    // Set minimum date (3 days from now)
    const pickupDate = document.getElementById('pickupDate');
    if (pickupDate) {
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 3);
        pickupDate.min = minDate.toISOString().split('T')[0];
    }
    
    // Add real-time validation listeners
    const fullNameInput = document.getElementById('fullName');
    const phoneInput = document.getElementById('phoneNumber');
    const facebookInput = document.getElementById('facebook');
    const dateInput = document.getElementById('pickupDate');
    const submitBtn = document.getElementById('submitBtn');
    
    // Validate on input
    [fullNameInput, phoneInput, facebookInput, dateInput].forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                validateFieldRealTime(input);
            });
            input.addEventListener('change', () => {
                validateFieldRealTime(input);
            });
        }
    });
    
    // Remove button disabled state - always enabled
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.add('enabled');
    }
    
    // Form submission
    orderForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (validateForm()) {
            // Prepare order data
            const fullName = document.getElementById('fullName').value;
            const phoneNumber = document.getElementById('phoneNumber').value;
            const facebook = document.getElementById('facebook').value;
            const pickupDate = document.getElementById('pickupDate').value;
            const quantity = parseInt(document.getElementById('quantityValue').value) || 1;
            const total = PRODUCT_PRICE * quantity;

            const order = {
                fullName,
                phoneNumber,
                facebook,
                pickupDate,
                quantity,
                total,
                createdAt: new Date().toISOString()
            };

            // Try to save order to API (best-effort)
            try {
                await fetch(`${API_BASE}/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(order)
                });
            } catch (e) {
                // ignore API errors; proceed with existing flow
            }

            // Prepare message for WhatsApp or Messenger
            const message = `Order from ${fullName}%0APhone: ${phoneNumber}%0AFacebook: ${facebook}%0APickup Date: ${pickupDate}%0AQuantity: ${quantity} pcs%0ATotal: ₱${total}`;

            // Show success modal
            showSuccessModal();

            // Reset form
            orderForm.reset();

            // Redirect to WhatsApp after a delay
            setTimeout(() => {
                window.location.href = `https://wa.me/639123456789?text=${message}`;
            }, 2000);
        } else {
            // Find the first invalid field and scroll to it
            const invalidField = orderForm.querySelector('.form-group.invalid input, .form-group.invalid select, .form-group.invalid .qty-display');
            if (invalidField) {
                const formGroup = invalidField.closest('.form-group');
                if (formGroup) {
                    formGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    });

    // Initialize summary display on load
    updateOrderSummary();
}

function updateOrderSummary() {
    const quantity = parseInt(document.getElementById('quantityValue').value) || 1;
    const unitPrice = PRODUCT_PRICE;
    const total = unitPrice * quantity;
    
    // Update summary display
    const qtyDisplay = document.getElementById('summaryQty');
    const totalDisplay = document.getElementById('summaryTotal');
    
    if (qtyDisplay) qtyDisplay.textContent = quantity;
    if (totalDisplay) totalDisplay.textContent = `₱${total.toFixed(2)}`;
}
// Real-time field validation helper
function validateFieldRealTime(element) {
    if (!element) return false;
    const id = element.id;
    let valid = true;
    let message = '';

    if (id === 'fullName') {
        if (!element.value.trim()) { valid = false; message = 'Full name is required'; }
    } else if (id === 'phoneNumber') {
        const phone = element.value.trim();
        if (!phone) { valid = false; message = 'Phone number is required'; }
        else if (!/^\d{10,}$/.test(phone.replace(/\D/g, ''))) { valid = false; message = 'Please enter a valid phone number'; }
    } else if (id === 'facebook') {
        if (!element.value.trim()) { valid = false; message = 'Facebook account name is required'; }
    } else if (id === 'pickupDate') {
        if (!element.value) { valid = false; message = 'Please select a pickup/delivery date'; }
    } else if (id === 'quantityValue') {
        const q = parseInt(element.value) || 0;
        if (q < 1) { valid = false; message = 'Please select a valid quantity'; }
    }

    const formGroup = element.parentElement;
    if (valid) {
        clearError(element);
        if (formGroup) {
            formGroup.classList.remove('invalid');
            formGroup.classList.add('valid');
        }
    } else {
        showError(element, message);
        if (formGroup) {
            formGroup.classList.add('invalid');
            formGroup.classList.remove('valid');
        }
    }

    return valid;
}

function validateForm() {
    const fullName = document.getElementById('fullName');
    const phoneNumber = document.getElementById('phoneNumber');
    const facebook = document.getElementById('facebook');
    const pickupDate = document.getElementById('pickupDate');
    const quantityValue = document.getElementById('quantityValue');

    let isValid = true;

    if (!validateFieldRealTime(fullName)) isValid = false;
    if (!validateFieldRealTime(phoneNumber)) isValid = false;
    if (!validateFieldRealTime(facebook)) isValid = false;
    if (!validateFieldRealTime(pickupDate)) isValid = false;
    if (!validateFieldRealTime(quantityValue)) isValid = false;

    return isValid;
}

function showError(element, message) {
    const errorMsg = element.parentElement.querySelector('.error-msg');
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.classList.add('show');
    }
}

function clearError(element) {
    const errorMsg = element.parentElement.querySelector('.error-msg');
    if (errorMsg) {
        errorMsg.classList.remove('show');
    }
}
// Success Modal Functions
function showSuccessModal() {
    const modal = document.getElementById('successModal');
    const closeBtn = document.getElementById('closeModalBtn');
    
    if (modal) {
        modal.classList.add('show');
        
        // Close modal when clicking the button (listen once to avoid duplicates)
        if (closeBtn) {
            closeBtn.addEventListener('click', closeSuccessModal, { once: true });
        }
        
        // Close modal when clicking outside (listen once)
        modal.addEventListener('click', function onClickOutside(e) {
            if (e.target === modal) {
                closeSuccessModal();
            }
        }, { once: true });
    }
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// 4. Review Form Handler
function initReviewForm() {
    const reviewForm = document.getElementById('reviewForm');
    if (!reviewForm) return;

    // Initialize star ratings
    const productRatingStars = document.querySelectorAll('#productRating i');
    const serviceRatingStars = document.querySelectorAll('#serviceRating i');
    const productRatingValue = document.getElementById('productRatingValue');
    const serviceRatingValue = document.getElementById('serviceRatingValue');

    // Product rating interaction
    productRatingStars.forEach(star => {
        star.addEventListener('click', () => {
            const value = star.getAttribute('data-value');
            productRatingValue.value = value;
            updateStarDisplay(productRatingStars, value);
        });
        star.addEventListener('mouseover', () => {
            const value = star.getAttribute('data-value');
            updateStarDisplay(productRatingStars, value);
        });
    });

    document.getElementById('productRating').addEventListener('mouseleave', () => {
        const value = productRatingValue.value || 0;
        updateStarDisplay(productRatingStars, value);
    });

    // Service rating interaction
    serviceRatingStars.forEach(star => {
        star.addEventListener('click', () => {
            const value = star.getAttribute('data-value');
            serviceRatingValue.value = value;
            updateStarDisplay(serviceRatingStars, value);
        });
        star.addEventListener('mouseover', () => {
            const value = star.getAttribute('data-value');
            updateStarDisplay(serviceRatingStars, value);
        });
    });

    document.getElementById('serviceRating').addEventListener('mouseleave', () => {
        const value = serviceRatingValue.value || 0;
        updateStarDisplay(serviceRatingStars, value);
    });

    // Form submission
    reviewForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (validateReviewForm()) {
            const name = document.getElementById('reviewName').value.trim();
            const email = document.getElementById('reviewEmail').value.trim();
            const productRating = parseInt(productRatingValue.value);
            const serviceRating = parseInt(serviceRatingValue.value);
            const comment = document.getElementById('reviewComment').value.trim();

            // Create review object
            const review = {
                id: Date.now(),
                name: name,
                email: email,
                productRating: productRating,
                serviceRating: serviceRating,
                comment: comment,
                date: new Date().toLocaleDateString()
            };

            // Try saving to API, fallback to localStorage
            const saved = await saveReviewToAPI(review);
            if (!saved) {
                reviews.unshift(review);
                saveReviewsToStorage();
            }

            // Display the review
            displayReviews();

            // Reset form
            reviewForm.reset();
            productRatingValue.value = 0;
            serviceRatingValue.value = 0;
            updateStarDisplay(productRatingStars, 0);
            updateStarDisplay(serviceRatingStars, 0);

            // Show success message
            alert('Thank you for your review!');
        }
    });

    // Add real-time validation
    const nameInput = document.getElementById('reviewName');
    const emailInput = document.getElementById('reviewEmail');
    const commentInput = document.getElementById('reviewComment');

    [nameInput, emailInput, commentInput].forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                validateReviewFieldRealTime(input);
            });
            input.addEventListener('change', () => {
                validateReviewFieldRealTime(input);
            });
        }
    });

    // Display initial reviews (empty state)
    displayReviews();
}

function updateStarDisplay(stars, value) {
    stars.forEach(star => {
        const starValue = star.getAttribute('data-value');
        if (starValue <= value) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function validateReviewForm() {
    const name = document.getElementById('reviewName');
    const email = document.getElementById('reviewEmail');
    const productRating = document.getElementById('productRatingValue');
    const serviceRating = document.getElementById('serviceRatingValue');
    const comment = document.getElementById('reviewComment');

    let isValid = true;

    if (!validateReviewFieldRealTime(name)) isValid = false;
    if (!validateReviewFieldRealTime(email)) isValid = false;
    if (!validateReviewFieldRealTime(comment)) isValid = false;

    if (parseInt(productRating.value) === 0) {
        showReviewError(productRating, 'Please rate the product');
        isValid = false;
    } else {
        clearReviewError(productRating);
    }

    if (parseInt(serviceRating.value) === 0) {
        showReviewError(serviceRating, 'Please rate our service');
        isValid = false;
    } else {
        clearReviewError(serviceRating);
    }

    return isValid;
}

function validateReviewFieldRealTime(element) {
    if (!element) return false;
    const id = element.id;
    let valid = true;
    let message = '';

    if (id === 'reviewName') {
        if (!element.value.trim()) { valid = false; message = 'Name is required'; }
    } else if (id === 'reviewEmail') {
        const email = element.value.trim();
        if (!email) { valid = false; message = 'Email is required'; }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { valid = false; message = 'Please enter a valid email'; }
    } else if (id === 'reviewComment') {
        if (!element.value.trim()) { valid = false; message = 'Comment is required'; }
        else if (element.value.trim().length < 10) { valid = false; message = 'Comment must be at least 10 characters'; }
    }

    const formGroup = element.parentElement;
    if (valid) {
        clearReviewError(element);
        if (formGroup) {
            formGroup.classList.remove('invalid');
            formGroup.classList.add('valid');
        }
    } else {
        showReviewError(element, message);
        if (formGroup) {
            formGroup.classList.add('invalid');
            formGroup.classList.remove('valid');
        }
    }

    return valid;
}

function showReviewError(element, message) {
    const errorMsg = element.parentElement.querySelector('.error-msg');
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.classList.add('show');
    }
}

function clearReviewError(element) {
    const errorMsg = element.parentElement.querySelector('.error-msg');
    if (errorMsg) {
        errorMsg.classList.remove('show');
    }
}

function displayReviews() {
    const reviewsList = document.getElementById('reviewsList');
    if (!reviewsList) return;

    if (reviews.length === 0) {
        reviewsList.innerHTML = '<div class="no-reviews"><p>No reviews yet. Be the first to share your experience!</p></div>';
        return;
    }

    reviewsList.innerHTML = reviews.map(review => {
        const safeName = escapeHTML(review.name);
        const safeComment = escapeHTML(review.comment);

        const productStars = Array(5).fill(0).map((_, i) => {
            return `<i class="${i < review.productRating ? 'fas fa-star' : 'far fa-star'}"></i>`;
        }).join('');

        const serviceStars = Array(5).fill(0).map((_, i) => {
            return `<i class="${i < review.serviceRating ? 'fas fa-star' : 'far fa-star'}"></i>`;
        }).join('');

        return `
        <div class="review-item">
            <div class="review-header">
                <span class="review-name">${safeName}</span>
            </div>
            <div>
                <span class="review-label">Product Rating:</span>
                <div class="review-rating-display">
                    <div class="review-rating">
                        ${productStars}
                    </div>
                    <span class="rating-value">${review.productRating}/5</span>
                </div>
            </div>
            <div>
                <span class="review-label">Service Rating:</span>
                <div class="review-rating-display">
                    <div class="review-rating">
                        ${serviceStars}
                    </div>
                    <span class="rating-value">${review.serviceRating}/5</span>
                </div>
            </div>
            <p class="review-comment">"${safeComment}"</p>
            <p class="review-date">${review.date}</p>
        </div>
    `;
    }).join('');
}
