/**
 * PDF Viewer for Project Pages
 * Uses PDF.js library for rendering
 */

class PDFViewer {
  constructor(containerId, pdfUrl) {
    this.container = document.getElementById(containerId);
    this.pdfUrl = pdfUrl;
    this.pdfDoc = null;
    this.currentPage = 1;
    this.totalPages = 0;
    this.renderScale = 3;  // 固定高分辨率渲染
    this.currentZoom = 0.25;  // CSS缩放倍数
    this.canvas = null;
    this.ctx = null;
    this.renderTask = null;
    
    this.init();
  }

  /**
   * Initialize PDF viewer
   */
  async init() {
    if (!this.container) {
      console.error('PDF container not found');
      return;
    }

    // Load PDF.js library
    await this.loadPDFJS();
    
    // Setup viewer UI
    this.setupViewer();
    
    // Load PDF
    this.loadPDF();
  }

  /**
   * Load PDF.js library from CDN
   */
  async loadPDFJS() {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Setup viewer HTML structure
   */
  setupViewer() {
    this.container.innerHTML = `
      <div class="pdf-viewer-wrapper">
        <div class="pdf-canvas-container" id="pdf-canvas-container">
          <div class="pdf-canvas-wrapper" id="pdf-canvas-wrapper">
            <canvas id="pdf-canvas"></canvas>
          </div>
        </div>
        
        <button class="pdf-nav-btn pdf-prev" id="pdf-prev" aria-label="Previous page">
          ←
        </button>
        
        <button class="pdf-nav-btn pdf-next" id="pdf-next" aria-label="Next page">
          →
        </button>
        
        <div class="pdf-controls">
          <span class="pdf-page-info" id="pdf-page-info">Page 1 of 1</span>
          <button class="pdf-fullscreen-btn" id="pdf-fullscreen" aria-label="Fullscreen">
            ⛶
          </button>
        </div>
        
        <div class="pdf-zoom-controls">
          <button class="zoom-btn zoom-out" id="zoom-out" aria-label="Zoom out">−</button>
          <input type="range" class="zoom-slider" id="zoom-slider" min="0.25" max="3" step="0.1" value="1" aria-label="Zoom level">
          <button class="zoom-btn zoom-in" id="zoom-in" aria-label="Zoom in">+</button>
          <span class="zoom-percent" id="zoom-percent">100%</span>
        </div>
        
        <div class="pdf-loading" id="pdf-loading">Loading PDF...</div>
      </div>
    `;

    this.canvas = document.getElementById('pdf-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvasContainer = document.getElementById('pdf-canvas-container');
    this.canvasWrapper = document.getElementById('pdf-canvas-wrapper');

    // Bind events
    this.bindEvents();
  }

  /**
   * Bind UI events
   */
  bindEvents() {
    // Page navigation
    document.getElementById('pdf-prev').addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderPage();
      }
    });

