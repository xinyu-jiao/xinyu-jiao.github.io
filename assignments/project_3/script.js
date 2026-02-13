const sheetUrl = "https://docs.google.com/spreadsheets/d/1fScqoxB2QOcyERKRSiCPkEdHGrAwxR6X5MK9N3Vs7Nk/gviz/tq?tqx=out:json&gid=1251391253";

const collectionEl = document.getElementById("collection");
const viewToggleBtn = document.getElementById("view-toggle");
const filterContainerEl = document.getElementById("filter-container");

let allItems = [];
let filteredItems = [];
let isSorted = true; // Default to Spectrum view
let currentFilter = "All";
let currentView = "grid";
let currentViewerIndex = -1;
let favorites = JSON.parse(localStorage.getItem('colorCatalogFavorites') || '[]');
let showFavoritesOnly = false;

// Parse color_family field (format: "order|family|hex")
function parseColorFamily(colorFamily) {
    if (!colorFamily) return { order: 999, family: "unknown", hex: "#cccccc" };
    
    const parts = colorFamily.split("|");
    if (parts.length >= 3) {
        return {
            order: parseInt(parts[0]) || 999,
            family: parts[1] || "unknown",
            hex: parts[2] || "#cccccc"
        };
    }
    return { order: 999, family: "unknown", hex: "#cccccc" };
}

// Fetch data from Google Sheets
fetch(sheetUrl)
    .then((res) => res.text())
    .then((text) => {
        const jsonText = text
            .replace(/^[\s\S]*?setResponse\(/, "")
            .replace(/\);\s*$/, "");

        const data = JSON.parse(jsonText);
        const rows = data.table.rows || [];

        allItems = rows.slice(1).map((row) => {
            const cells = row.c || [];
            const colorInfo = parseColorFamily(cells[3]?.v || "");
            return {
                title: cells[0]?.v || "",
                image: cells[1]?.v || "",
                tag: cells[2]?.v || "",
                color_family: cells[3]?.v || "",
                colorOrder: colorInfo.order,
                colorHex: colorInfo.hex,
                colorFamily: colorInfo.family,
                anno: cells[4]?.v || "",
            };
        }).filter(item => item.image);

        // Generate filter buttons
        generateFilters();
        
        // Initialize filtered items and sort by color (Spectrum view by default)
        filteredItems = [...allItems].sort((a, b) => {
            return a.colorOrder - b.colorOrder;
        });
        
        // Set initial button text and class
        viewToggleBtn.textContent = "Grid · Original";
        collectionEl.classList.add("spectrum-view");
        collectionEl.classList.add("is-spectrum");
        
        // Hide loading skeleton
        const skeleton = document.getElementById("loading-skeleton");
        if (skeleton) skeleton.classList.add("hidden");
        
        updateFavoritesCount();
        updateStats();
        renderItemsSync(filteredItems);
    })
    .catch((err) => {
        collectionEl.innerHTML = '<div style="text-align: center; padding: 60px 20px; color: var(--muted);"><p style="font-size: 14px; margin-bottom: 8px;">Failed to load catalog data.</p><p style="font-size: 12px; opacity: 0.7;">Please check your connection and try refreshing the page.</p></div>';
    });

// Generate filter buttons based on unique tags
function generateFilters() {
    const tags = ["All", ...new Set(allItems.map(item => item.tag).filter(Boolean))];
    
    tags.forEach(tag => {
        const btn = document.createElement("button");
        btn.className = "filter-btn";
        btn.textContent = tag;
        btn.setAttribute("data-color-filter", tag.toLowerCase().replace(/\s+/g, ""));
        if (tag === "All") {
            btn.classList.add("is-active");
        }
        btn.addEventListener("click", () => filterByTag(tag));
        filterContainerEl.appendChild(btn);
    });
}

// Filter by tag
function filterByTag(tag) {
    currentFilter = tag;
    
    // Update active button
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.toggle("is-active", btn.textContent === tag);
    });
    
    applyFilters();
}

