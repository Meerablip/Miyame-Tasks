"use client";

import React, { useState, useRef, useEffect } from "react";

interface CustomTimePickerProps {
  value: string; // Format "HH:mm"
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function CustomTimePicker({
  value,
  onChange,
  placeholder = "Select time",
  className = "",
  style,
}: CustomTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse internal 24h value to 12h representation for UI
  const parseTime = (timeStr: string) => {
    if (!timeStr) return { h: 12, m: 0, pm: false };
    const [h, m] = timeStr.split(":").map(Number);
    return {
      h: h % 12 === 0 ? 12 : h % 12,
      m: m || 0,
      pm: h >= 12,
    };
  };

  const initialParsed = parseTime(value);
  const [hour, setHour] = useState(initialParsed.h);
  const [minute, setMinute] = useState(initialParsed.m);
  const [isPM, setIsPM] = useState(initialParsed.pm);

  // Update local state when value prop changes externally
  useEffect(() => {
    const parsed = parseTime(value);
    setHour(parsed.h);
    setMinute(parsed.m);
    setIsPM(parsed.pm);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format local state back to "HH:mm" to call onChange
  const applyTime = (h: number, m: number, pm: boolean) => {
    let hour24 = h;
    if (pm && h < 12) hour24 += 12;
    if (!pm && h === 12) hour24 = 0;
    
    const hStr = hour24.toString().padStart(2, "0");
    const mStr = m.toString().padStart(2, "0");
    onChange(`${hStr}:${mStr}`);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i); // 0 to 59

  // Calculate display string
  const displayString = value 
    ? `${hour}:${minute.toString().padStart(2, "0")} ${isPM ? "PM" : "AM"}`
    : "";

  return (
    <div
      className={`custom-time-container ${className}`}
      style={style}
      ref={containerRef}
    >
      <div
        className={`custom-time-trigger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
      >
        <span className={displayString ? "selected-text" : "placeholder-text"}>
          {displayString || placeholder}
        </span>
        <svg
          className="custom-time-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>

      {isOpen && (
        <div className="custom-time-dropdown">
          <div className="picker-columns">
            {/* Hours */}
            <div className="picker-column">
              {hours.map((h) => (
                <div
                  key={`h-${h}`}
                  className={`picker-item ${h === hour ? "active" : ""}`}
                  onClick={() => {
                    setHour(h);
                    applyTime(h, minute, isPM);
                  }}
                >
                  {h}
                </div>
              ))}
            </div>

            {/* Minutes */}
            <div className="picker-column">
              {minutes.map((m) => (
                <div
                  key={`m-${m}`}
                  className={`picker-item ${m === minute ? "active" : ""}`}
                  onClick={() => {
                    setMinute(m);
                    applyTime(hour, m, isPM);
                  }}
                >
                  {m.toString().padStart(2, "0")}
                </div>
              ))}
            </div>

            {/* AM/PM */}
            <div className="picker-column am-pm-column">
              <div
                className={`picker-item ${!isPM ? "active" : ""}`}
                onClick={() => {
                  setIsPM(false);
                  applyTime(hour, minute, false);
                }}
              >
                AM
              </div>
              <div
                className={`picker-item ${isPM ? "active" : ""}`}
                onClick={() => {
                  setIsPM(true);
                  applyTime(hour, minute, true);
                }}
              >
                PM
              </div>
            </div>
          </div>
          
          <div className="picker-footer">
            <button
              type="button"
              className="picker-btn clear-btn"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="picker-btn done-btn"
              onClick={() => setIsOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-time-container {
          position: relative;
          width: 100%;
          font-family: inherit;
        }
        .custom-time-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          min-height: 44px;
          padding: 0.5rem 1rem;
          background: var(--card-bg);
          border: 1px solid var(--input-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
          color: var(--text-main);
          font-size: 0.95rem;
        }
        .custom-time-trigger:hover {
          border-color: var(--primary);
        }
        .custom-time-trigger:focus-visible {
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
          border-color: var(--primary);
        }
        .custom-time-trigger.open {
          border-color: var(--primary);
          border-bottom-left-radius: 4px;
          border-bottom-right-radius: 4px;
        }
        .placeholder-text {
          color: var(--text-muted);
        }
        .selected-text {
          color: var(--text-main);
          font-weight: 500;
        }
        .custom-time-icon {
          color: var(--text-muted);
        }
        .custom-time-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: var(--card-bg);
          border: 1px solid var(--input-border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-md);
          z-index: 999;
          overflow: hidden;
          animation: slideDown 0.15s cubic-bezier(0.16, 1, 0.3, 1);
          min-width: 200px;
        }
        .picker-columns {
          display: flex;
          height: 200px;
          border-bottom: 1px solid var(--input-border);
        }
        .picker-column {
          flex: 1;
          overflow-y: auto;
          scroll-snap-type: y mandatory;
          border-right: 1px solid var(--input-border);
          padding: 0.5rem 0;
        }
        .picker-column:last-child {
          border-right: none;
        }
        .picker-column::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
        .am-pm-column {
          flex: 0.8;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .picker-item {
          padding: 0.5rem;
          text-align: center;
          cursor: pointer;
          font-size: 0.95rem;
          color: var(--text-muted);
          transition: all 0.1s ease;
          scroll-snap-align: center;
        }
        .picker-item:hover {
          background: var(--input-bg);
          color: var(--text-main);
        }
        .picker-item.active {
          color: var(--primary);
          font-weight: 700;
          font-size: 1.1rem;
          background: rgba(99, 102, 241, 0.05);
        }
        .picker-footer {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem;
          background: var(--bg-color);
        }
        .picker-btn {
          border: none;
          background: transparent;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0.4rem 0.8rem;
          border-radius: var(--radius-sm);
        }
        .clear-btn {
          color: var(--text-muted);
        }
        .clear-btn:hover {
          background: var(--input-border);
        }
        .done-btn {
          color: #fff;
          background: var(--primary);
        }
        .done-btn:hover {
          opacity: 0.9;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
