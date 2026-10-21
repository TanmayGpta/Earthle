import React from 'react';

interface GothicLogoProps {
  className?: string;
  size?: number | string;
}

/**
 * Authentic Gothic / Blackletter Fraktur "E" lettermark matching
 * the exact brand mark style of Rainmaker's gothic "R".
 */
export default function GothicLogo({ className = 'text-[#f5f5f1]', size = 36 }: GothicLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1350 1495"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-colors duration-300 ${className}`}
      aria-label="Earthle Gothic Logo"
    >
      <path d="M473.0 126.0L493.0 157.0Q327.0 263.0 248.5 400.5Q170.0 538.0 170.0 695.0Q170.0 897.0 308.0 1081.0Q366.0 1033.0 378.0 1000.5Q390.0 968.0 390.0 833.0L390.0 373.0L827.0 0.0Q949.0 59.0 1032.5 82.0Q1116.0 105.0 1197.0 105.0Q1239.0 105.0 1301.0 96.0L1326.0 126.0L981.0 475.0L1251.0 475.0L1142.0 667.0L762.0 667.0L762.0 1315.0L826.0 1318.0Q968.0 1318.0 1108.0 1247.0Q1214.0 1194.0 1326.0 1081.0L1350.0 1119.0Q1234.0 1300.0 1094.0 1388.0Q923.0 1495.0 704.0 1495.0Q359.0 1495.0 159.0 1257.0Q0.0 1068.0 0.0 814.0Q0.0 656.0 65.0 519.5Q130.0 383.0 248.0 275.0Q332.0 199.0 473.0 126.0ZM716.0 175.0L594.0 277.0L594.0 741.0Q594.0 818.0 585.5 848.0Q577.0 878.0 546.0 913.0Q480.0 991.0 334.0 1112.0Q421.0 1204.0 506.5 1249.0Q592.0 1294.0 716.0 1311.0ZM1099.0 288.0Q994.0 273.0 926.5 252.0Q859.0 231.0 762.0 183.0L762.0 630.0Z" />
    </svg>
  );
}
