"use client";

import React, { useState, useRef, useEffect } from "react";

interface CustomSelectProps {
  options: { value: string | number; label: string }[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  style,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`custom-select-container ${disabled ? "disabled" : ""} ${className}`}
      style={style}
      ref={containerRef}
    >
      <div
        className={`custom-select-trigger ${isOpen ? "open" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
      >
        <span className={selectedOption ? "selected-text" : "placeholder-text"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className="custom-select-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {isOpen && (
        <div className="custom-select-dropdown">
          <ul className="custom-select-list">
            {options.map((option) => (
              <li
                key={option.value}
                className={`custom-select-item ${option.value === value ? "active" : ""}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
                {option.value === value && (
                  <svg
                    className="check-icon"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <style jsx>{`
        .custom-select-container {
          position: relative;
          width: 100%;
          font-family: inherit;
        }
        .custom-select-trigger {
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
        .custom-select-trigger:hover:not(.disabled) {
          border-color: var(--primary);
        }
        .custom-select-trigger:focus-visible {
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
          border-color: var(--primary);
        }
        .custom-select-trigger.open {
          border-color: var(--primary);
          border-bottom-left-radius: 4px;
          border-bottom-right-radius: 4px;
        }
        .custom-select-container.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .custom-select-container.disabled .custom-select-trigger {
          background: var(--input-bg);
          cursor: not-allowed;
        }
        .placeholder-text {
          color: var(--text-muted);
        }
        .selected-text {
          color: var(--text-main);
          font-weight: 500;
        }
        .custom-select-icon {
          color: var(--text-muted);
          transition: transform 0.2s ease;
        }
        .custom-select-trigger.open .custom-select-icon {
          transform: rotate(180deg);
        }
        .custom-select-dropdown {
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
        }
        .custom-select-list {
          list-style: none;
          margin: 0;
          padding: 0.5rem;
          max-height: 250px;
          overflow-y: auto;
        }
        .custom-select-list::-webkit-scrollbar {
          width: 6px;
        }
        .custom-select-list::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-select-list::-webkit-scrollbar-thumb {
          background: var(--input-border);
          border-radius: 10px;
        }
        .custom-select-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.6rem 0.8rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          color: var(--text-main);
          font-size: 0.95rem;
          transition: background 0.1s ease;
        }
        .custom-select-item:hover {
          background: var(--input-bg);
        }
        .custom-select-item.active {
          background: rgba(99, 102, 241, 0.08);
          color: var(--primary);
          font-weight: 600;
        }
        .check-icon {
          color: var(--primary);
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