// Apply filters
function applyFilters() {
    let items = [...allItems];

    // Filter by tag first
    if (currentFilter !== "All") {
        items = items.filter(item => item.tag === currentFilter);
    }

    // Filter by favorites if enabled
    if (showFavoritesOnly) {
        items = items.filter((item) => {
            const itemId = `${item.image}-${item.title}`;
            return favorites.includes(itemId);
        });
    }

    filteredItems = items;
    
    // Apply sorting if active
    if (isSorted) {
        filteredItems = [...filteredItems].sort((a, b) => {
            return a.colorOrder - b.colorOrder;
        });
    }
    
    renderItemsSync(filteredItems);
    updateStats();
}

// View toggle functionality
viewToggleBtn.addEventListener("click", () => {
    isSorted = !isSorted;
    
    if (isSorted) {
        // Sort by color order (Spectrum view)
        filteredItems = [...filteredItems].sort((a, b) => {
            return a.colorOrder - b.colorOrder;
        });
        viewToggleBtn.textContent = "Grid · Original";
        collectionEl.classList.add("spectrum-view");
        collectionEl.classList.add("is-spectrum");
        renderItemsWithAnimation(filteredItems);
        updateStats();
    } else {
        // Restore filtered order
        applyFilters();
        viewToggleBtn.textContent = "Grid · Spectrum";
        collectionEl.classList.remove("spectrum-view");
        collectionEl.classList.remove("is-spectrum");
        updateStats();
    }
});

// Favorites toggle functionality
const favoritesToggle = document.getElementById("favorites-toggle");
if (favoritesToggle) {
    favoritesToggle.addEventListener("click", () => {
        showFavoritesOnly = !showFavoritesOnly;
        favoritesToggle.classList.toggle("active", showFavoritesOnly);
        applyFilters();
    });
}

// Update favorites count
function updateFavoritesCount() {
    const countEl = document.getElementById("favorites-count");
    if (countEl) {
        countEl.textContent = favorites.length;
    }
}

// Update statistics
function updateStats() {
    const totalCountEl = document.getElementById("total-count");
    if (totalCountEl) {
        totalCountEl.textContent = allItems.length;
    }
}

// Render items with animation
function renderItemsWithAnimation(items) {
    collectionEl.classList.add("sorting");
    
    const cards = collectionEl.querySelectorAll(".item-card");
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = "0";
            card.style.transform = "translateY(10px)";
        }, index * 5);
    });

    setTimeout(() => {
        renderItemsSync(items);
        collectionEl.classList.remove("sorting");
        
        requestAnimationFrame(() => {
            const newCards = collectionEl.querySelectorAll(".item-card");
            newCards.forEach((card, index) => {
                card.style.opacity = "0";
                card.style.transform = "translateY(10px)";
                setTimeout(() => {
                    card.style.opacity = "1";
                    card.style.transform = "translateY(0)";
                }, index * 10);
            });
        });
    }, 300);
}

// Render items with performance optimization
function renderItems(items) {
    // Use requestAnimationFrame for smooth rendering
    requestAnimationFrame(() => {
        renderItemsSync(items);
    });
}

