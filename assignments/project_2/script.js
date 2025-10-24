const places = {
    nyc: {
        title: "New York, New York",
        description: "Midnight bodegas, flickering subway stations, and neon windows that never quite close their eyes.",
        background: "nyc",
        photos: [
            { src: "assets/nyc-01.jpg", alt: "Manhattan's skyline glittering at night, seen across the river from Brooklyn." },
            { src: "assets/nyc-02.jpg", alt: "Dawn haze stretching across the Brooklyn Bridge toward Manhattan." },
            { src: "assets/nyc-03.jpg", alt: "Time Square's billboards and traffic shimmering in midnight neon." }
        ]
    },
    madison: {
        title: "Madison, Wisconsin",
        description: "Driftless afternoons on frozen Lake Mendota, campus walks wrapped in scarves, and a gentle rhythm of light skimming across ice.",
        background: "madison",
        photos: [
            { src: "assets/madison-01.jpg", alt: "Mallard ducks drifting along Lake Mendota's quiet shoreline." },
            { src: "assets/madison-02.jpg", alt: "Madison's Capitol dome glowing against a twilight sky." }
        ]
    },
    chicago: {
        title: "Chicago, Illinois",
        description: "Steel beams humming with wind, brown line commutes at dusk, and skyscraper shadows sliding down the river.",
        background: "chicago",
        photos: [
            { src: "assets/chicago-01.jpg", alt: "Aerial night view of the Chicago River bending through illuminated skyscrapers." },
            { src: "assets/chicago-02.jpg", alt: "Fireworks bursting over Navy Pier and the mirrored lakefront." },
            { src: "assets/chicago-03.jpg", alt: "Sunlit ripples glittering across the surface of Lake Michigan." }
        ]
    },
    orlando: {
        title: "Orlando, Florida",
        description: "Afternoon storms bursting over palm-lined streets, sun-glow mornings, and carousel lights drifting past horizon lines.",
        background: "orlando",
        photos: [
            { src: "assets/orlando-01.jpg", alt: "Sunset silhouettes of palm trees framing glowing traffic on an Orlando boulevard." },
            { src: "assets/orlando-02.jpg", alt: "A giraffe strolling past the Tree of Life in Disney's Animal Kingdom." },
            { src: "assets/orlando-03.jpg", alt: "The illuminated gateway of Universal's Epic Universe at night." }
        ]
    },
    hawaii: {
        title: "Honululu, Hawaii",
        description: "A salt-soft promise of future mornings, slow waves curling toward a horizon waiting to be touched.",
        background: "hawaii",
        photos: [
            { src: "assets/hawaii-01.jpg", alt: "Boarding pass screenshot hinting at an upcoming flight to Honolulu." }
        ]
    }
};

const app = document.querySelector(".app");
const body = document.body;
const cards = document.querySelectorAll(".location-card");
const detailsTitle = document.querySelector(".details__title");
const detailsDescription = document.querySelector(".details__description");
const photoStack = document.querySelector(".photo-stack");
const timeline = document.getElementById("timeline");

const placeKeys = Object.keys(places);

function createPhotoElement(photo, index) {
    const wrapper = document.createElement("button");
    wrapper.className = "photo-stack__photo";
    wrapper.type = "button";
    wrapper.setAttribute("data-index", index);
    wrapper.tabIndex = index === 0 ? 0 : -1;
    if (photo.alt) {
        wrapper.setAttribute("aria-label", photo.alt);
    }

    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.alt || "";
    wrapper.appendChild(img);

    wrapper.addEventListener("click", () => {
        activatePhoto(index);
    });

    wrapper.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            activatePhoto(index);
        }
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            activatePhoto(Math.max(0, index - 1));
        }
        if (event.key === "ArrowRight") {
            event.preventDefault();
            activatePhoto(Math.min(photoStack.children.length - 1, index + 1));
        }
    });

    return wrapper;
}

function populatePhotoStack(photos = []) {
    if (!photoStack) return;
    photoStack.innerHTML = "";

    if (!photos.length) {
        photoStack.classList.add("photo-stack--empty");
        const placeholder = document.createElement("span");
        placeholder.className = "details__placeholder";
        placeholder.textContent = "Image coming soon";
        photoStack.appendChild(placeholder);
        return;
    }

    photoStack.classList.remove("photo-stack--empty");

    photos.forEach((photo, index) => {
        const photoEl = createPhotoElement(photo, index, photos.length);
        photoStack.appendChild(photoEl);
    });

    activatePhoto(0);
}

function activatePhoto(index) {
    if (!photoStack) return;
    const photos = photoStack.querySelectorAll(".photo-stack__photo");
    if (!photos.length) return;

    const safeIndex = Math.max(0, Math.min(index, photos.length - 1));
    const prevIndex = safeIndex - 1;
    const nextIndex = safeIndex + 1;

    photos.forEach((photoEl, idx) => {
        photoEl.classList.remove("is-active", "is-preview");
        photoEl.removeAttribute("data-edge");
        photoEl.tabIndex = -1;

        if (idx === safeIndex) {
            photoEl.classList.add("is-active");
            photoEl.tabIndex = 0;
        }
    });

    if (prevIndex >= 0) {
        const prevPhoto = photos[prevIndex];
        prevPhoto.classList.add("is-preview");
        prevPhoto.setAttribute("data-edge", "left");
        prevPhoto.tabIndex = 0;
    }

    if (nextIndex < photos.length) {
        const nextPhoto = photos[nextIndex];
        nextPhoto.classList.add("is-preview");
        nextPhoto.setAttribute("data-edge", "right");
        nextPhoto.tabIndex = 0;
    }
}

function setActivePlace(key) {
    const place = places[key];
    if (!place) return;

    body.dataset.activePlace = key;
    app.dataset.activePlace = key;

    cards.forEach((card) => {
        const isActive = card.dataset.place === key;
        card.setAttribute("data-active", isActive ? "true" : "false");
    });

    detailsTitle.textContent = place.title;
    detailsDescription.textContent = place.description;
    populatePhotoStack(place.photos);

    const index = placeKeys.indexOf(key);
    if (index >= 0) {
        timeline.value = index;
    }
}

function handleCardClick(event) {
    const card = event.currentTarget;
    setActivePlace(card.dataset.place);
}

function handleKeyPress(event) {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActivePlace(event.currentTarget.dataset.place);
    }
}

function handleTimelineChange(event) {
    const index = Number(event.target.value);
    const key = placeKeys[index];
    if (key) {
        setActivePlace(key);
    }
}

cards.forEach((card) => {
    card.addEventListener("click", handleCardClick);
    card.addEventListener("keydown", handleKeyPress);
});

if (timeline) {
    timeline.addEventListener("input", handleTimelineChange);
}

if (photoStack) {
    photoStack.addEventListener("mouseenter", () => {
        photoStack.classList.add("is-hovered");
    });

    photoStack.addEventListener("mouseleave", () => {
        photoStack.classList.remove("is-hovered");
    });
}

// Initialize with NYC
setActivePlace("nyc");

