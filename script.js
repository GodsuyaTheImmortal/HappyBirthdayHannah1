document.addEventListener("DOMContentLoaded", () => {
  // Variables to store dimensions
  let rectWidth;
  let rectHeight;
  let offsetX;
  let offsetY;
  let particles = [];
  let animationPhase = 'moveToTarget';
  let animCanvas;
  let animCtx;
  let animationCompleted = false; // Flag to track if animation is completed
  let isAnimating = false; // Flag to track if animation is currently running

  // Particle settings
  let particleSize = 4; // You can adjust this
  let particleSpacing = 6; // You can adjust this

  // Video aspect ratio (width / height)
  const videoAspectRatio = 16 / 9; // Adjust according to your video's aspect ratio

  function initialize() {
    console.log('initialize() called');

    // Calculate rectangle dimensions based on viewport size while maintaining video aspect ratio
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Choose the smaller dimension to fit the rectangle within the viewport
    if (viewportWidth / viewportHeight > videoAspectRatio) {
      // Viewport is wider than the video aspect ratio
      rectHeight = viewportHeight * 0.5; // Adjust the multiplier as needed
      rectWidth = rectHeight * videoAspectRatio;
    } else {
      // Viewport is narrower than the video aspect ratio
      rectWidth = viewportWidth * 0.8; // Adjust the multiplier as needed
      rectHeight = rectWidth / videoAspectRatio;
    }

    // Center the rectangle
    offsetX = (viewportWidth - rectWidth) / 2;
    offsetY = (viewportHeight - rectHeight) / 2 - viewportHeight * 0.1; // Adjust to move up/down

    // Adjust particle size and spacing based on rectangle size
    particleSize = Math.max(2, rectWidth / 200); // Adjust divisor as needed
    particleSpacing = particleSize * 1.5; // Spacing relative to particle size

    // Adjust canvas size
    if (animCanvas) {
      animCanvas.width = viewportWidth;
      animCanvas.height = viewportHeight;
    } else {
      // Initialize canvas only if it doesn't exist
      animCanvas = document.createElement('canvas');
      animCanvas.width = viewportWidth;
      animCanvas.height = viewportHeight;
      animCanvas.style.position = 'absolute';
      animCanvas.style.top = '0';
      animCanvas.style.left = '0';
      animCanvas.style.zIndex = '1';
      animCanvas.style.pointerEvents = 'none'; // Allow clicks to pass through
      document.body.appendChild(animCanvas);

      animCtx = animCanvas.getContext('2d');
    }

    if (!animationCompleted) {
      if (!isAnimating) {
        // Reset particles only if animation hasn't started yet
        // Clear existing particles
        particles = [];

        // Generate particles positioned in a grid forming the rectangle
        const cols = Math.floor(rectWidth / particleSpacing);
        const rows = Math.floor(rectHeight / particleSpacing);

        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const xPos = x * particleSpacing + offsetX;
            const yPos = y * particleSpacing + offsetY;
            particles.push({
              x: Math.random() * viewportWidth,          // Random starting X
              y: -Math.random() * viewportHeight * 0.2 - particleSize, // Start above the screen
              xTarget: xPos,
              yTarget: yPos,
              speed: 0.02 + Math.random() * 0.03,      // Increased movement speed
              opacity: 1,                                // Initial opacity
            });
          }
        }

        // Reset animationPhase to 'moveToTarget'
        animationPhase = 'moveToTarget';

        // Start the animation
        isAnimating = true;
        animate();
      } else {
        // Animation is running, adjust target positions if needed
        particles.forEach(p => {
          // Adjust target positions based on new dimensions
          const relativeX = (p.xTarget - offsetX) / rectWidth;
          const relativeY = (p.yTarget - offsetY) / rectHeight;
          p.xTarget = offsetX + relativeX * rectWidth;
          p.yTarget = offsetY + relativeY * rectHeight;
        });
      }
    } else {
      // Animation has completed, adjust video size if needed
      resizeVideo();
    }
  }

  function animate() {
    animCtx.clearRect(0, 0, animCanvas.width, animCanvas.height);

    let allAtTarget = true;

    particles.forEach(p => {
      if (animationPhase === 'moveToTarget') {
        // Move particles towards their target positions
        const dx = p.xTarget - p.x;
        const dy = p.yTarget - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
          p.x += dx * p.speed;
          p.y += dy * p.speed;
          allAtTarget = false;
        } else {
          p.x = p.xTarget;
          p.y = p.yTarget;
        }
      } else if (animationPhase === 'fadeOut') {
        // Fade out the particles
        p.opacity -= 0.02; // Increased fade-out speed
        if (p.opacity < 0) p.opacity = 0;
      }

      // Draw the particle
      animCtx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
      animCtx.beginPath();
      animCtx.arc(p.x, p.y, particleSize / 2, 0, Math.PI * 2);
      animCtx.fill();
    });

    if (animationPhase === 'moveToTarget' && allAtTarget) {
      // Start fading out after particles reach their targets
      animationPhase = 'fadeOut';
    } else if (animationPhase === 'fadeOut') {
      // Check if all particles have faded out
      const allFaded = particles.every(p => p.opacity === 0);
      if (allFaded) {
        animationCompleted = true; // Set flag to true
        isAnimating = false; // Animation has completed
        showVideo(); // Display the video
        return;      // Stop the animation
      }
    }

    requestAnimationFrame(animate);
  }

  // Function to display the video after particles fade out
  function showVideo() {
    // Remove existing video container if it exists
    const existingVideoContainer = document.querySelector('#video-container');
    if (existingVideoContainer) {
      existingVideoContainer.remove();
    }

    // Create the video element
    const video = document.createElement('video');
    video.src = '02112024.mp4'; // Replace with your video path
    video.loop = true;
    video.muted = false; // We want sound
    video.style.position = 'absolute';
    video.style.objectFit = 'cover';
    video.style.zIndex = '2'; // Above the canvas
    video.style.width = `${rectWidth}px`;
    video.style.height = `${rectHeight}px`;
    video.style.left = '0';
    video.style.top = '0';

    // Add playsinline attribute
    video.setAttribute('playsinline', '');

    // Create a container for video and buttons
    const videoContainer = document.createElement('div');
    videoContainer.id = 'video-container'; // Added an ID for easier reference
    videoContainer.style.position = 'absolute';
    videoContainer.style.left = `${offsetX}px`;
    videoContainer.style.top = `${offsetY}px`;
    videoContainer.style.width = `${rectWidth}px`;
    videoContainer.style.height = `${rectHeight}px`;
    videoContainer.style.zIndex = '2';
    videoContainer.appendChild(video);

    // Add a play button overlay
    const playButton = document.createElement('button');
    playButton.id = 'play-button';
    playButton.innerText = 'Play';
    playButton.style.position = 'absolute';
    playButton.style.top = '50%';
    playButton.style.left = '50%';
    playButton.style.transform = 'translate(-50%, -50%)';
    playButton.style.zIndex = '3';
    playButton.style.padding = '10px 20px';
    playButton.style.fontSize = '16px';
    playButton.style.cursor = 'pointer';
    playButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    playButton.style.color = '#fff';
    playButton.style.border = 'none';
    playButton.style.borderRadius = '5px';

    // Add event listener to the play button
    playButton.addEventListener('click', (event) => {
      event.stopPropagation();
      video.play();
      playButton.style.display = 'none'; // Hide the play button
    });

    videoContainer.appendChild(playButton);

    // Add a full-screen button overlay
    const fsButton = document.createElement('button');
    fsButton.innerText = 'Full Screen';
    fsButton.style.position = 'absolute';
    fsButton.style.bottom = '10px';
    fsButton.style.right = '10px';
    fsButton.style.zIndex = '3';

    // Adjust button size based on device
    if (isMobileDevice()) {
      fsButton.style.padding = '5px 10px'; // Reduced padding for mobile
      fsButton.style.fontSize = '12px';    // Reduced font size for mobile
    } else {
      fsButton.style.padding = '10px 20px';
      fsButton.style.fontSize = '16px';
    }

    fsButton.style.cursor = 'pointer';
    fsButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    fsButton.style.color = '#fff';
    fsButton.style.border = 'none';
    fsButton.style.borderRadius = '5px';

    // Add event listener to the full-screen button
    fsButton.addEventListener('click', () => {
      openFullscreen(video);
    });

    videoContainer.appendChild(fsButton);
    document.body.appendChild(videoContainer);

    // Adjust video size on window resize
    if (!resizeListenerAdded) {
      // Debounce the resize event
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          resizeVideo();
        }, 100); // Adjust the timeout as needed
      });
      resizeListenerAdded = true;
    }
  }

  function updateDimensions() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Recalculate rectangle dimensions
    if (viewportWidth / viewportHeight > videoAspectRatio) {
      rectHeight = viewportHeight * 0.5;
      rectWidth = rectHeight * videoAspectRatio;
    } else {
      rectWidth = viewportWidth * 0.8;
      rectHeight = rectWidth / videoAspectRatio;
    }

    offsetX = (viewportWidth - rectWidth) / 2;
    offsetY = (viewportHeight - rectHeight) / 2 - viewportHeight * 0.1;

    // Adjust canvas size
    if (animCanvas) {
      animCanvas.width = viewportWidth;
      animCanvas.height = viewportHeight;
    }
  }

  function resizeVideo() {
    updateDimensions();
    const videoContainer = document.querySelector('#video-container');
    if (videoContainer) {
      const video = videoContainer.querySelector('video');
      videoContainer.style.left = `${offsetX}px`;
      videoContainer.style.top = `${offsetY}px`;
      videoContainer.style.width = `${rectWidth}px`;
      videoContainer.style.height = `${rectHeight}px`;

      video.style.width = `${rectWidth}px`;
      video.style.height = `${rectHeight}px`;
    }
  }

  function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  function openFullscreen(elem) {
    // Rotate the video on mobile devices when entering full-screen mode
    if (isMobileDevice()) {
      elem.classList.add('rotate-video');
    }

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
      elem.msRequestFullscreen();
    }

    // Add event listener to reset rotation when exiting full-screen
    document.addEventListener('fullscreenchange', handleFullscreenChange, { once: true });
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange, { once: true });
  }

  function handleFullscreenChange() {
    const videoElement = document.querySelector('#video-container video');

    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      // Exited full-screen mode
      if (isMobileDevice() && videoElement) {
        // Reset the video rotation
        videoElement.classList.remove('rotate-video');
      }
    }
  }

  // Flag to ensure resize listener is added only once
  let resizeListenerAdded = false;

  // Re-enable the resize event listener for the animation
  window.addEventListener('resize', () => {
    initialize(); // Re-initialize the animation
  });

  // Start the initial animation
  initialize();
});
