/**
 * Personal Website - Page Navigation
 * Handles transitions between landing page and projects gallery
 */

class PageController {
  constructor() {
    this.elements = {
      moreBtn: document.getElementById('more-btn'),
      backArrow: document.getElementById('back-arrow'),
      landingSection: document.querySelector('.landing-section'),
      cards: document.querySelectorAll('.project-card'),
      projectsGrid: document.querySelector('.projects-grid')
    };
    
    this.init();
  }

  /**
   * Initialize all event listeners
   */
  init() {
    this.setupNavigation();
    this.applyInitialState();
    console.log('Page controller initialized');
  }

  /**
   * Apply initial UI state based on URL hash
   */
  applyInitialState() {
    if (window.location.hash === '#projects') {
      this.showProjects({ skipUrlUpdate: true });
    }
  }

  /**
   * Setup navigation controls
   */
  setupNavigation() {
    // More button - show projects
    if (this.elements.moreBtn) {
      this.elements.moreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showProjects();
      });
    }

    // Back arrow - return to landing
    if (this.elements.backArrow) {
      this.elements.backArrow.addEventListener('click', () => {
        this.showLanding();
      });
    }
  }

  /**
   * Hide landing section and show projects
   */
  showProjects(options = {}) {
    const { skipUrlUpdate = false } = options;
    document.body.classList.add('landing-dismissed');

    if (!skipUrlUpdate && window.history?.replaceState) {
      const { pathname, search } = window.location;
      window.history.replaceState(null, '', `${pathname}${search}#projects`);
    }
  }

  /**
   * Show landing section and hide projects
   */
  showLanding(options = {}) {
    const { skipUrlUpdate = false } = options;
    document.body.classList.remove('landing-dismissed');

    if (!skipUrlUpdate && window.history?.replaceState) {
      const { pathname, search } = window.location;
      window.history.replaceState(null, '', `${pathname}${search}`);
    }
  }
}

// ==========================================================================
// Initialize Application
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  new PageController();
}); 