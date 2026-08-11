import React from "react";
import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/BrandLogo";

export function HomeFooter() {
  return (
    <footer className="py-16 bg-transparent text-foreground border-t border-border/40 mt-auto">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <BrandLogo size="md" />
          <p className="text-xs text-muted-foreground">
            © 2026 Hackord. The real-time workspace for hackathon teams and developers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground justify-center">
          <Link to="/explore" className="hover:text-foreground transition-colors">Explore</Link>
          <Link to="/contact" className="hover:text-foreground font-medium text-foreground transition-colors">Contact Us</Link>
          <Link to="/privacy" className="hover:text-foreground font-medium text-foreground transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-foreground font-medium text-foreground transition-colors">Terms of Service</Link>
          {/* <Link to="/cookie-policy" className="hover:text-foreground transition-colors">Cookie Policy</Link> */}
          {/* <a href="#" className="termly-display-preferences hover:text-foreground transition-colors">Consent Preferences</a> */}
        </div>
      </div>
    </footer>
  );
}
