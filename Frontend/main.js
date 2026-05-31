/* ============================================================
   BASILICA BIOTECH - Main JavaScript
   Sections:
   1. Mobile Navigation Toggle
   2. Sticky Header Shadow on Scroll
   3. Animated Stats Counter (on scroll into view)
   4. Quote Form Submit Feedback
   ============================================================ */

/* =========================
   PRELOADER HIDE AFTER LOAD
========================= */
window.addEventListener("load", function () {
    const preloader = document.getElementById("preloader");

    setTimeout(() => {
        preloader.style.opacity = "0";
        preloader.style.visibility = "hidden";
    }, 500); // thoda smooth delay
});

/* ============================================================
   1. Mobile Navigation Toggle & Dropdown Logic
   ============================================================ */

// Mobile menu open/close toggle
function toggleMenu() {
    const mobileNav = document.getElementById('mobileNav');
    const isOpen = mobileNav.classList.toggle('open');
    document.body.style.overflow = isOpen ? 'hidden' : '';
}

// Dropdown toggle logic (Open/Close on click)
function toggleDropdown(event) {
    // 1. Anchor tag ka default behavior roko (taaki page upar na bhage)
    event.preventDefault();
    event.stopPropagation();

    // 2. Clicked element ke parent 'li' ko pakdo
    const parentLi = event.currentTarget.closest('.dropdown');

    // 3. Agar pehle se koi dusra dropdown open hai toh use band karo (Optional)
    /*
    document.querySelectorAll('.dropdown').forEach(item => {
        if(item !== parentLi) item.classList.remove('active');
    });
    */

    // 4. Active class toggle karo (Isse open aur close dono hoga)
    parentLi.classList.toggle('active');
}

// Kisi bhi link par click karne par menu poora band ho jaye
function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    mobileNav.classList.remove('open');
    document.body.style.overflow = '';
}

// Window resize hone par agar desktop screen aaye toh menu khud band ho jaye
window.addEventListener('resize', function () {
    if (window.innerWidth > 991) {
        const mobileNav = document.getElementById('mobileNav');
        if (mobileNav.classList.contains('open')) {
            toggleMenu();
        }
    }
});

function toggleDropdown(e) {

    // sirf mobile me kaam kare
    if (window.innerWidth > 991) return;

    e.preventDefault();
    e.stopPropagation();

    const parent = e.target.closest('.dropdown');

    // close others
    document.querySelectorAll('.dropdown').forEach(item => {
        if (item !== parent) {
            item.classList.remove('active');
        }
    });

    parent.classList.toggle('active');
}

/* ============================================================
   2. Sticky Header Shadow on Scroll
   ============================================================ */

window.addEventListener('scroll', function () {
    const header = document.querySelector('header');

    if (window.scrollY > 10) {
        header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.07)';
    }
});


/* ============================================================
   3. Animated Stats Counter (triggers when section scrolls into view)
   ============================================================ */

const statNumbers = document.querySelectorAll('.stat-num');
let hasCountedStats = false;

const statsObserver = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting && !hasCountedStats) {
        hasCountedStats = true;

        statNumbers.forEach(function (el) {
            const target = parseInt(el.textContent);
            let current = 0;
            const increment = Math.ceil(target / 40);

            const timer = setInterval(function () {
                current = Math.min(current + increment, target);
                el.textContent = current + '';

                if (current >= target) {
                    clearInterval(timer);
                }
            }, 30);
        });
    }
}, { threshold: 0.5 });

// Only observe if stats section exists on the page
const statsSection = document.querySelector('.stats');
if (statsSection) {
    statsObserver.observe(statsSection);
}

/* ============================================================
   4. Quote Form Submit Feedback
   ============================================================ */

const submitBtn = document.querySelector('.btn-submit');

if (submitBtn) {
    submitBtn.addEventListener('click', function () {
        // Show success state
        this.textContent = '✓ Submitted!';
        this.style.background = '#22a055';

        // Reset button after 2.5 seconds
        setTimeout(() => {
            this.textContent = 'SUBMIT NOW →';
            this.style.background = '';
        }, 2500);
    });
}

