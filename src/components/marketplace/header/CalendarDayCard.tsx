
import React from "react";

interface CalendarDayCardProps {
  date: Date;
  title: React.ReactNode;
  avatarUrl?: string;
  avatarAlt?: string;
  highlightColor?: string; // Optional for differentiated events
  onClick?: () => void;
  children?: React.ReactNode; // Additional details
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
  highlightColor = "#B6A5FF", // purple-ish
  onClick,
  children,
}) => {
  return (
    <button
      type="button"
      className="group relative bg-white shadow-card rounded-xl border border-gray-200 hover:shadow-lg transition p-0 w-full min-w-[118px] max-w-[170px] flex flex-col items-center calendar-tile"
      onClick={onClick}
      tabIndex={0}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {/* Calendar header strip */}
      <div
        className="w-full rounded-t-xl flex items-center justify-center h-7"
        style={{
          background: highlightColor,
          color: "#fff",
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: 1,
        }}
      >
        {getMonthAbbr(date)}
      </div>
      {/* Main content: Day number, avatar */}
      <div className="flex flex-col items-center pt-2 pb-1 px-2 relative" style={{ minHeight: 70 }}>
        <span className="text-2xl font-semibold text-gray-900 leading-none mb-1">{date.getDate()}</span>
        {/* If avatar exists, show as overlapping the day */}
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt={avatarAlt || ""}
            className="rounded-full border-2 border-white shadow absolute -top-5 right-3 w-7 h-7 object-cover z-10 group-hover:scale-105 transition-transform"
            style={{
              boxShadow: "0 2px 8px rgba(120,110,230,0.09)",
            }}
          />
        )}
      </div>
      {/* Title and optional children */}
      <div className="flex flex-col items-center px-2 pb-2 w-full">
        <div className="font-sans text-xs font-semibold text-gray-700 text-center truncate w-full">{title}</div>
        {children}
      </div>
    </button>
  );
};

export default CalendarDayCard;
