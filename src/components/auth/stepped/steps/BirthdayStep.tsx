import React, { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import StepLayout from "../StepLayout";
import { ChevronDown } from "lucide-react";

interface BirthdayStepProps {
  birthday: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const BirthdayStep: React.FC<BirthdayStepProps> = ({
  birthday,
  onChange,
  onNext,
  onBack,
  stepIndex,
  totalSteps,
}) => {
  const [showWhy, setShowWhy] = useState(false);

  // Parse existing birthday string into parts
  const { month, day, year } = useMemo(() => {
    if (birthday) {
      const [y, m, d] = birthday.split("-");
      if (y && m && d) return { year: y, month: m, day: d };
    }
    return { year: "", month: "", day: "" };
  }, [birthday]);

  const currentYear = new Date().getFullYear();

  const years = useMemo(() => {
    const arr: string[] = [];
    for (let y = currentYear; y >= 1920; y--) arr.push(String(y));
    return arr;
  }, [currentYear]);

  const daysInMonth = useMemo(() => {
    if (!month || !year) return 31;
    return new Date(parseInt(year), parseInt(month), 0).getDate();
  }, [month, year]);

  const days = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, "0"));
  }, [daysInMonth]);

  const handleChange = (part: "month" | "day" | "year", val: string) => {
    let m = month, d = day, y = year;
    if (part === "month") m = val;
    if (part === "day") d = val;
    if (part === "year") y = val;

    // Adjust day if it exceeds days in new month/year
    if (m && y && d) {
      const maxDays = new Date(parseInt(y), parseInt(m), 0).getDate();
      if (parseInt(d) > maxDays) d = String(maxDays).padStart(2, "0");
    }

    if (m && d && y) {
      onChange(`${y}-${m}-${d}`);
    } else {
      // Partial — store what we can so re-renders keep selections
      const partial = `${y || "0000"}-${m || "00"}-${d || "00"}`;
      onChange(partial);
    }
  };

  const isValid = useMemo(() => {
    if (!birthday) return false;
    const date = new Date(birthday);
    if (isNaN(date.getTime())) return false;
    const yr = date.getFullYear();
    return yr >= 1920 && yr <= currentYear;
  }, [birthday, currentYear]);

  const selectClass =
    "h-12 w-full rounded-lg border border-input bg-background px-3 text-base appearance-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

  return (
    <StepLayout
      heading="When's your birthday?"
      subtitle="Your friends will be reminded to get you something great"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!isValid}
      stepIndex={stepIndex}
      totalSteps={totalSteps}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Date of birth</Label>
          <div className="grid grid-cols-[1.4fr_0.8fr_1fr] gap-2">
            {/* Month */}
            <select
              value={month}
              onChange={(e) => handleChange("month", e.target.value)}
              className={selectClass}
            >
              <option value="" disabled>Month</option>
              {MONTHS.map((name, i) => (
                <option key={name} value={String(i + 1).padStart(2, "0")}>
                  {name}
                </option>
              ))}
            </select>

            {/* Day */}
            <select
              value={day}
              onChange={(e) => handleChange("day", e.target.value)}
              className={selectClass}
            >
              <option value="" disabled>Day</option>
              {days.map((d) => (
                <option key={d} value={d}>{parseInt(d)}</option>
              ))}
            </select>

            {/* Year */}
            <select
              value={year}
              onChange={(e) => handleChange("year", e.target.value)}
              className={selectClass}
            >
              <option value="" disabled>Year</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowWhy(!showWhy)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showWhy ? "rotate-180" : ""}`}
          />
          Why do we need this?
        </button>

        {showWhy && (
          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            Your birthday helps us remind your connections to pick out the
            perfect gift. We'll never share your exact age — only the date is
            visible to friends you approve.
          </p>
        )}
      </div>
    </StepLayout>
  );
};

export default BirthdayStep;
