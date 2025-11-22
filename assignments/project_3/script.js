const sheetUrl = "https://docs.google.com/spreadsheets/d/1fScqoxB2QOcyERKRSiCPkEdHGrAwxR6X5MK9N3Vs7Nk/gviz/tq?tqx=out:json&gid=1251391253";

const collectionEl = document.getElementById("collection");
const viewToggleBtn = document.getElementById("view-toggle");
const filterContainerEl = document.getElementById("filter-container");

let allItems = [];
let filteredItems = [];
let isSorted = true; // Default to Spectrum view
let currentFilter = "All";
let currentView = "grid";

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
        
        renderItems(filteredItems);
    })
    .catch((err) => {
        console.error(err);
        collectionEl.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--muted);">Failed to load data. Please check your connection.</p>';
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

    // Filter by tag
    if (currentFilter !== "All") {
        items = items.filter(item => item.tag === currentFilter);
    }

    filteredItems = items;
    
    // Apply sorting if active
    if (isSorted) {
        filteredItems = [...filteredItems].sort((a, b) => {
            return a.colorOrder - b.colorOrder;
        });
    }
    
    renderItems(filteredItems);
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
    } else {
        // Restore filtered order
        applyFilters();
        viewToggleBtn.textContent = "Grid · Spectrum";
        collectionEl.classList.remove("spectrum-view");
        collectionEl.classList.remove("is-spectrum");
    }
});

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
        renderItems(items);
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

// Render items
function renderItems(items) {
    if (!items.length) {
        collectionEl.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--muted);">No items found.</p>';
        return;
    }

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

        // Add click handler to change theme color and background
        card.addEventListener("click", () => {
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
            }
        });

        const figure = document.createElement("figure");
        
        const img = document.createElement("img");
        img.src = item.image;
        img.alt = item.title || `Image ${index + 1}`;
        img.loading = "lazy";

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

// Mouse halo effect
(function initMouseHalo() {
    const halo = document.getElementById("mouse-halo");
    if (!halo) return;

    let mouseX = 0;
    let mouseY = 0;
    let haloX = 0;
    let haloY = 0;
    let isVisible = false;

    // Smooth interpolation
    function updateHalo() {
        const dx = mouseX - haloX;
        const dy = mouseY - haloY;
        
        // Easing factor (0.15 = smooth lag)
        haloX += dx * 0.15;
        haloY += dy * 0.15;
        
        halo.style.transform = `translate(${haloX}px, ${haloY}px) translate(-50%, -50%) scale(${isVisible ? 1 : 0.8})`;
        
        requestAnimationFrame(updateHalo);
    }

    document.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        if (!isVisible) {
            isVisible = true;
            halo.classList.add("visible");
            haloX = mouseX;
            haloY = mouseY;
        }
    });

    document.addEventListener("mouseleave", () => {
        isVisible = false;
        halo.classList.remove("visible");
    });

    // Start animation loop
    updateHalo();
})();

