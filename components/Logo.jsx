export default function Logo({ height = 42, dark = false }) {
  const textColor = dark ? "url(#ftG)" : "url(#tG)";
  const xoColor = dark ? "#FAC775" : "#D85A30";
  const handleColor = dark ? "#EF9F27" : "#BA7517";

  return (
    <svg viewBox="0 0 280 100" xmlns="http://www.w3.org/2000/svg" style={{ height, width: "auto" }}>
      <defs>
        <linearGradient id="bG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF9F27" />
          <stop offset="100%" stopColor="#D85A30" />
        </linearGradient>
        <linearGradient id="tG" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#993C1D" />
          <stop offset="50%" stopColor="#D85A30" />
          <stop offset="100%" stopColor="#EF9F27" />
        </linearGradient>
        <linearGradient id="ftG" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#EF9F27" />
          <stop offset="100%" stopColor="#FAC775" />
        </linearGradient>
      </defs>
      <path
        d="M32 34 Q32 20 42 20 Q58 20 58 34"
        stroke={handleColor}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="22" y="34" width="46" height="46" rx="8" fill="url(#bG)" />
      <line x1="22" y1="46" x2="68" y2="46" stroke="white" strokeWidth="1" strokeOpacity="0.25" />
      <line
        x1="33"
        y1="56"
        x2="43"
        y2="70"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="43"
        y1="56"
        x2="33"
        y2="70"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <ellipse cx="55" cy="63" rx="7" ry="7" stroke="white" strokeWidth="2.5" fill="none" />
      <circle cx="66" cy="28" r="7" fill="#D85A30" />
      <path
        d="M66 22 Q70 22 70 27 Q70 31 66 35 Q62 31 62 27 Q62 22 66 22Z"
        fill="#993C1D"
        opacity="0.4"
      />
      <circle cx="66" cy="27" r="2.2" fill="white" />
      <text
        x="82"
        y="68"
        fontFamily="'Trebuchet MS', sans-serif"
        fontSize="40"
        fontWeight="700"
        fill={textColor}
        letterSpacing="-1"
      >
        Order
        <tspan fill={xoColor} dx="-2">
          XO
        </tspan>
      </text>
      <rect x="82" y="74" width="192" height="3" rx="1.5" fill={textColor} opacity="0.35" />
    </svg>
  );
}