function renderItemsSync(items) {
    if (!items.length) {
        let message = 'No items found.';
        if (showFavoritesOnly && favorites.length === 0) {
            message = 'You haven\'t favorited any items yet. Click the ♥ button on any card to add it to your favorites.';
        } else if (showFavoritesOnly) {
            message = 'No items match the current filter and favorites.';
        } else if (currentFilter !== "All") {
            message = `No items found in "${currentFilter}".`;
        }
        collectionEl.innerHTML = `<div style="text-align: center; padding: 60px 20px; color: var(--muted);"><p style="font-size: 14px;">${message}</p></div>`;
        return;
    }

    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Add is-spectrum class if in spectrum view
    if (isSorted) {
        collectionEl.classList.add("is-spectrum");
    } else {
        collectionEl.classList.remove("is-spectrum");
    }
    
    items.forEach((item, index) => {
        const card = document.createElement("article");
        card.classList.add("item-card");
        card.style.borderColor = item.colorHex || "#ddd";
        card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        
        // Set data-index for spectrum animation
        if (isSorted) {
            card.dataset.index = index;
            card.style.animationDelay = (index * 40) + "ms";
        }

        // Set card color variable for glow effect
        card.style.setProperty("--card-color", item.colorHex || "#f0574f");

        // Set card index for wave animation
        card.style.setProperty("--card-index", index);

        // Add data attributes for navigation and favorites
        const itemId = `${item.image}-${item.title}`;
        card.dataset.index = index;
        card.dataset.itemId = itemId;

        // Add favorite button
        const favoriteBtn = document.createElement("button");
        favoriteBtn.className = "favorite-btn";
        favoriteBtn.setAttribute("aria-label", favorites.includes(itemId) ? "Remove from favorites" : "Add to favorites");
        favoriteBtn.setAttribute("data-item-id", itemId);
        if (favorites.includes(itemId)) {
            favoriteBtn.classList.add("active");
        }
        favoriteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleFavorite(itemId, favoriteBtn);
        });
        card.appendChild(favoriteBtn);

        // Add click handler for single/double click
        let clickTimer = null;
        card.addEventListener("click", (e) => {
            // Don't trigger on favorite button click
            if (e.target.classList.contains("favorite-btn")) return;
            
            if (clickTimer === null) {
                clickTimer = setTimeout(() => {
                    // Single click - change theme color
            const mainColor = item.colorHex || "#f0574f";
            document.documentElement.style.setProperty("--accent-color", mainColor);
                    
            // Update accent-soft with new color for background gradient
            const rgb = hexToRgb(mainColor);
            if (rgb) {
                document.documentElement.style.setProperty(
                    "--accent-soft", 
                    `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`
                );
                document.documentElement.style.setProperty(
                    "--accent-color-soft", 
                    `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.16)`
                );
                        
                    // Update background colors based on clicked card
                    updateBackgroundColors(mainColor, rgb);
                    
                    // Create particle explosion at click position
                    const rect = card.getBoundingClientRect();
                    const clickX = rect.left + rect.width / 2;
                    const clickY = rect.top + rect.height / 2;
                    createParticles(clickX, clickY, mainColor);
                }
                clickTimer = null;
                }, 250);
            } else {
                clearTimeout(clickTimer);
                clickTimer = null;
                // Double click - open fullscreen
                openFullscreen(item, index);
            }
        });

        const figure = document.createElement("figure");
        
        const img = document.createElement("img");
        img.src = item.image;
        img.alt = item.title || `Image ${index + 1}`;
        img.loading = "lazy";
        img.decoding = "async";
        img.fetchPriority = index < 6 ? "high" : "low";
        
        // Progressive image loading with blur-up effect
        img.style.opacity = "0";
        img.style.transition = "opacity 0.4s ease";
        img.onload = function() {
            this.style.opacity = "1";
        };

        figure.appendChild(img);

        // Color chip
        const colorChip = document.createElement("span");
        colorChip.className = "color-chip";
        colorChip.style.backgroundColor = item.colorHex || "#ddd";

        card.appendChild(figure);
        card.appendChild(colorChip);

        fragment.appendChild(card);
    });

    collectionEl.innerHTML = "";
    collectionEl.appendChild(fragment);
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}


