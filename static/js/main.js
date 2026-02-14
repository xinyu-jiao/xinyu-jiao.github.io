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
    this.setupScrollHide();
    this.triggerJumpInOnLoad();
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

    // Nav logo - return to landing when clicked
    const navLogo = document.getElementById('nav-logo-link');
    if (navLogo) {
      navLogo.addEventListener('click', (e) => {
        e.preventDefault();
        this.showLanding();
      });
    }

    // Projects link - show projects page
    const projectsLink = document.querySelector('.nav-link[href="#projects"]');
    if (projectsLink) {
      projectsLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showProjects();
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

  /**
   * Trigger fade-in-up effect when page loads (inspired by ODA Architecture)
   */
  triggerJumpInOnLoad() {
    const introMain = document.querySelector('.intro-main');
    const introSubtitle = document.querySelector('.intro-subtitle');
    
    if (introMain) {
      // Add animation class after a small delay to ensure it triggers
      setTimeout(() => {
        introMain.classList.add('fade-in-up');
      }, 300);
    }
    
    if (introSubtitle) {
      setTimeout(() => {
        introSubtitle.classList.add('fade-in-up');
      }, 300);
    }
  }

  /**
   * Setup scroll to hide navbar on projects page
   */
  setupScrollHide() {
    const navbar = document.querySelector('.top-navbar');
    if (!navbar) return;

    let ticking = false;
    let lastScrollTop = 0;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          
          // Only hide navbar on projects page (landing-dismissed)
          if (document.body.classList.contains('landing-dismissed')) {
            if (scrollTop > 100 && scrollTop > lastScrollTop) {
              // Scrolling down - hide navbar
              navbar.classList.add('navbar-scrolled');
            } else if (scrollTop < lastScrollTop || scrollTop <= 50) {
              // Scrolling up or near top - show navbar
              navbar.classList.remove('navbar-scrolled');
            }
          }
          
          lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }
}

// ==========================================================================
// Initialize Application
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  new PageController();
}); 