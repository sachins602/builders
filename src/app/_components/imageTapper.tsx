"use client";

// External libraries
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Internal modules
import { auth } from "~/server/auth";

interface ImageTapperProps {
    images: string[] | string;
    text: string[] | string | undefined;
}

export default function ImageTapper({ images, text }: ImageTapperProps) {

    // Ensure images is an array
    if (typeof images === "string") {
        images = [images];
    }

    // Ensure text is an array
    if (typeof text === "string") {
        text = [text];
    }

    // If text is undefined, default to an empty string array
    if (!text || !Array.isArray(text)) {
        text = [];
    }

    // State to manage current image index and visibility
    const [current, setCurrent] = useState(0);
    const [hidden, setHidden] = useState(false);

    // Check if images is empty or not an array
    if ((images.length === 0) || !images) {
        return (
            <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-black">
                <p className="text-white">No images available</p>
            </div>
        );
    }

    // If hidden, return null to not render the component
    if (hidden) return null;

    // Render the image tapper component
    // Clicking on the image will cycle through the images or hide the component if at the end
    return (
        <div
            className="fixed inset-0 w-full h-full flex items-center justify-center bg-white"
            onClick={async () => {
            if (current < images.length - 1) {
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
            }}>
            {/* Covering div */}
            <div
            className="absolute inset-0 bg-white opacity-0 z-10 transition-opacity duration-300 pointer-events-none"
            id="covering-id"
            />

            {/* Display the current text */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-gray-800 z-10 text-3xl">
                {text[current] ?? `Instruction ${current + 1}`}
            </div>

            {/* Render the current image */}
            {typeof images[current] === "string" && (
            <Image
                src={images[current]}
                alt={`Instruction ${current + 1}`}
                className="w-full h-full object-contain"
                draggable={false}
                fill
                sizes="100vw"
                priority
            />
            )}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xl">
            <button
                className="bg-white text-black px-4 py-2 rounded"
                onClick={(e) => {
                    e.stopPropagation();
                    setHidden(true);
                }}
            >
                {current === images.length - 1 ? "let's get started!" : "tap to continue"}
            </button>
            </div>
        </div>
    );
}