(function () {
  var lightbox = document.getElementById('photo-lightbox');
  if (!lightbox) return;

  var lightboxImg = lightbox.querySelector('.photo-lightbox-img');
  var closeBtn = lightbox.querySelector('.photo-lightbox-close');

  function openLightbox(src) {
    lightboxImg.src = src;
    lightboxImg.alt = '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.photo-grid .photo-card img').forEach(function (img) {
    img.setAttribute('title', 'Double-click to enlarge');
    img.addEventListener('dblclick', function (e) {
      e.preventDefault();
      openLightbox(this.currentSrc || this.src);
    });
  });

  closeBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    closeLightbox();
  });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  lightboxImg.addEventListener('click', function (e) {
    e.stopPropagation();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
      closeLightbox();
    }
  });
})();
