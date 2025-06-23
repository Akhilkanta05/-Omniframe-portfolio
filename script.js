document.addEventListener('DOMContentLoaded', () => {
    // --- Smooth Scrolling for Navigation ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const navLinks = document.querySelector('.nav-links');
            const navToggle = document.querySelector('.nav-toggle');
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                navToggle.classList.remove('active');
            }

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const headerOffset = document.querySelector('.site-header').offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - headerOffset;

                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        });
    });

    // --- Sticky Header ---
    const siteHeader = document.querySelector('.site-header');
    const handleScroll = () => {
        if (window.scrollY > 0) siteHeader.classList.add('scrolled');
        else siteHeader.classList.remove('scrolled');

        const sections = document.querySelectorAll('section');
        const headerHeight = siteHeader.offsetHeight;
        const scrollPos = window.scrollY + headerHeight + 1;

        sections.forEach(section => {
            if (scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
                document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
                const currentNavLink = document.querySelector(`.nav-links a[href="#${section.id}"]`);
                if (currentNavLink) currentNavLink.classList.add('active');
            }
        });
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();

    // --- Mobile Navigation ---
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // --- Dynamic Gallery Loading from static gallery.json ---
    const galleryGrid = document.querySelector('.gallery-grid');
    let allGalleryImages = [];

    async function loadGalleryImages() {
        try {
            const response = await fetch('gallery.json');
            if (!response.ok) throw new Error(`Failed to load gallery.json`);

            const filenames = await response.json();
            allGalleryImages = filenames.map((filename, index) => ({
                src: `public/images/gallery/${filename}`,
                largeSrc: `public/images/gallery/${filename}`,
                caption: `Photo: ${filename.split('.')[0].replace(/[-_]/g, ' ')}`,
                index
            }));

            galleryGrid.innerHTML = '';

            if (allGalleryImages.length === 0) {
                galleryGrid.innerHTML = `<p class="info-message" style="text-align: center; grid-column: 1 / -1; color: #777;">No images found in the gallery.</p>`;
            } else {
                allGalleryImages.forEach((imageData, index) => {
                    const galleryItem = document.createElement('div');
                    galleryItem.className = 'gallery-item';
                    galleryItem.dataset.largeSrc = imageData.largeSrc;
                    galleryItem.dataset.caption = imageData.caption;
                    galleryItem.dataset.index = index;

                    galleryItem.innerHTML = `<img class="lazy-load" data-src="${imageData.src}" alt="${imageData.caption}">`;
                    galleryGrid.appendChild(galleryItem);
                });
            }

            initLazyLoading();
            initLightboxItemListeners();
        } catch (error) {
            console.error('Error loading gallery images:', error);
            galleryGrid.innerHTML = `<p class="error-message" style="text-align: center; grid-column: 1 / -1; color: #e74c3c;">Failed to load gallery images.</p>`;
        }
    }

    function initLazyLoading() {
        const lazyImages = document.querySelectorAll('img.lazy-load');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy-load');
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: '0px 0px 100px 0px' });

        lazyImages.forEach(img => imageObserver.observe(img));
    }

    // --- Lightbox ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.querySelector('.lightbox-image');
    const lightboxCaption = document.querySelector('.lightbox-caption');
    const lightboxClose = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-nav.prev');
    const nextBtn = document.querySelector('.lightbox-nav.next');
    let currentImageIndex = 0;

    function openLightbox(index) {
        currentImageIndex = index;
        const imageData = allGalleryImages[currentImageIndex];
        if (imageData) {
            lightboxImage.src = imageData.largeSrc;
            lightboxCaption.textContent = imageData.caption;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    function navigateLightbox(direction) {
        currentImageIndex += direction;
        if (currentImageIndex < 0) currentImageIndex = allGalleryImages.length - 1;
        else if (currentImageIndex >= allGalleryImages.length) currentImageIndex = 0;
        openLightbox(currentImageIndex);
    }

    function initLightboxItemListeners() {
        document.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('click', handleGalleryItemClick);
        });
    }

    function handleGalleryItemClick(e) {
        const clickedIndex = parseInt(e.currentTarget.dataset.index);
        if (!isNaN(clickedIndex)) openLightbox(clickedIndex);
    }

    lightboxClose.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', () => navigateLightbox(-1));
    nextBtn.addEventListener('click', () => navigateLightbox(1));
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('active')) {
            if (e.key === 'Escape') closeLightbox();
            else if (e.key === 'ArrowLeft') navigateLightbox(-1);
            else if (e.key === 'ArrowRight') navigateLightbox(1);
        }
    });

    // --- Contact Form ---
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = contactForm.querySelector('#name').value;
            const email = contactForm.querySelector('#email').value;
            const message = contactForm.querySelector('#message').value;

            if (!name || !email || !message) {
                displayFormStatus('Please fill in all fields.', 'error');
                return;
            }

            displayFormStatus('Sending message...', '');

            try {
                await new Promise(resolve => setTimeout(resolve, 1500));
                displayFormStatus('Thank you for your message! I will get back to you soon.', 'success');
                contactForm.reset();
            } catch (error) {
                console.error('Form submission error:', error);
                displayFormStatus('An error occurred. Please try again later.', 'error');
            }
        });
    }

    function displayFormStatus(message, type) {
        formStatus.textContent = message;
        formStatus.className = `form-status ${type}`;
        formStatus.style.display = 'block';
        setTimeout(() => {
            formStatus.style.display = 'none';
        }, 5000);
    }

    loadGalleryImages();
});
