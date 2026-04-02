const imgElement = document.getElementById('sculpture-img');
// We have 145 images based on the sequence 00001.png to 00145.png
const frameCount = 145;

// Helper to get image paths easily
const currentFrame = index => `${index.toString().padStart(5, '0')}.png`;

const images = [];

// Preload all 145 images to avoid flickering and guarantee smooth rotation
for (let i = 1; i <= frameCount; i++) {
    const img = new Image();
    img.src = currentFrame(i);
    images.push(img);
}

// Preload 360 Brilliant images
const brillantFrameCount = 360;
const brillantImages = [];
for (let i = 1; i <= brillantFrameCount; i++) {
    const img = new Image();
    img.src = `_MConverter.eu_BRILLANTE/${i.toString().padStart(5, '0')}.png`;
    brillantImages.push(img);
}

function renderFrame() {
    const html = document.documentElement;
    const scrollTop = html.scrollTop;
    
    const quoteElement = document.querySelector('.quote-box');
    const formElement = document.getElementById('lead-form-1');
    const canvasEl = document.getElementById('canvas-container');
    
    // Default fallback
    let maxRotationScroll = Math.max(1, html.scrollHeight - window.innerHeight);
    let unfixThreshold = maxRotationScroll;
    
    // ROTATION MATH: Finishes EXACTLY when the Form ("Caja de Datos") starts appearing
    if (formElement) {
        const formTopY = formElement.getBoundingClientRect().top + scrollTop;
        // Hits 100% exactly as the top of the form box enters the screen from the bottom
        maxRotationScroll = Math.max(1, formTopY - window.innerHeight);
    }

    // POSITION MATH: Bust unfixes and scrolls up EXACTLY when the Form Box starts appearing.
    // This perfectly synchronizes their scroll speeds so the Form never covers the 3D Bust!
    if (formElement) {
        const formTopY = formElement.getBoundingClientRect().top + scrollTop;
        unfixThreshold = Math.max(1, formTopY - window.innerHeight);
    }
    
    // ROTATION MATH
    const scrollFraction = Math.max(0, Math.min(1, scrollTop / maxRotationScroll));
    const frameIndex = Math.min(frameCount - 1, Math.floor(scrollFraction * frameCount));
    
    if (images[frameIndex]) {
        imgElement.src = images[frameIndex].src;
    }

    // POSITION MATH
    if (canvasEl) {
        if (unfixThreshold > 0 && scrollTop > unfixThreshold) {
            // Once rotation is fully 100% complete, unfix it to scroll up organically
            canvasEl.style.position = 'absolute';
            canvasEl.style.top = `${unfixThreshold}px`;
        } else {
            canvasEl.style.position = 'fixed';
            canvasEl.style.top = '0px';
        }
    }

    // ----------------------------------------------------
    // BRILLIANT SCROLL ANIMATION MATH (Carbon to Diamond)
    // ----------------------------------------------------
    const brillantImg = document.getElementById('brillant-img');
    const quoteSection = document.getElementById('quote-section');
    
    if (brillantImg && quoteSection) {
        const sectionTopY = quoteSection.getBoundingClientRect().top + scrollTop;
        
        // Start animation exactly when the section reaches its sticky point (approx 20vh from top of screen)
        // This means it freezes on screen, and ONLY THEN the carbon starts transforming into a diamond as you scroll!
        const startAnimScroll = sectionTopY - (window.innerHeight * 0.2);
        
        const distanceIntoSection = Math.max(0, scrollTop - startAnimScroll);
        
        // We want the 360 frames to play out over roughly 100vh of pure scrolling 
        // while the user is locked inside the 150vh tall quote section
        const animationScrollRange = window.innerHeight * 1.0; 
        
        const bFraction = Math.max(0, Math.min(1, distanceIntoSection / animationScrollRange));
        const bFrameIndex = Math.min(brillantFrameCount - 1, Math.floor(bFraction * brillantFrameCount));
        
        if (brillantImages[bFrameIndex]) {
            brillantImg.src = brillantImages[bFrameIndex].src;
        }
        
        // HORIZONTAL CROSSING ANIMATION & HEIGHT SYNC
        const quotePanel = document.getElementById('quote-panel');
        const brillantePanel = document.getElementById('brillante-panel');
        
        if (quotePanel && brillantePanel) {
            // Make the brilliant visually imposing by scaling it mathematically to 160% of the quote box height!
            // This compensates for PNG padding and makes the gem look massive.
            const targetHeight = quotePanel.offsetHeight * 1.6;
            brillantePanel.style.height = `${targetHeight}px`;
            brillantImg.style.height = `${targetHeight}px`;
            
            // As bFraction goes from 0 to 1, quote moves from right to left or left to right.
            // Original CSS is left for quote, right for brilliant.
            // Use an easing function for a smoother, elegant sweep
            const easeFraction = bFraction < 0.5 ? 2 * bFraction * bFraction : 1 - Math.pow(-2 * bFraction + 2, 2) / 2;
            
            if (window.innerWidth > 768) {
                // Desktop: Horizontal Cross
                quotePanel.style.transform = `translateX(${easeFraction * 45}vw)`;
                brillantePanel.style.transform = `translateX(-${easeFraction * 45}vw)`;
            } else {
                // Mobile: Vertical Cross (Prevent horizontal scrollbar overflow!)
                // Quote moves up, Brilliant moves down seamlessly.
                quotePanel.style.transform = `translateY(-${easeFraction * 20}vh)`;
                brillantePanel.style.transform = `translateY(${easeFraction * 20}vh)`;
            }
        }
    }
}