// Scroll-driven card wave enhancement
(function initScrollWave() {
    let lastScrollY = 0;
    let scrollDirection = 0;
    
    function updateCardWaves() {
        const scrollY = window.scrollY;
        scrollDirection = scrollY > lastScrollY ? 1 : -1;
        lastScrollY = scrollY;
        
        const cards = document.querySelectorAll('.item-card');
        cards.forEach((card, index) => {
            const rect = card.getBoundingClientRect();
            const viewportCenter = window.innerHeight / 2;
            const cardCenter = rect.top + rect.height / 2;
            const distanceFromCenter = Math.abs(cardCenter - viewportCenter);
            const maxDistance = window.innerHeight;
            const intensity = 1 - (distanceFromCenter / maxDistance);
            
            // Add extra wave effect based on scroll position
            const waveOffset = Math.sin((scrollY + index * 50) * 0.01) * intensity * 8;
            const rotation = Math.sin((scrollY + index * 30) * 0.008) * intensity * 3;
            
            if (intensity > 0.05) {
                // Combine with base transform
                const baseY = Math.sin((Date.now() * 0.001 + index * 0.1) % (Math.PI * 2)) * 3;
                card.style.transform = `translateY(${baseY + waveOffset}px) rotateZ(${rotation}deg) scale(${1 + intensity * 0.03})`;
            } else {
                // Reset to base animation when far from viewport
                card.style.transform = '';
            }
        });
        
        requestAnimationFrame(updateCardWaves);
    }
    
    updateCardWaves();
})();

// Function to generate color variations from base color
function generateColorPalette(baseHex, baseRgb) {
    // Generate 7 color variations for the conic gradient
    const colors = [];
    
    // Main color (center)
    colors.push(`rgba(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}, 0.2)`);
    
    // Generate variations by shifting hue
    for (let i = 1; i < 7; i++) {
        const hueShift = (i * 60) % 360; // 60 degree increments
        const shiftedRgb = shiftHue(baseRgb, hueShift);
        colors.push(`rgba(${shiftedRgb.r}, ${shiftedRgb.g}, ${shiftedRgb.b}, 0.15)`);
    }
    
    return colors;
}

// Convert RGB to HSL, shift hue, convert back
function shiftHue(rgb, degrees) {
    let r = rgb.r / 255;
    let g = rgb.g / 255;
    let b = rgb.b / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    
    h = (h * 360 + degrees) % 360 / 360;
    
    // Convert back to RGB
    let c = (1 - Math.abs(2 * l - 1)) * s;
    let x = c * (1 - Math.abs((h * 6) % 2 - 1));
    let m = l - c / 2;
    
    let r2, g2, b2;
    if (h < 1/6) { r2 = c; g2 = x; b2 = 0; }
    else if (h < 2/6) { r2 = x; g2 = c; b2 = 0; }
    else if (h < 3/6) { r2 = 0; g2 = c; b2 = x; }
    else if (h < 4/6) { r2 = 0; g2 = x; b2 = c; }
    else if (h < 5/6) { r2 = x; g2 = 0; b2 = c; }
    else { r2 = c; g2 = 0; b2 = x; }
    
    return {
        r: Math.round((r2 + m) * 255),
        g: Math.round((g2 + m) * 255),
        b: Math.round((b2 + m) * 255)
    };
}

// Update background colors based on clicked card
function updateBackgroundColors(mainColor, rgb) {
    const palette = generateColorPalette(mainColor, rgb);
    
    // Update conic gradient colors
    for (let i = 0; i < 7; i++) {
        document.documentElement.style.setProperty(`--bg-color-${i + 1}`, palette[i]);
    }
    
    // Update radial gradient lights (use variations of main color)
    const light1 = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
    const light2Rgb = shiftHue(rgb, 120);
    const light2 = `rgba(${light2Rgb.r}, ${light2Rgb.g}, ${light2Rgb.b}, 0.25)`;
    const light3Rgb = shiftHue(rgb, 240);
    const light3 = `rgba(${light3Rgb.r}, ${light3Rgb.g}, ${light3Rgb.b}, 0.2)`;
    
    document.documentElement.style.setProperty('--bg-light-1', light1);
    document.documentElement.style.setProperty('--bg-light-2', light2);
    document.documentElement.style.setProperty('--bg-light-3', light3);
}

