"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { useState } from "react";
import { Menu, X } from "lucide-react";

interface HeaderProps {}

const Header = ({}: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Beranda", href: "#beranda" },
    { name: "Fitur", href: "#fitur" },
    { name: "Tentang", href: "#tentang" },
    { name: "Kontak", href: "#kontak" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b-2 bg-slate-950 border-b-primary">
      <div className="absolute inset-0 pointer-events-none" />

      <nav className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="shrink-0 group tracking-wider cursor-pointer font-headline font-bold text-4xl text-primary">
            <Link href="/">Khidmat</Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link, index) => (
              <a
                key={link.name}
                href={link.href}
                className="relative px-4 py-2 text-primary hover:underline"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="relative z-10 font-medium tracking-wide text-sm">
                  {link.name}
                </span>
                <div className="absolute inset-0 bg-amber-500/10 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-200" />
              </a>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Button variant="outline">Login</Button>
            <Button className="">Daftar</Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-primary"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 backdrop-blur-md border-t border-primary border-b shadow-xl">
            <div className="px-4 py-6 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block px-4 py-3 text-primary font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 space-y-3 border-t border-white">
                <Button variant="outline" className="w-full font-medium">
                  Login
                </Button>
                <Button className="w-full">Daftar</Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