// Ensure smooth performance by syncing with browser display refresh
window.addEventListener('scroll', () => {
    window.requestAnimationFrame(() => {
        renderFrame();
        checkIntersections();
    });
});

// Animate UI elements when scrolling into view
function checkIntersections() {
    const sections = document.querySelectorAll('.detail-section, .footer-section');
    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        // Trigger reveal when element top hits 85% of viewport height
        if (rect.top <= window.innerHeight * 0.85 && rect.bottom >= 0) {
            section.classList.add('visible');
        } else if (rect.top > window.innerHeight) {
            // Optional: Hide out-of-view sections to replay animations when scrolling back up
            section.classList.remove('visible');
        }
    });
}

// Initial calls just in case the user refreshes without being at top of page
renderFrame();
setTimeout(checkIntersections, 100);

// ----------------------------------------------------
// DYNAMIC VIDEO MODAL LOGIC
// ----------------------------------------------------
const videoTriggers = document.querySelectorAll('.video-trigger');
const videoModal = document.getElementById('video-modal');
const closeModalBtn = document.getElementById('close-modal');
const brandVideo = document.getElementById('brand-video');

if (videoTriggers.length > 0 && videoModal && brandVideo) {
    // Open modal and play respective video smoothly
    videoTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const videoFile = trigger.getAttribute('data-video');
            if (videoFile) {
                brandVideo.src = videoFile; // Load specific video for the box touched!
                videoModal.style.display = 'flex';
                // Trigger reflow to ensure CSS transition runs
                void videoModal.offsetWidth; 
                videoModal.style.opacity = '1';
                brandVideo.currentTime = 0; // Restart video
                brandVideo.play().catch(e => console.log("Autoplay prevented:", e));
            }
        });
    });

    const hideModal = () => {
        videoModal.style.opacity = '0';
        brandVideo.pause();
        setTimeout(() => {
            videoModal.style.display = 'none';
        }, 400); // match transition duration
    };

    // Close on button click
    closeModalBtn.addEventListener('click', hideModal);

    // Close on background blur click
    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) {
            hideModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && videoModal.style.display === 'flex') {
            hideModal();
        }
    });
}

// ----------------------------------------------------
// FORM SUBMISSION (LEAD CAPTURE)
// ----------------------------------------------------
const leadForm = document.getElementById('lead-form-2');
if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent page reload
        
        const submitBtn = leadForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        
        // 1. Loading UX State
        submitBtn.innerText = 'Autenticando Acceso...';
        submitBtn.style.opacity = '0.8';
        submitBtn.style.pointerEvents = 'none';

        const formData = new FormData(leadForm);
        const payload = {
            name: formData.get('name'),
            email: formData.get('email'),
            timestamp: new Date().toISOString()
        };

        // TODO: Enviar payload a Webhook de Zapier/Make o API de Mailchimp
        console.log("Prospecto Procesado:", payload);

        // Simulation delay (UX)
        setTimeout(() => {
            // 2. Success State
            submitBtn.innerText = '¡Guía Desbloqueada!';
            submitBtn.style.background = '#4CAF50'; 
            submitBtn.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.4)';
            submitBtn.style.color = '#fff';
            
            // 3. (Optional) Redirect prospect to the PDF link or a "Thank You" page
            // window.location.href = "descarga.html";
        }, 1500);
    });
}
