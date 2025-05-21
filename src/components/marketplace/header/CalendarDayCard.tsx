
import React from "react";

interface CalendarDayCardProps {
  date: Date;
  title: React.ReactNode;
  avatarUrl?: string;
  avatarAlt?: string;
  highlightColor?: string; // Can be used for a tiny accent dot if needed
  onClick?: () => void;
  children?: React.ReactNode; // Additional details if any
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
  highlightColor = "#D1D5DB", // fallback for tiny indicator if needed
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
      style={{ cursor: onClick ? "pointer" : "default", background: "#fff" }}
    >
      {/* Large, floating avatar */}
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt={avatarAlt || ""}
          className="
            absolute -top-7 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-2 border-white shadow 
            object-cover z-20 group-hover:scale-105 transition-transform
            bg-gray-100
          "
          style={{
            boxShadow: "0 2px 8px rgba(40,40,60,0.10)",
          }}
        />
      )}

      {/* Main content block */}
      <div
        className={`flex flex-col items-center pt-6 pb-2 px-2 relative w-full`}
        style={{ minHeight: 84 }}
      >
        {/* Month in muted uppercaps */}
        <span className="text-[11px] text-gray-400 font-semibold tracking-wide mb-0.5" style={{ letterSpacing: 1 }}>
          {getMonthAbbr(date)}
        </span>
        {/* Day number, big */}
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