function openForm() {
    document.getElementById("quoteModal").classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeForm() {
    document.getElementById("quoteModal").classList.remove("active");
    document.body.style.overflow = "";
}

function sendWhatsApp() {
    let name = document.getElementById("name").value;
    let phone = document.getElementById("phone").value;
    let email = document.getElementById("email").value;
    let requirement = document.getElementById("requirement").value;

    if (!name || !phone || !email || !requirement) {
        alert("Please fill all fields");
        return;
    }

    let message = `Hello, I want a quote:%0A
    Name: ${name}%0A
    Phone: ${phone}%0A
    Email: ${email}%0A
    Requirement: ${requirement}`;

    let url = "https://wa.me/919104525207?text=" + message;

    window.open(url, "_blank");

    // auto close + reset
    closeForm();

    document.getElementById("name").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("email").value = "";
    document.getElementById("requirement").value = "";
}

/* click outside close */
document.getElementById("quoteModal").addEventListener("click", function (e) {
    if (e.target === this) {
        closeForm();
    }
});

function sendToWhatsApp(e) {
    e.preventDefault();

    const name = document.getElementById("fullname").value.trim();
    const phone = document.getElementById("telephone").value.trim();
    const email = document.getElementById("gmail").value.trim();
    const req = document.getElementById("req").value.trim();

    // ✅ Only Name + Phone required
    if (!name || !phone) {
        alert("Please fill Name and Mobile Number");
        return;
    }

    // ✅ Message (clean format)
    const message =
        `Hello, I want a quote:

    Name: ${name}
    Mobile: ${phone}
    Email: ${email}
    Requirement: ${req}`;

    // ✅ WhatsApp open with message
    const url = `https://wa.me/919104525207?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");

    // ✅ Form reset (optional)
    document.querySelector(".quote-form").reset();
}

document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => {
        document.querySelectorAll(".card").forEach(c => c.classList.remove("active"));
        card.classList.add("active");
    });
});

document.addEventListener("DOMContentLoaded", function () {

    let currentSlide = 0;
    const slides = document.querySelectorAll('.pl-image .slide');

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        slides[index].classList.add('active');
    }

    window.nextSlide = function () {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    window.prevSlide = function () {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
    }

    // Auto slide
    setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }, 3000);

});

/**
 * main.js — Janki Herbals · Core Values Section
 * Responsibilities:
 *   1. Scroll-triggered fade-up animation (IntersectionObserver)
 *   2. Card hover ripple effect
 *   3. Active card highlight on click (accessibility)
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════
   1. SCROLL FADE-UP  (IntersectionObserver)
═══════════════════════════════════════════════════════════════ */
const fadeTargets = document.querySelectorAll('.fade-up');

const fadeObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                fadeObserver.unobserve(entry.target);   // fire only once
            }
        });
    },
    {
        threshold: 0.14,
        rootMargin: '0px 0px -40px 0px'
    }
);

fadeTargets.forEach(el => fadeObserver.observe(el));

/* ═══════════════════════════════════════════════════════════════
   2. CARD RIPPLE ON CLICK
═══════════════════════════════════════════════════════════════ */
function createRipple(e) {
    const card = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = card.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.6;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.cssText = `
    position: absolute;
    width:  ${size}px;
    height: ${size}px;
    left:   ${x}px;
    top:    ${y}px;
    border-radius: 50%;
    background: rgba(108, 92, 231, 0.14);
    transform: scale(0);
    animation: rippleAnim 0.55s ease-out forwards;
    pointer-events: none;
    z-index: 10;
  `;

    card.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
}

/* Inject ripple keyframes once */
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
  @keyframes rippleAnim {
    to { transform: scale(1); opacity: 0; }
  }
`;
document.head.appendChild(rippleStyle);

/* Attach to all non-highlighted cards */
document.querySelectorAll('.cv-card:not(.cv-card--excellence)').forEach(card => {
    card.style.overflow = 'hidden';
    card.addEventListener('click', createRipple);
});

/* ═══════════════════════════════════════════════════════════════
   3. KEYBOARD ACCESSIBILITY — focus-visible outline
═══════════════════════════════════════════════════════════════ */
document.querySelectorAll('.cv-card').forEach(card => {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'article');

    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.click();
        }
    });
});

/* ═══════════════════════════════════════════════════════════════
   4. INIT — trigger observer on already-visible elements
      (handles case where section is above the fold on load)
═══════════════════════════════════════════════════════════════ */
(function init() {
    // Small delay so CSS transitions are registered first
    requestAnimationFrame(() => {
        fadeTargets.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
                el.classList.add('in-view');
                fadeObserver.unobserve(el);
            }
        });
    });
})();