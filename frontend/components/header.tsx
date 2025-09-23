"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 0);
    };

    // Call once to set initial state
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        isScrolled
          ? "bg-white/30 backdrop-blur-2xl shadow-xl"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between max-w-7xl px-4 sm:px-6 lg:px-8 bg-transparent">
        {/* Logo - Left aligned */}
        <div className="flex items-center space-x-2">
          <Link href="/" className="block">
            <div className="h-38 w-38 relative">
              <Image
                src="/assets/Asset 1.png"
                alt="Networthy Logo"
                fill
                className="object-contain transition-all duration-500"
                sizes="100%"
              />
            </div>
          </Link>
        </div>

        {/* Navigation - Centered */}
        <nav className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
          <Link
            href="#features"
            className="text-sm font-medium transition-colors text-black hover:text-black/80"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-medium transition-colors text-black hover:text-black/80"
          >
            How it Works
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium transition-colors text-black hover:text-black/80"
          >
            Pricing
          </Link>
          <Link
            href="#about"
            className="text-sm font-medium transition-colors text-black hover:text-black/80"
          >
            About
          </Link>
        </nav>

        {/* CTA Buttons - Right aligned */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            asChild
            className="transition-all duration-500 bg-white/50 text-black border border-white/20 hover:bg-[#71bf49] hover:text-black hover:border-[#71bf49]"
          >
            <Link href="/login">Sign in</Link>
          </Button>
          <Button
            asChild
            className="bg-[#71bf49] text-white hover:bg-[#5fa83a] font-medium border-0 transition-all duration-500"
          >
            <Link href="/register">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
