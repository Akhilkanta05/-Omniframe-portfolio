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

    // --- Dynamic Folder-Based Gallery ---
    const galleryGrid = document.querySelector('.gallery-grid');
    let allGalleryImages = [];

    async function loadGalleryImages() {
        try {
            const response = await fetch('gallery.json');
            if (!response.ok) throw new Error(`Failed to load gallery.json`);

            const galleryData = await response.json();
            galleryGrid.innerHTML = '';

            Object.entries(galleryData).forEach(([folderName, images], index) => {
                const folderItem = document.createElement('div');
                folderItem.className = 'gallery-folder';
                folderItem.innerHTML = `
                    <div class="folder-preview" data-folder="${folderName}" data-index="${index}">
                        <div class="folder-aspect">
                            <img src="public/images/gallery/${folderName}/${images[0]}" alt="${folderName}" class="folder-thumbnail">
                        </div>
                        <h3>${folderName.charAt(0).toUpperCase() + folderName.slice(1)}</h3>
                    </div>
                `;
                galleryGrid.appendChild(folderItem);
            });

            initFolderClickListeners(galleryData);
        } catch (error) {
            console.error('Error loading gallery images:', error);
            galleryGrid.innerHTML = `<p class="error-message" style="text-align: center; grid-column: 1 / -1; color: #e74c3c;">Failed to load gallery images.</p>`;
        }
    }

    function initFolderClickListeners(folders) {
        document.querySelectorAll('.folder-preview').forEach(folder => {
            folder.addEventListener('click', () => {
                const folderName = folder.dataset.folder;
                const images = folders[folderName];
                openLightboxGallery(folderName, images);
            });
        });
    }

    function openLightboxGallery(folderName, images) {
        allGalleryImages = images.map((img, i) => ({
            src: `public/images/gallery/${folderName}/${img}`,
            largeSrc: `public/images/gallery/${folderName}/${img}`,
            caption: `${folderName} - ${img.split('.')[0]}`,
            index: i
        }));

        openLightbox(0);
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

    loadGalleryImages();

    // --- Contact Form Submission ---
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('https://formsubmit.co/ajax/your@email.com', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                formStatus.textContent = 'Message sent successfully!';
                formStatus.style.color = 'green';
                contactForm.reset();
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            formStatus.textContent = 'Failed to send message. Please try again later.';
            formStatus.style.color = 'red';
        }
    });
});