    document.getElementById('pdf-next').addEventListener('click', () => {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.renderPage();
      }
    });

    document.getElementById('pdf-fullscreen').addEventListener('click', () => {
      this.toggleFullscreen();
    });

    // Zoom controls - 只改CSS，不重新渲染
    document.getElementById('zoom-in').addEventListener('click', () => {
      this.applyZoom(Math.min(3, this.currentZoom + 0.1));
    });

    document.getElementById('zoom-out').addEventListener('click', () => {
      this.applyZoom(Math.max(0.5, this.currentZoom - 0.1));
    });

    document.getElementById('zoom-slider').addEventListener('input', (e) => {
      this.applyZoom(parseFloat(e.target.value));
    });

    // Mouse wheel zoom (Ctrl/Cmd + wheel)
    this.canvasContainer.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        this.applyZoom(Math.max(0.5, Math.min(3, this.currentZoom + delta)));
      }
    }, { passive: false });

    // Mouse drag (pan)
    this.setupMouseDrag();

    // Touch support
    this.setupTouchControls();

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.container.classList.contains('fullscreen')) return;
      
      if (e.key === 'ArrowLeft' && this.currentPage > 1) {
        this.currentPage--;
        this.renderPage();
      } else if (e.key === 'ArrowRight' && this.currentPage < this.totalPages) {
        this.currentPage++;
        this.renderPage();
      } else if (e.key === 'Escape') {
        this.exitFullscreen();
      }
    });
  }

  /**
   * Setup mouse drag functionality
   */
  setupMouseDrag() {
    let isDragging = false;
    let startX, startY, scrollLeft, scrollTop;

    this.canvasContainer.addEventListener('mousedown', (e) => {
      isDragging = true;
      this.canvasContainer.classList.add('dragging');
      startX = e.clientX;
      startY = e.clientY;
      scrollLeft = this.canvasContainer.scrollLeft;
      scrollTop = this.canvasContainer.scrollTop;
    });

    this.canvasContainer.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      this.canvasContainer.scrollLeft = scrollLeft - deltaX;
      this.canvasContainer.scrollTop = scrollTop - deltaY;
    });

    this.canvasContainer.addEventListener('mouseup', () => {
      isDragging = false;
      this.canvasContainer.classList.remove('dragging');
    });

    this.canvasContainer.addEventListener('mouseleave', () => {
      isDragging = false;
      this.canvasContainer.classList.remove('dragging');
    });
  }

  /**
   * Setup touch controls (mobile)
   */
  setupTouchControls() {
    let touchStartX, touchStartY;
    let initialPinchDistance = null;
    let initialScale = this.scale;

    // Single touch drag
    this.canvasContainer.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        // Pinch zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
        initialScale = this.scale;
      }
    });

    this.canvasContainer.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        // Single touch scroll
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const deltaX = touchStartX - touchX;
        const deltaY = touchStartY - touchY;
        
        this.canvasContainer.scrollLeft += deltaX;
        this.canvasContainer.scrollTop += deltaY;
        
        touchStartX = touchX;
        touchStartY = touchY;
      } else if (e.touches.length === 2) {
        // Pinch zoom
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const scaleChange = distance / initialPinchDistance;
        const newZoom = Math.max(0.5, Math.min(3, initialScale * scaleChange));
        this.applyZoom(newZoom);
      }
    }, { passive: false });
  }

  /**
   * Update zoom UI elements
   */
  updateZoomUI() {
    const slider = document.getElementById('zoom-slider');
    const percent = document.getElementById('zoom-percent');
    
    if (slider) slider.value = this.currentZoom;
    if (percent) percent.textContent = Math.round(this.currentZoom * 100) + '%';
  }

  /**
   * Load PDF document
   */
  async loadPDF() {
    try {
      const loadingTask = pdfjsLib.getDocument(this.pdfUrl);
      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;
      
      document.getElementById('pdf-loading').style.display = 'none';
      this.renderPage();
      this.updatePageInfo();
    } catch (error) {
      console.error('Error loading PDF:', error);
      document.getElementById('pdf-loading').textContent = 'Error loading PDF';
    }
  }

  /**
   * Render current page (只在翻页时调用)
   */
  async renderPage() {
    if (!this.pdfDoc) return;

    // 取消前一次渲染任务
    if (this.renderTask) {
      try {
        this.renderTask.cancel();
      } catch (e) {
        // 忽略取消错误
      }
    }

    try {
      const page = await this.pdfDoc.getPage(this.currentPage);
      
      // 获取页面旋转角度
      const rotation = page.rotate || 0;
      
      // 使用固定的高分辨率渲染
      const viewport = page.getViewport({ 
        scale: this.renderScale,
        rotation: rotation
      });

      // 适配高DPI屏幕
      const pixelRatio = window.devicePixelRatio || 1;
      
      // 设置canvas实际像素尺寸
      this.canvas.width = viewport.width * pixelRatio;
      this.canvas.height = viewport.height * pixelRatio;
      
      // 设置canvas CSS显示尺寸
      this.canvas.style.width = viewport.width + 'px';
      this.canvas.style.height = viewport.height + 'px';

      const renderContext = {
        canvasContext: this.ctx,
        viewport: viewport,
        transform: [pixelRatio, 0, 0, pixelRatio, 0, 0]
      };

      this.renderTask = page.render(renderContext);
      await this.renderTask.promise;
      this.renderTask = null;
      
      // 重置滚动位置到顶部
      this.canvasContainer.scrollTop = 0;
      this.canvasContainer.scrollLeft = 0;
      
      // 应用当前缩放
      this.applyZoom(this.currentZoom);
      
      this.updatePageInfo();
      this.updateNavButtons();
    } catch (error) {
      if (error.name !== 'RenderingCancelledException') {
        console.error('Error rendering page:', error);
      }
    }
  }

  /**
   * 应用CSS缩放（不重新渲染PDF）
   */
  applyZoom(zoom) {
    this.currentZoom = zoom;
    
    // 通过CSS transform缩放canvas
    this.canvas.style.transform = `scale(${zoom})`;
    this.canvas.style.transformOrigin = '0 0';
    
    // 更新wrapper尺寸以适应缩放后的canvas
    const baseWidth = parseFloat(this.canvas.style.width);
    const baseHeight = parseFloat(this.canvas.style.height);
    
    this.canvasWrapper.style.width = (baseWidth * zoom) + 'px';
    this.canvasWrapper.style.height = (baseHeight * zoom) + 'px';
    
    this.updateZoomUI();
  }

  /**
   * Update page info display
   */
  updatePageInfo() {
    const pageInfo = document.getElementById('pdf-page-info');
    if (pageInfo) {
      pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
    }
  }

  /**
   * Update navigation buttons state
   */
  updateNavButtons() {
    const prevBtn = document.getElementById('pdf-prev');
    const nextBtn = document.getElementById('pdf-next');

    prevBtn.disabled = this.currentPage === 1;
    nextBtn.disabled = this.currentPage === this.totalPages;
  }

  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen() {
    const wrapper = this.container.querySelector('.pdf-viewer-wrapper');
    
    if (!document.fullscreenElement) {
      if (wrapper.requestFullscreen) {
        wrapper.requestFullscreen();
      } else if (wrapper.webkitRequestFullscreen) {
        wrapper.webkitRequestFullscreen();
      } else if (wrapper.msRequestFullscreen) {
        wrapper.msRequestFullscreen();
      }
      wrapper.classList.add('fullscreen');
    } else {
      this.exitFullscreen();
    }
  }

  /**
   * Exit fullscreen mode
   */
  exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    
    const wrapper = this.container.querySelector('.pdf-viewer-wrapper');
    wrapper.classList.remove('fullscreen');
  }
}

// Initialize PDF viewer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const pdfContainer = document.getElementById('pdf-viewer-container');
  if (pdfContainer) {
    const pdfPath = pdfContainer.dataset.pdfPath;
    new PDFViewer('pdf-viewer-container', pdfPath);
  }
}); 