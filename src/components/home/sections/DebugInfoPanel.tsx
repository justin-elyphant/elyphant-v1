
import React from "react";

interface DebugInfoPanelProps {
  displayEvent: any;
  validEventDate: boolean;
}

const DebugInfoPanel: React.FC<DebugInfoPanelProps> = ({ displayEvent, validEventDate }) => {
  // Show only in local development
  if (process.env.NODE_ENV !== "development") return null;
  return (
    <div className="mb-6 p-4 rounded-xl border border-dashed border-yellow-400 bg-yellow-100 text-xs text-yellow-900 shadow-inner">
      <div><b>Debug Info</b></div>
      <div><b>displayEvent:</b> {JSON.stringify(displayEvent)}</div>
      <div><b>displayEvent.date:</b> {displayEvent?.date && displayEvent.date.toString ? displayEvent.date.toString() : String(displayEvent?.date)}</div>
      <div><b>validEventDate:</b> {String(validEventDate)}</div>
      <div><b>date.getTime:</b> {displayEvent?.date && displayEvent.date instanceof Date ? displayEvent.date.getTime() : 'n/a'}</div>
      <div><b>now:</b> {Date.now()}</div>
    </div>
  );
};

export default DebugInfoPanel;
