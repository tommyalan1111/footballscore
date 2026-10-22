import { useMemo, useState } from "react";
import { addDays, formatWeekdayShort, toDateKey } from "../dates";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";

interface Props {
  selectedKey: string;
  onSelect: (key: string) => void;
}

const WINDOW_DAYS = 9;
const STEP_DAYS = 7;

export function DateStrip({ selectedKey, onSelect }: Props) {
  const [offset, setOffset] = useState(0);
  const todayKey = toDateKey(new Date());

  const days = useMemo(() => {
    const start = addDays(new Date(), -Math.floor(WINDOW_DAYS / 2) + offset * STEP_DAYS);
    return Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(start, i));
    // Rebuild at midnight so "Today" stays correct.
  }, [offset, todayKey]);

  return (
    <div className="datestrip">
      <button
        type="button"
        className="strip-arrow"
        onClick={() => setOffset((o) => o - 1)}
        aria-label="Previous week"
        title="Previous week"
      >
        <ChevronLeftIcon size={16} />
      </button>

      <div className="strip-days" role="group" aria-label="Choose a day">
        {days.map((day) => {
          const key = toDateKey(day);
          const active = key === selectedKey;
          const isToday = key === todayKey;
          const weekday = isToday ? "Today" : formatWeekdayShort(day);
          const full = day.toLocaleDateString([], {
            weekday: "long",
            day: "numeric",
            month: "long",
          });

          return (
            <button
              type="button"
              key={key}
              className={`daychip${isToday ? " is-today" : ""}`}
              aria-pressed={active}
              aria-label={full}
              title={full}
              onClick={() => onSelect(key)}
            >
              <span className="daychip-weekday">{weekday}</span>
              <span className="daychip-day">{day.getDate()}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="strip-arrow"
        onClick={() => setOffset((o) => o + 1)}
        aria-label="Next week"
        title="Next week"
      >
        <ChevronRightIcon size={16} />
      </button>
    </div>
  );
}
