import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_ROLES = ["Hackers", "Developers", "Builders", "Students", "Designers"];

export function AnimatedRole({ 
  roles = DEFAULT_ROLES,
  className 
}: { 
  roles?: string[];
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [blink, setBlink] = useState(true);

  // Blinking cursor
  useEffect(() => {
    const timeout = setInterval(() => {
      setBlink((prev) => !prev);
    }, 500);
    return () => clearInterval(timeout);
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (subIndex === roles[index].length + 1 && !reverse) {
      // Pause at the end of typing before reversing
      const timeout = setTimeout(() => setReverse(true), 1500);
      return () => clearTimeout(timeout);
    }

    if (subIndex === 0 && reverse) {
      // Pause when fully deleted before moving to the next word
      setReverse(false);
      setIndex((prev) => (prev + 1) % roles.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, Math.max(reverse ? 50 : 100, Math.random() * 150)); // typing speed

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, roles]);

  return (
    <span className={cn("inline-flex items-center", className)}>
      <span className="bg-gradient-brand bg-clip-text text-transparent transition-all">
        {roles[index].substring(0, subIndex)}
      </span>
      <span
        className={cn(
          "ml-0.5 inline-block w-[3px] bg-primary h-[0.9em]",
          blink ? "opacity-100" : "opacity-0"
        )}
      />
    </span>
  );
}