// Dynamic background movement based on scroll and mouse
(function initBackgroundLights() {
    const body = document.body;
    let scrollY = 0;
    let mouseX = 0;
    let mouseY = 0;
    
    // Track mouse position
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 100;
        mouseY = (e.clientY / window.innerHeight) * 100;
    }, { passive: true });
    
    function updateBackground() {
        scrollY = window.scrollY;
        
        // Create flowing effect with scroll and mouse interaction
        const time = Date.now() * 0.0005;
        const scrollFactor = scrollY * 0.01;
        
        // Three gradient positions that flow across the screen
        const x1 = 30 + Math.sin(time + scrollFactor) * 20 + (mouseX - 50) * 0.1;
        const y1 = 40 + Math.cos(time * 0.8 + scrollFactor) * 15 + (mouseY - 50) * 0.1;
        
        const x2 = 70 + Math.cos(time * 1.2 - scrollFactor) * 25 + (mouseX - 50) * 0.08;
        const y2 = 60 + Math.sin(time * 0.9 - scrollFactor) * 20 + (mouseY - 50) * 0.08;
        
        const x3 = 50 + Math.sin(time * 0.7 + scrollFactor * 1.5) * 15 + (mouseX - 50) * 0.12;
        const y3 = 20 + Math.cos(time * 1.1 + scrollFactor) * 18 + (mouseY - 50) * 0.12;
        
        body.style.setProperty('--bg-x1', `${Math.max(0, Math.min(100, x1))}%`);
        body.style.setProperty('--bg-y1', `${Math.max(0, Math.min(100, y1))}%`);
        body.style.setProperty('--bg-x2', `${Math.max(0, Math.min(100, x2))}%`);
        body.style.setProperty('--bg-y2', `${Math.max(0, Math.min(100, y2))}%`);
        body.style.setProperty('--bg-x3', `${Math.max(0, Math.min(100, x3))}%`);
        body.style.setProperty('--bg-y3', `${Math.max(0, Math.min(100, y3))}%`);
        
        requestAnimationFrame(updateBackground);
    }
    
    updateBackground();
})();

// Initialize background with default color on page load
(function initBackgroundColor() {
    // Set default color (first card's color or fallback)
    const defaultColor = "#f0574f";
    const defaultRgb = hexToRgb(defaultColor);
    if (defaultRgb) {
        updateBackgroundColors(defaultColor, defaultRgb);
    }
})();

// Fullscreen Viewer Functions
function openFullscreen(item, index) {
    const viewer = document.getElementById("fullscreen-viewer");
    const viewerImg = document.getElementById("viewer-image");
    const viewerInfo = document.getElementById("viewer-info");
    
    if (!viewer || !viewerImg) return;
    
    currentViewerIndex = index;
    viewerImg.src = item.image;
    viewerImg.alt = item.title || "Fullscreen view";
    viewerInfo.textContent = item.title || "";
    
    viewer.classList.add("active");
    viewer.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    
    updateViewerNav();
}

function closeFullscreen() {
    const viewer = document.getElementById("fullscreen-viewer");
    if (viewer) {
        viewer.classList.remove("active");
        viewer.setAttribute("aria-hidden", "true");
        document.body.classList.remove("no-scroll");
        currentViewerIndex = -1;
    }
}

function navigateViewer(direction) {
    if (currentViewerIndex === -1) return;
    
    const items = filteredItems.length > 0 ? filteredItems : allItems;
    if (items.length === 0) return;
    
    if (direction === 'next') {
        currentViewerIndex = (currentViewerIndex + 1) % items.length;
    } else {
        currentViewerIndex = (currentViewerIndex - 1 + items.length) % items.length;
    }
    
    const item = items[currentViewerIndex];
    openFullscreen(item, currentViewerIndex);
}

function updateViewerNav() {
    const prevBtn = document.getElementById("viewer-prev");
    const nextBtn = document.getElementById("viewer-next");
    const items = filteredItems.length > 0 ? filteredItems : allItems;
    
    if (prevBtn) prevBtn.style.display = items.length > 1 ? "flex" : "none";
    if (nextBtn) nextBtn.style.display = items.length > 1 ? "flex" : "none";
}

