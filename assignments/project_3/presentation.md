# Color Catalog - Project Presentation

## Project Description

**Color Catalog** is an interactive, color-driven portfolio website that organizes my works by color spectrum rather than traditional categories like course or semester. The project explores how color can serve as a narrative thread connecting different projects across various mediums—from haptic navigation devices for blind users to interactive projections and speculative interfaces.

### Core Features

1. **Color-Based Organization**: Each work is assigned a dominant color, and the site can display items sorted by color spectrum (red → orange → yellow → green → blue → purple), creating a visual journey through the collection.

2. **Dual View Modes**:
   - **Spectrum View**: Items sorted by color order, revealing color relationships across projects
   - **Original View**: Items displayed in their original order from the data source

3. **Tag Filtering**: Dynamic filter buttons generated from item tags, allowing users to filter by project type or category.

4. **Interactive Color Theming**: Clicking on any card changes the site's accent color and background gradient to match that item's dominant color, creating an immersive, color-responsive experience.

5. **Smooth Animations**:
   - Staggered card animations when switching views
   - 3D hover effects with color glow on cards
   - Mouse halo effect that follows cursor movement
   - Smooth transitions between states

6. **Data-Driven**: Content is fetched from Google Sheets, making it easy to update the catalog without editing code.

### Technical Implementation

- **Vanilla JavaScript**: No external libraries, using native DOM APIs and Fetch API
- **CSS Custom Properties**: Dynamic theming through CSS variables
- **Google Sheets API**: Data source for images, titles, tags, and color information
- **Responsive Design**: Mobile-optimized with simplified interactions on smaller screens
- **Accessibility**: ARIA labels and semantic HTML structure

---

## Show Up Prepared With: Questions, Code and Next Steps

### Questions for Instructor

I have several questions about optimizing and improving my Color Catalog project. First, regarding performance optimization: with 99 images loading on the page, I'm wondering if I should implement lazy loading with the Intersection Observer API, or if the current `loading="lazy"` attribute is sufficient. Additionally, I'd like to know if image optimization (WebP format, responsive images) would significantly improve load times. Second, about the color sorting algorithm: I'm currently using a simple numeric order from the data source, but I'm curious if implementing a more sophisticated color space conversion (HSL/HSV) would provide better visual spectrum flow, or if I should consider perceptual color sorting like CIELAB for more natural color transitions. Third, for state management, I'm unsure whether I should implement localStorage now to save user preferences (view mode, active filter) or wait until more features are added. Also, is there a better pattern for managing my multiple state variables (isSorted, currentFilter, filteredItems)? Fourth, regarding animation performance: my mouse halo effect uses `requestAnimationFrame` in a continuous loop, and I want to know if this is efficient or if I should throttle it differently. For the card sorting animations, are my setTimeout delays (5ms, 10ms) optimal, or should I use a more precise timing system? Finally, about code organization: should I refactor my 300+ line script.js into modules, or keep it as a single file for this project size? Would separating concerns (data fetching, rendering, event handling) improve maintainability?

### Key Code Snippets

The core functionality of my Color Catalog revolves around three main code implementations. First, the color-based sorting and dynamic theming system allows users to switch between Spectrum and Original views, with smooth staggered animations when cards reorder. When a user clicks on any card, the entire site's accent color and background gradient dynamically change to match that item's dominant color, creating an immersive color-responsive experience. This is achieved through CSS custom properties that are updated in real-time via JavaScript, converting hex colors to RGB values for the gradient overlays.
```146:223:assignments/project_3/script.js
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
```

Second, the mouse halo effect creates a smooth, lagging cursor follower that enhances the interactive feel of the site. This uses a continuous `requestAnimationFrame` loop with an easing factor of 0.15 to create smooth interpolation between the actual mouse position and the halo's position, giving it a natural, fluid movement that responds to cursor motion.
```259:303:assignments/project_3/script.js
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
```

Third, the dynamic filter generation system automatically creates filter buttons based on unique tags found in the data, eliminating the need to manually maintain a filter list. When a filter is selected, the `filterByTag` function updates the active button state and applies the filter, working seamlessly with both the Spectrum and Original view modes to maintain the user's preferred sorting while filtering content.
```74:101:assignments/project_3/script.js
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
```

### Next Steps

My immediate next steps include implementing localStorage to save the user's view preference and active filter, which will create a more personalized experience. I also plan to add keyboard navigation support (arrow keys, Enter, Escape) to improve accessibility, improve error handling for failed image loads, and add loading states with skeleton screens during data fetch to provide better user feedback. For feature additions, I want to make cards clickable to open a detail modal or overlay showing the full image and description, add search functionality to filter by title or tag, implement URL parameters to allow sharing specific views and filters (e.g., `?view=spectrum&filter=interaction`), and potentially add a color picker to filter by specific color ranges. In terms of performance and polish, I'll optimize images using WebP format and responsive sizes, implement Intersection Observer for more efficient lazy loading, add smooth scroll behavior when switching views, and consider virtual scrolling for very large collections. For accessibility improvements, I'll add focus indicators for keyboard navigation, implement skip links, add screen reader announcements for view changes, and ensure color contrast meets WCAG AA standards. Finally, for code refactoring, I plan to extract color utilities into separate functions, create a state management object to centralize app state, add JSDoc comments for better documentation, and consider splitting into modules if the project continues to grow.

