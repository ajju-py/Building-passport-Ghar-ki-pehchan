import React from "react";
import Image from "next/image";
import Link from "next/link";

interface BuildingPassportLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textClassName?: string;
  subtitle?: boolean;
  href?: string;
  priority?: boolean;
}

export const BuildingPassportLogo: React.FC<BuildingPassportLogoProps> = ({
  size = 40,
  className = "",
  showText = true,
  textClassName = "",
  subtitle = true,
  href,
  priority = false,
}) => {
  const content = (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div
        className="relative shrink-0 flex items-center justify-center rounded-full overflow-hidden shadow-sm ring-1 ring-emerald-500/20 bg-white"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo/building-passport.png"
          alt="Verified Building Passport - Ghar Ki Pehchan Official Logo"
          width={size}
          height={size}
          priority={priority}
          className="w-full h-full object-contain"
        />
      </div>

      {showText && (
        <div className={`flex flex-col leading-tight ${textClassName}`}>
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-tight text-slate-900 dark:text-white text-base">
              Building Passport
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Verified
            </span>
          </div>
          {subtitle && (
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              घर की पहचान • National Civil Registry
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center group transition hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
};

export default BuildingPassportLogo;