// Initialize viewer controls
(function initViewer() {
    const viewerClose = document.getElementById("viewer-close");
    const viewerPrev = document.getElementById("viewer-prev");
    const viewerNext = document.getElementById("viewer-next");
    const viewer = document.getElementById("fullscreen-viewer");
    
    if (viewerClose) {
        viewerClose.addEventListener("click", closeFullscreen);
    }
    if (viewerPrev) {
        viewerPrev.addEventListener("click", () => navigateViewer("prev"));
    }
    if (viewerNext) {
        viewerNext.addEventListener("click", () => navigateViewer("next"));
    }
    
    // Close on background click
    if (viewer) {
        viewer.addEventListener("click", (e) => {
            if (e.target === viewer) {
                closeFullscreen();
            }
        });
    }
    
    // Keyboard shortcuts system
    document.addEventListener("keydown", (e) => {
        // Don't trigger shortcuts when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        if (e.key === "Escape") {
            if (viewer && viewer.classList.contains("active")) {
                closeFullscreen();
            } else if (aboutOverlay && aboutOverlay.getAttribute("aria-hidden") === "false") {
                aboutOverlay.setAttribute("aria-hidden", "true");
                document.body.classList.remove("no-scroll");
            } else if (keyboardHint && keyboardHint.getAttribute("aria-hidden") === "false") {
                keyboardHint.setAttribute("aria-hidden", "true");
            }
        } else if (viewer && viewer.classList.contains("active")) {
            if (e.key === "ArrowLeft") {
                navigateViewer("prev");
            } else if (e.key === "ArrowRight") {
                navigateViewer("next");
            }
        } else if (e.key === "?") {
            // Show keyboard shortcuts
            e.preventDefault();
            const keyboardHint = document.getElementById("keyboard-hint");
            if (keyboardHint) {
                keyboardHint.setAttribute("aria-hidden", "false");
            }
        }
    });
    
    // Close keyboard hint on click
    const keyboardHint = document.getElementById("keyboard-hint");
    if (keyboardHint) {
        keyboardHint.addEventListener("click", (e) => {
            if (e.target === keyboardHint) {
                keyboardHint.setAttribute("aria-hidden", "true");
            }
        });
    }
})();
        
// Double-click hint
(function initDoubleClickHint() {
    const hint = document.getElementById("double-click-hint");
    const hintClose = document.getElementById("hint-close");
    
    if (!hint) return;
    
    // Check if user has seen the hint before
    const hasSeenHint = localStorage.getItem('colorCatalogSeenDoubleClickHint');
    
    // Show hint on page load if not seen before
    if (!hasSeenHint) {
        setTimeout(() => {
            hint.classList.add("visible");
        }, 2000); // Show after 2 seconds
    }
    
    // Close hint
    if (hintClose) {
        hintClose.addEventListener("click", () => {
            hint.classList.remove("visible");
            localStorage.setItem('colorCatalogSeenDoubleClickHint', 'true');
        });
    }
    
    // Hide hint after user double-clicks any card
    document.addEventListener("dblclick", (e) => {
        if (e.target.closest(".item-card")) {
            hint.classList.remove("visible");
            localStorage.setItem('colorCatalogSeenDoubleClickHint', 'true');
        }
    });
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
        if (hint.classList.contains("visible")) {
            hint.classList.remove("visible");
            localStorage.setItem('colorCatalogSeenDoubleClickHint', 'true');
        }
    }, 8000);
})();

// Favorite Functions
function toggleFavorite(itemId, btn) {
    const index = favorites.indexOf(itemId);
    const wasFavorite = index > -1;
    
    if (wasFavorite) {
        favorites.splice(index, 1);
        btn.classList.remove("active");
        btn.setAttribute("aria-label", "Add to favorites");
    } else {
        favorites.push(itemId);
        btn.classList.add("active");
        btn.setAttribute("aria-label", "Remove from favorites");
        // Create heart particles when adding to favorites
        createHeartParticles(btn);
    }
    localStorage.setItem('colorCatalogFavorites', JSON.stringify(favorites));
    updateFavoritesCount();
    
    // If showing favorites only, update the view
    if (showFavoritesOnly) {
        applyFilters();
    }
}

