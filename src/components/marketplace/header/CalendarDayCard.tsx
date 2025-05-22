
import React from "react";
import type { LucideIcon } from "lucide-react";

interface CalendarDayCardProps {
  date: Date;
  title: React.ReactNode;
  avatarUrl?: string;
  avatarAlt?: string;
  icon?: LucideIcon;
  highlightColor?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

function getMonthAbbr(date: Date) {
  return date
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
}

const CalendarDayCard: React.FC<CalendarDayCardProps> = ({
  date,
  title,
  avatarUrl,
  avatarAlt,
  icon,
  highlightColor = "#D1D5DB",
  onClick,
  children,
}) => {
  return (
    <button
      type="button"
      className="
        group relative bg-white rounded-xl border border-gray-200 
        hover:shadow-lg transition p-0 w-full min-w-[118px] max-w-[170px] flex flex-col items-center calendar-tile
        shadow-subtle
      "
      onClick={onClick}
      tabIndex={0}
      style={{
        cursor: onClick ? "pointer" : "default",
        background: "#fff",
        minHeight: 152, // increase to fit avatar/icon visibly
        height: "auto",
        overflow: "visible", // ensures child absolute elements (avatar/icon) are visible
        position: "relative", // for correct absolute positioning
      }}
    >
      {/* Avatar for friend events or icon for non-friend events */}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={avatarAlt || ""}
          className="
            absolute -top-10 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full border-2 border-white shadow 
            object-cover z-20 group-hover:scale-105 transition-transform
            bg-gray-100
          "
          style={{
            boxShadow: "0 2px 8px rgba(40,40,60,0.10)",
          }}
        />
      ) : icon ? (
        <div
          className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 border-2 border-white shadow z-20"
          style={{
            boxShadow: "0 2px 8px rgba(40,40,60,0.10)",
          }}
        >
          {React.createElement(icon, { size: 32, color: "#8E9196" })}
        </div>
      ) : null}

      {/* Main content block */}
      <div
        className={`flex flex-col items-center pt-12 pb-2 px-2 relative w-full`}
        style={{ minHeight: 60 }}
      >
        <span className="text-[11px] text-gray-400 font-semibold tracking-wide mb-0.5" style={{ letterSpacing: 1 }}>
          {getMonthAbbr(date)}
        </span>
        <span className="text-2xl md:text-3xl font-bold text-gray-900 leading-none mb-1">{date.getDate()}</span>
      </div>
      {/* Tiny accent dot for occasion type, if color is set and NOT default */}
      {highlightColor && highlightColor !== "#D1D5DB" && (
        <span
          className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full"
          style={{ background: highlightColor }}
        />
      )}
      {/* Title and optional children */}
      <div className="flex flex-col items-center px-2 pb-2 w-full">
        <div className="font-sans text-xs font-semibold text-gray-600 text-center truncate w-full">{title}</div>
        {children}
      </div>
    </button>
  );
};

export default CalendarDayCard;
