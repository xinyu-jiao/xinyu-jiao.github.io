// Meridian Ribbon - JavaScript

// Mobile Navigation Toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        
        // Animate hamburger icon
        const spans = navToggle.querySelectorAll('span');
        if (navMenu.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
}

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (navMenu) {
            navMenu.classList.remove('active');
            const spans = navToggle?.querySelectorAll('span');
            if (spans) {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        }
    });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Navbar background on scroll
const navbar = document.getElementById('navbar');
let lastScroll = 0;

if (navbar) {
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.style.backgroundColor = 'rgba(246, 237, 225, 0.98)';
            navbar.style.boxShadow = '0 4px 16px rgba(51, 43, 36, 0.12)';
        } else {
            navbar.style.backgroundColor = 'rgba(246, 237, 225, 0.95)';
            navbar.style.boxShadow = '0 2px 8px rgba(51, 43, 36, 0.08)';
        }
        
        lastScroll = currentScroll;
    });
}

// Active navigation link highlighting
const sections = document.querySelectorAll('.section, .hero');
const navLinksArray = Array.from(navLinks);

window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinksArray.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.mode-card, .precedent-card, .audience-card, .bib-item');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Hide image placeholders when images are loaded
const imagePlaceholders = document.querySelectorAll('.image-placeholder, .image-placeholder-small');
const images = document.querySelectorAll('img');

images.forEach(img => {
    img.addEventListener('load', () => {
        const placeholder = img.parentElement?.querySelector('.image-placeholder, .image-placeholder-small');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
    });
    
    img.addEventListener('error', () => {
        // Keep placeholder visible if image fails to load
        const placeholder = img.parentElement?.querySelector('.image-placeholder, .image-placeholder-small');
        if (placeholder) {
            placeholder.style.display = 'flex';
        }
    });
});

// Check if hero image exists
const heroImg = document.getElementById('heroImg');
const imagePlaceholder = document.getElementById('imagePlaceholder');

if (heroImg) {
    heroImg.addEventListener('error', () => {
        if (imagePlaceholder) {
            imagePlaceholder.style.display = 'flex';
        }
    });
    
    // Try to load the image
    if (heroImg.src && heroImg.complete && heroImg.naturalHeight !== 0) {
        if (imagePlaceholder) {
            imagePlaceholder.style.display = 'none';
        }
    }
}

// Keyboard navigation enhancement
document.addEventListener('keydown', (e) => {
    // ESC key closes mobile menu
    if (e.key === 'Escape' && navMenu && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        const spans = navToggle?.querySelectorAll('span');
        if (spans) {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    }
});

// Add active state to navigation links
const updateActiveNav = () => {
    const scrollPos = window.scrollY + 100;
    
    navLinksArray.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            const section = document.querySelector(href);
            if (section) {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                
                if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                    navLinksArray.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            }
        }
    });
};

window.addEventListener('scroll', updateActiveNav);
window.addEventListener('load', updateActiveNav);

// Smooth reveal animation for sections
const revealSections = document.querySelectorAll('.section');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
        }
    });
}, {
    threshold: 0.15
});

revealSections.forEach(section => {
    revealObserver.observe(section);
});

// Console message
console.log('%c Meridian Ribbon ', 'background: #F48A6A; color: #F6EDE1; font-size: 20px; font-weight: bold; padding: 10px;');
console.log('%c A Sound-to-Touch Wearable Interface ', 'color: #F48A6A; font-size: 14px;');
console.log('%c Capstone Project 2024 ', 'color: #7D6E5F; font-size: 12px;');