// Create heart particles effect
function createHeartParticles(btn) {
    const container = document.getElementById("particles-container");
    if (!container) return;
    
    const rect = btn.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Heart particles
    const heartParticleCount = 15;
    const heartColors = ['#ff6b6b', '#ff8e8e', '#ffb3b3', '#ffd4d4', '#ff4757', '#ff6348', '#ff7675'];
    
    for (let i = 0; i < heartParticleCount; i++) {
        const particle = document.createElement("div");
        particle.className = "heart-particle";
        particle.textContent = "♥";
        
        const angle = (Math.PI * 2 * i) / heartParticleCount;
        const distance = 25 + Math.random() * 20;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance - 15; // Slight upward bias
        
        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;
        particle.style.color = heartColors[i % heartColors.length];
        particle.style.setProperty('--heart-tx', `${tx}px`);
        particle.style.setProperty('--heart-ty', `${ty}px`);
        
        // Smoother staggered effect with less delay
        particle.style.animationDelay = `${i * 0.01}s`;
        
        container.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 1000);
    }
    
    // Additional colorful particles for more impact
    const regularParticleCount = 25;
    const regularColors = ['#ff6b6b', '#ff8e8e', '#ffb3b3', '#ffd4d4', '#ff4757', '#ff6348', '#ff7675'];
    
    for (let i = 0; i < regularParticleCount; i++) {
        const particle = document.createElement("div");
        particle.className = "particle";
        
        const angle = (Math.PI * 2 * i) / regularParticleCount + (Math.random() - 0.5) * 0.3;
        const velocity = 35 + Math.random() * 40;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        
        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;
        particle.style.backgroundColor = regularColors[i % regularColors.length];
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        particle.style.width = `${5 + Math.random() * 5}px`;
        particle.style.height = `${5 + Math.random() * 5}px`;
        particle.style.borderRadius = '50%';
        particle.style.willChange = 'transform, opacity';
        
        container.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 900);
    }
}

// Create regular particles
function createParticles(x, y, color) {
    const container = document.getElementById("particles-container");
    if (!container) return;
    
    const particleCount = 15;
    const colors = [color, lightenColor(color, 20), darkenColor(color, 20)];
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("div");
        particle.className = "particle";
        
        const angle = (Math.PI * 2 * i) / particleCount;
        const velocity = 50 + Math.random() * 50;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.backgroundColor = colors[i % colors.length];
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        
        container.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 1000);
    }
}

function lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const r = Math.min(255, (num >> 16) + percent);
    const g = Math.min(255, ((num >> 8) & 0x00FF) + percent);
    const b = Math.min(255, (num & 0x0000FF) + percent);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function darkenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const r = Math.max(0, (num >> 16) - percent);
    const g = Math.max(0, ((num >> 8) & 0x00FF) - percent);
    const b = Math.max(0, (num & 0x0000FF) - percent);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// Toast notification system
function showToast(message, duration = 3000) {
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toast-message");
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    toast.classList.add("show");
    
    setTimeout(() => {
        toast.classList.remove("show");
    }, duration);
}

