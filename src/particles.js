// Animated Particle Background Generator

export function initParticleBackground() {
    const container = document.getElementById('particleBackground')
    if (!container) return

    const particleCount = 100

    // Generate particles
    for (let i = 0; i < particleCount; i++) {
        const particleContainer = document.createElement('div')
        particleContainer.className = 'particle-container'

        const particle = document.createElement('div')
        particle.className = 'particle'

        // Random size between 4px and 12px
        const size = Math.floor(Math.random() * 8) + 4
        particleContainer.style.width = `${size}px`
        particleContainer.style.height = `${size}px`

        // Random starting position
        const startX = Math.random() * 100
        const startY = 100 + Math.random() * 10
        const endX = Math.random() * 100
        const endY = -startY - Math.random() * 30

        // Random animation duration between 7s and 11s
        const duration = 7000 + Math.random() * 4000

        // Random animation delay up to 11s
        const delay = Math.random() * 11000

        // Create unique animation
        const animationName = `move-particle-${i}`
        const keyframes = `
      @keyframes ${animationName} {
        from {
          transform: translate3d(${startX}vw, ${startY}vh, 0);
        }
        to {
          transform: translate3d(${endX}vw, ${endY}vh, 0);
        }
      }
    `

        // Add keyframes to document
        const style = document.createElement('style')
        style.textContent = keyframes
        document.head.appendChild(style)

        // Apply animation
        particleContainer.style.animationName = animationName
        particleContainer.style.animationDuration = `${duration}ms`
        particleContainer.style.animationDelay = `${delay}ms`

        // Random particle fade delay
        particle.style.animationDelay = `${Math.random() * 4000}ms`

        particleContainer.appendChild(particle)
        container.appendChild(particleContainer)
    }
}
