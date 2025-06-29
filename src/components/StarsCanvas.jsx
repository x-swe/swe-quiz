"use client";

import { useEffect, useRef } from "react";

export default function StarsCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Star class
    class Star {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 1.5;
        this.brightness = Math.random() * 0.5 + 0.5;
        this.velocity = {
          x: (Math.random() - 0.5) * 0.05, // Slow movement
          y: (Math.random() - 0.5) * 0.05,
        };
        this.twinkleSpeed = Math.random() * 0.01 + 0.005; // Slower twinkling
        this.twinklePhase = Math.random() * Math.PI * 2;
      }

      update() {
        // Move star
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Wrap around canvas edges
        if (this.x < 0) this.x += canvas.width;
        if (this.x > canvas.width) this.x -= canvas.width;
        if (this.y < 0) this.y += canvas.height;
        if (this.y > canvas.height) this.y -= canvas.height;

        // Calculate twinkling
        this.brightness = 0.5 + 0.5 * Math.sin(this.twinklePhase);
        this.twinklePhase += this.twinkleSpeed;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.brightness})`;
        ctx.fill();
      }
    }

    // Create stars
    const stars = Array.from({ length: 200 }, () => new Star());

    // Animation loop
    const animate = () => {
      // Clear canvas
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw stars
      stars.forEach((star) => {
        star.update();
        star.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
      }}
    />
  );
}