// Share functionality
(function initShare() {
    const shareToggle = document.getElementById("share-toggle");
    const shareModal = document.getElementById("share-modal");
    const shareClose = document.getElementById("share-close");
    
    if (shareToggle && shareModal) {
        shareToggle.addEventListener("click", () => {
            shareModal.setAttribute("aria-hidden", "false");
            document.body.classList.add("no-scroll");
        });
    }
    
    if (shareClose && shareModal) {
        shareClose.addEventListener("click", () => {
            shareModal.setAttribute("aria-hidden", "true");
            document.body.classList.remove("no-scroll");
        });
        
        shareModal.addEventListener("click", (e) => {
            if (e.target === shareModal) {
                shareModal.setAttribute("aria-hidden", "true");
                document.body.classList.remove("no-scroll");
            }
        });
    }
    
    // Share actions
    document.addEventListener("click", (e) => {
        if (e.target.closest(".share-btn")) {
            const action = e.target.closest(".share-btn").dataset.action;
        
            if (action === "copy-link") {
                const url = window.location.href;
                navigator.clipboard.writeText(url).then(() => {
                    showToast("Link copied to clipboard!");
                    shareModal.setAttribute("aria-hidden", "true");
                    document.body.classList.remove("no-scroll");
                }).catch(() => {
                    showToast("Failed to copy link");
                });
            } else if (action === "export-favorites") {
                exportFavorites();
            }
        }
    });
})();

// Export favorites as JSON
function exportFavorites() {
    const favoriteItems = allItems.filter(item => {
        const itemId = `${item.image}-${item.title}`;
        return favorites.includes(itemId);
    });
    
    const dataStr = JSON.stringify(favoriteItems, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `color-catalog-favorites-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast("Favorites exported successfully!");
    const shareModal = document.getElementById("share-modal");
    if (shareModal) {
        shareModal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("no-scroll");
    }
}

// Scroll to top functionality
(function initScrollToTop() {
    const scrollBtn = document.getElementById("scroll-to-top");
    if (!scrollBtn) return;
    
    let ticking = false;
    
    function updateScrollButton() {
        if (window.scrollY > 300) {
            scrollBtn.setAttribute("aria-hidden", "false");
        } else {
            scrollBtn.setAttribute("aria-hidden", "true");
        }
        ticking = false;
    }
    
    window.addEventListener("scroll", () => {
        if (!ticking) {
            window.requestAnimationFrame(updateScrollButton);
            ticking = true;
        }
    });
    
    scrollBtn.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
})();

// Image loading progress
(function initImageProgress() {
    const progressBar = document.getElementById("progress-bar");
    if (!progressBar) return;
    
    let loadedImages = 0;
    let totalImages = 0;
    
    function updateProgress() {
        if (totalImages === 0) return;
        const percent = (loadedImages / totalImages) * 100;
        progressBar.style.width = `${percent}%`;
        
        if (loadedImages >= totalImages) {
            setTimeout(() => {
                progressBar.style.width = "0%";
            }, 300);
        }
    }
    
    function trackImages() {
        setTimeout(() => {
            const images = document.querySelectorAll(".item-card img");
            totalImages = images.length;
            loadedImages = 0;
            
            if (totalImages === 0) return;
            
            images.forEach(img => {
                if (img.complete) {
                    loadedImages++;
                } else {
                    img.addEventListener("load", () => {
                        loadedImages++;
                        updateProgress();
                    }, { once: true });
                    img.addEventListener("error", () => {
                        loadedImages++;
                        updateProgress();
                    }, { once: true });
                }
            });
            updateProgress();
        }, 100);
    }
    
    // Track images after initial render
    setTimeout(trackImages, 500);
    
    // Track images after each render
    const observer = new MutationObserver(() => {
        trackImages();
    });
    
    const collection = document.getElementById("collection");
    if (collection) {
        observer.observe(collection, { childList: true, subtree: true });
    }
})();

// Enhanced touch gestures for mobile
(function initTouchGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener("touchstart", (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener("touchend", (e) => {
        if (!touchStartX || !touchStartY) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;
        
        // Swipe left/right in fullscreen viewer
        const viewer = document.getElementById("fullscreen-viewer");
        if (viewer && viewer.classList.contains("active")) {
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    navigateViewer("next");
                } else {
                    navigateViewer("prev");
                }
            }
        }
        
        touchStartX = 0;
        touchStartY = 0;
    }, { passive: true });
})();

