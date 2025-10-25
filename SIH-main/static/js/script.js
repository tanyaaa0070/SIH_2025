// Gullak Website JavaScript

// Initialize Lucide icons
document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize smooth scrolling
    initSmoothScrolling();
    
    // Initialize 3D Gullak
    init3DGullak();
    
    // Initialize animations
    initAnimations();
    
    // Initialize intersection observer for animations
    initIntersectionObserver();
});

// Mobile Menu Functionality
function initMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileNav = document.getElementById('mobileNav');
    const menuIcon = document.getElementById('menuIcon');
    const closeIcon = document.getElementById('closeIcon');
    
    if (mobileMenuToggle && mobileNav) {
        mobileMenuToggle.addEventListener('click', function() {
            const isActive = mobileNav.classList.contains('active');
            
            if (isActive) {
                mobileNav.classList.remove('active');
                menuIcon.style.display = 'block';
                closeIcon.style.display = 'none';
            } else {
                mobileNav.classList.add('active');
                menuIcon.style.display = 'none';
                closeIcon.style.display = 'block';
            }
        });
        
        // Close mobile menu when clicking on links
        const mobileLinks = mobileNav.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileNav.classList.remove('active');
                menuIcon.style.display = 'block';
                closeIcon.style.display = 'none';
            });
        });
    }
}

// Smooth Scrolling for Navigation Links
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// 3D Gullak Implementation
function init3DGullak() {
    // Initialize main hero Gullak
    const heroGullakContainer = document.getElementById('threeGullak');
    if (heroGullakContainer) {
        createGullak(heroGullakContainer);
    }
    
    // Initialize CTA Gullak
    const ctaGullakContainer = document.getElementById('ctaThreeGullak');
    if (ctaGullakContainer) {
        createGullak(ctaGullakContainer);
    }
}

function createGullak(container) {
    if (!window.THREE) {
        console.warn('Three.js not loaded');
        return;
    }
    
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    container.appendChild(renderer.domElement);
    
    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0x8B4513, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xFFE4B5, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Create clay material
    const clayMaterial = new THREE.MeshPhongMaterial({
        color: 0x8B4513,
        shininess: 5,
        bumpScale: 0.3,
    });
    
    // Create bump texture for clay effect
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    const imageData = ctx.createImageData(256, 256);
    for (let i = 0; i < imageData.data.length; i += 4) {
        const noise = Math.random() * 60 + 100;
        imageData.data[i] = noise;
        imageData.data[i + 1] = noise * 0.7;
        imageData.data[i + 2] = noise * 0.5;
        imageData.data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    
    const bumpTexture = new THREE.CanvasTexture(canvas);
    clayMaterial.bumpMap = bumpTexture;
    
    // Create gullak group
    const gullak = new THREE.Group();
    
    // Main body (sphere flattened)
    const bodyGeometry = new THREE.SphereGeometry(1.2, 32, 24);
    bodyGeometry.scale(1, 0.8, 1);
    const body = new THREE.Mesh(bodyGeometry, clayMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    gullak.add(body);
    
    // Snout (cylinder)
    const snoutGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.6, 16);
    snoutGeometry.rotateZ(Math.PI / 2);
    const snout = new THREE.Mesh(snoutGeometry, clayMaterial);
    snout.position.set(1.1, 0.2, 0);
    snout.castShadow = true;
    snout.receiveShadow = true;
    gullak.add(snout);
    
    // Coin slot on top
    const slotGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.05);
    const slotMaterial = new THREE.MeshPhongMaterial({ color: 0x2F1B14 });
    const slot = new THREE.Mesh(slotGeometry, slotMaterial);
    slot.position.set(0, 1, 0);
    gullak.add(slot);
    
    // Legs (4 small cylinders)
    const legGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.3, 8);
    const legPositions = [
        [-0.6, -0.95, 0.6],
        [0.6, -0.95, 0.6],
        [-0.6, -0.95, -0.6],
        [0.6, -0.95, -0.6]
    ];
    
    legPositions.forEach((pos) => {
        const leg = new THREE.Mesh(legGeometry, clayMaterial);
        leg.position.set(pos[0], pos[1], pos[2]);
        leg.castShadow = true;
        leg.receiveShadow = true;
        gullak.add(leg);
    });
    
    // Ears (2 small spheres)
    const earGeometry = new THREE.SphereGeometry(0.15, 16, 12);
    const leftEar = new THREE.Mesh(earGeometry, clayMaterial);
    leftEar.position.set(0.8, 0.6, 0.8);
    leftEar.castShadow = true;
    gullak.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, clayMaterial);
    rightEar.position.set(0.8, 0.6, -0.8);
    rightEar.castShadow = true;
    gullak.add(rightEar);
    
    // Eyes (2 small black spheres)
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 6);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(1, 0.4, 0.3);
    gullak.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(1, 0.4, -0.3);
    gullak.add(rightEye);
    
    scene.add(gullak);
    
    // Position camera
    camera.position.set(3, 2, 4);
    camera.lookAt(0, 0, 0);
    
    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    const groundMaterial = new THREE.MeshLambertMaterial({
        color: 0xF5E6D3,
        transparent: true,
        opacity: 0.3
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.3;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Mouse interaction
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    const handleMouseDown = (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
        container.style.cursor = 'grabbing';
    };
    
    const handleMouseMove = (e) => {
        if (isDragging) {
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };
            
            gullak.rotation.y += deltaMove.x * 0.01;
            gullak.rotation.x += deltaMove.y * 0.01;
        }
        previousMousePosition = { x: e.clientX, y: e.clientY };
    };
    
    const handleMouseUp = () => {
        isDragging = false;
        container.style.cursor = 'grab';
    };
    
    // Touch events for mobile
    const handleTouchStart = (e) => {
        isDragging = true;
        const touch = e.touches[0];
        previousMousePosition = { x: touch.clientX, y: touch.clientY };
        e.preventDefault();
    };
    
    const handleTouchMove = (e) => {
        if (isDragging) {
            const touch = e.touches[0];
            const deltaMove = {
                x: touch.clientX - previousMousePosition.x,
                y: touch.clientY - previousMousePosition.y
            };
            
            gullak.rotation.y += deltaMove.x * 0.01;
            gullak.rotation.x += deltaMove.y * 0.01;
            
            previousMousePosition = { x: touch.clientX, y: touch.clientY };
        }
        e.preventDefault();
    };
    
    const handleTouchEnd = () => {
        isDragging = false;
    };
    
    // Add event listeners
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('touchstart', handleTouchStart);
    renderer.domElement.addEventListener('touchmove', handleTouchMove);
    renderer.domElement.addEventListener('touchend', handleTouchEnd);
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Gentle automatic rotation when not dragging
        if (!isDragging) {
            gullak.rotation.y += 0.005;
        }
        
        renderer.render(scene, camera);
    }
    
    animate();
    
    // Handle window resize
    function handleResize() {
        const width = container.offsetWidth;
        const height = container.offsetHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }
    
    window.addEventListener('resize', handleResize);
    
    // Store cleanup function
    container._cleanup = () => {
        renderer.domElement.removeEventListener('mousedown', handleMouseDown);
        renderer.domElement.removeEventListener('mousemove', handleMouseMove);
        renderer.domElement.removeEventListener('mouseup', handleMouseUp);
        renderer.domElement.removeEventListener('touchstart', handleTouchStart);
        renderer.domElement.removeEventListener('touchmove', handleTouchMove);
        renderer.domElement.removeEventListener('touchend', handleTouchEnd);
        window.removeEventListener('resize', handleResize);
        
        // Dispose of Three.js objects
        scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.geometry.dispose();
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        
        renderer.dispose();
        container.removeChild(renderer.domElement);
    };
}

