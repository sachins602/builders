"use client";

// External libraries
import React, { useState, useEffect } from "react";
import Image from "next/image";

export default function ImageTapper() {
  // State to manage current image index and visibility
  const [current, setCurrent] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [isFirstTimeVisitor, setIsFirstTimeVisitor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is a first-time visitor on component mount
  useEffect(() => {
    const checkFirstTimeVisitor = () => {
      // Check if the cookie exists
      const hasVisited = document.cookie
        .split(";")
        .some((item) => item.trim().startsWith("hasVisitedImageTapper="));

      if (!hasVisited) {
        // Set the cookie to mark as visited (expires in 1 year)
        const expires = new Date();
        expires.setFullYear(expires.getFullYear() + 1);
        document.cookie = `hasVisitedImageTapper=true; expires=${expires.toUTCString()}; path=/`;
        setIsFirstTimeVisitor(true);
      } else {
        // Returning visitor, hide the component
        setHidden(true);
      }
      setIsLoading(false);
    };

    checkFirstTimeVisitor();
  }, []);

  // If loading, show nothing
  if (isLoading) {
    return null;
  }

  // If not first time visitor or hidden, don't render
  if (!isFirstTimeVisitor || hidden) {
    return null;
  }

  // Use default instruction images for first-time visitors
  const instructionImages = [
    "/instructions/image1.png",
    "/instructions/image2.png",
    "/instructions/image3.png",
    "/instructions/image4.png",
  ];

  const instructionTexts = [
    "Start by selecting a parcel.",
    "Choose whether to generate a new image or work off a community member's work",
    "Generate an image with the chat prompt to envision medium density housing in your community.",
    "Share your creations with the community, local government, and your friends!",
  ];

  // Render the instruction overlay for first-time visitors
  return (
    <div
      className="fixed inset-0 z-50 flex h-full w-full items-center justify-center bg-white"
      onClick={async () => {
        if (current < instructionImages.length - 1) {
          const covering = document.getElementById("covering-id");
          if (covering) {
            covering.style.transition = "opacity 300ms";
            covering.style.opacity = "1";
            await new Promise((res) => setTimeout(res, 300));
          }
          setCurrent((prev) => prev + 1);
          if (covering) {
            covering.style.opacity = "0";
          }
        } else {
          setHidden(true);
        }
      }}
    >
      {/* Covering div */}
      <div
        className="pointer-events-none absolute inset-0 z-10 bg-white opacity-0 transition-opacity duration-300"
        id="covering-id"
      />
      {/* Display the current instruction text */}
      <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2 transform text-center text-3xl text-gray-800">
      <h1 className="text-4xl font-bold text-center">Welcome to Our Missing Middle</h1>
        <p>{instructionTexts[current]}</p>
      </div>

      {/* Render the current instruction image */}
      <div className="relative flex items-center justify-center w-full h-full">
        {instructionImages[current] && (
          <div
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              src={instructionImages[current]}
              alt={`Instruction ${current + 1}`}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                width: "auto",
                height: "auto",
              }}
              className="object-contain"
              draggable={false}
              width={600} // set to your actual image width
              height={400} // set to your actual image height
              priority
            />
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 transform text-xl">
        <button
          className="rounded bg-white px-4 py-2 text-black"
          onClick={(e) => {
            e.stopPropagation();
            setHidden(true);
          }}
        >
          {current === instructionImages.length - 1
            ? "Let's get started!"
            : "Tap to continue"}
        </button>
      </div>
    </div>
  );
}
