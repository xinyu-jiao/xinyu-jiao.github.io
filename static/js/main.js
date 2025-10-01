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
    console.log('Page controller initialized');
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
  showProjects() {
    document.body.classList.add('landing-dismissed');
  }

  /**
   * Show landing section and hide projects
   */
  showLanding() {
    document.body.classList.remove('landing-dismissed');
  }
}

// ==========================================================================
// Initialize Application
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  new PageController();
}); 