// Animation Functions
function initAnimations() {
    // Add staggered animation delays to cards
    const programCards = document.querySelectorAll('.program-card');
    programCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.2}s`;
    });
    
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.15}s`;
    });
    
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    testimonialCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.2}s`;
    });
}

// Intersection Observer for Animations
function initIntersectionObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements that should animate on scroll
    const animateElements = document.querySelectorAll(
        '.program-card, .feature-card, .testimonial-card, .section-header, .hero-text, .hero-visual'
    );
    
    animateElements.forEach(el => {
        observer.observe(el);
    });
}

// Header Scroll Effect
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 249, 243, 0.98)';
        header.style.backdropFilter = 'blur(20px)';
    } else {
        header.style.background = 'rgba(255, 249, 243, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    }
});

// Button Click Handlers
document.addEventListener('click', function(e) {
    // Handle CTA button clicks
    if (e.target.matches('.btn') || e.target.closest('.btn')) {
        const button = e.target.matches('.btn') ? e.target : e.target.closest('.btn');
        const buttonText = button.textContent.trim();
        
        // Add click animation
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
        
        // Handle different button actions
        if (buttonText.includes('Start Learning') || buttonText.includes('Join for Free')) {
            // This is now handled by the anchor tag in the HTML, but keeping for other buttons.
            console.log('Redirecting to signup...');
        } else if (buttonText.includes('Watch Demo') || buttonText.includes('Schedule Demo')) {
            console.log('Opening demo...');
            // Add your demo logic here
        } else if (buttonText.includes('Take Assessment')) {
            console.log('Starting assessment...');
            // Add your assessment logic here
        } else if (buttonText.includes('Start Chillar Party')) {
            console.log('Starting Chillar Party program...');
            // Add program-specific logic here
        } else if (buttonText.includes('Start Smart Spenders')) {
            console.log('Starting Smart Spenders program...');
            // Add program-specific logic here
        } else if (buttonText.includes('Start Wealth Builders')) {
            console.log('Starting Wealth Builders program...');
            // Add program-specific logic here
        }
    }
});

// Form Validation (if forms are added later)
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Performance Optimization
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading if needed
// lazyLoadImages();

// Error Handling
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    // Cleanup 3D scenes
    const containers = document.querySelectorAll('#threeGullak, #ctaThreeGullak');
    containers.forEach(container => {
        if (container._cleanup) {
            container._cleanup();
        }
    });
});

// Export functions for potential external use
window.GullakWebsite = {
    initMobileMenu,
    initSmoothScrolling,
    init3DGullak,
    createGullak,
    validateEmail,
    debounce
};