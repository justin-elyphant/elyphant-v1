
import React from "react";
import type { LucideIcon } from "lucide-react";
import { Gift, GraduationCap } from "lucide-react";

// Used for both friend occasions & holidays
interface OccasionListItemProps {
  date: Date;
  avatarUrl?: string;
  avatarAlt?: string;
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  highlightColor?: string;
  onClick?: () => void;
}

function getMonthAbbr(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
}

export const OccasionListItem: React.FC<OccasionListItemProps> = ({
  date,
  avatarUrl,
  avatarAlt,
  icon,
  title,
  subtitle,
  highlightColor = "#D1D5DB",
  onClick
}) => {
  return (
    <button
      className={`
        group flex items-center gap-4 w-full px-2 py-2 rounded-lg
        bg-white border border-gray-100 shadow-sm transition 
        hover:shadow-md hover:bg-gray-50 focus:outline-none
        active:bg-gray-100
      `}
      style={{ cursor: onClick ? "pointer" : "default" }}
      type="button"
      onClick={onClick}
      tabIndex={0}
    >
      {/* Date badge */}
      <div className="flex flex-col items-center justify-center min-w-[48px]">
        <div
          className="rounded-full flex flex-col items-center justify-center w-12 h-12 border-2"
          style={{
            borderColor: highlightColor,
            background: "#f6f5fe",
            color: "#2d246f"
          }}
        >
          <span className="text-[11px] font-semibold mb-1" style={{ color: highlightColor }}>
            {getMonthAbbr(date)}
          </span>
          <span className="text-lg font-bold text-gray-900 leading-none">{date.getDate()}</span>
        </div>
      </div>

      {/* Avatar or icon */}
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center relative">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={avatarAlt || ""}
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow bg-gray-100 z-10"
            style={{ boxShadow: "0 2px 8px rgba(40,40,60,0.10)" }}
          />
        ) : icon ? (
          <div
            className="w-12 h-12 rounded-full bg-gray-100 border-2 border-white shadow flex items-center justify-center"
            style={{ boxShadow: "0 2px 8px rgba(40,40,60,0.10)" }}
          >
            {React.createElement(icon, { size: 28, color: "#8E9196" })}
          </div>
        ) : null}
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-grow text-left truncate">
        <span className="font-sans text-[15px] font-semibold text-gray-700 truncate">{title}</span>
        {subtitle && (
          <span className="text-xs text-gray-400 font-normal truncate">{subtitle}</span>
        )}
      </div>
    </button>
  );
};

export default OccasionListItem;
