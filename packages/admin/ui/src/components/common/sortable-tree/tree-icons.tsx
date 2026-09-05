"use client";

import * as React from "react";

/** Blue gradient folder illustration (closed) for admin navigation. */
export function FolderIllustration({ className }: { className?: string }) {
  const id = React.useId().replace(/:/g, "");
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      fill="none"
      className={className}
    >
      <g clipPath={`url(#${id}-clip)`}>
        <path
          fill="#60A5FA"
          fillRule="evenodd"
          d="M13.935 11.15a2.32 2.32 0 0 1-2.318 2.32H3.383a2.32 2.32 0 0 1-2.318-2.32V3.785a2.32 2.32 0 0 1 2.318-2.318h1.691c.704 0 1.368.319 1.808.867l.348.433h4.387a2.32 2.32 0 0 1 2.318 2.318z"
          clipRule="evenodd"
        />
        <path
          fill={`url(#${id}-grad1)`}
          fillOpacity="0.15"
          fillRule="evenodd"
          d="M13.935 11.15a2.32 2.32 0 0 1-2.318 2.32H3.383a2.32 2.32 0 0 1-2.318-2.32V3.785a2.32 2.32 0 0 1 2.318-2.318h1.691c.704 0 1.368.319 1.808.867l.348.433h4.387a2.32 2.32 0 0 1 2.318 2.318z"
          clipRule="evenodd"
        />
        <path
          stroke="#000"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.15"
          strokeWidth="0.5"
          d="M3.383 1.716h1.69c.55 0 1.073.218 1.458.6l.156.173.348.433a.25.25 0 0 0 .195.094h4.387c1.142 0 2.068.926 2.068 2.068v6.067a2.07 2.07 0 0 1-2.068 2.068H3.383a2.07 2.07 0 0 1-2.068-2.068V3.783c0-1.142.926-2.068 2.068-2.068"
        />
        <g fillRule="evenodd" clipRule="evenodd" filter={`url(#${id}-filter)`}>
          <path
            fill="#60A5FA"
            d="M2.041 5.734h10.917a1.95 1.95 0 0 1 1.884 2.452l-.955 3.578a2.38 2.38 0 0 1-2.302 1.77h-8.17a2.38 2.38 0 0 1-2.303-1.77L.158 8.186A1.95 1.95 0 0 1 2.04 5.734z"
          />
          <path
            fill={`url(#${id}-grad2)`}
            fillOpacity="0.2"
            d="M2.041 5.734h10.917a1.95 1.95 0 0 1 1.884 2.452l-.955 3.578a2.38 2.38 0 0 1-2.302 1.77h-8.17a2.38 2.38 0 0 1-2.303-1.77L.158 8.186A1.95 1.95 0 0 1 2.04 5.734z"
          />
        </g>
      </g>
      <defs>
        <linearGradient
          id={`${id}-grad1`}
          x1="7.5"
          x2="7.5"
          y1="1.466"
          y2="13.469"
          gradientUnits="userSpaceOnUse"
        >
          <stop />
          <stop offset="1" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id={`${id}-grad2`}
          x1="7.5"
          x2="7.5"
          y1="5.734"
          y2="13.534"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path fill="#fff" d="M0 0h15v15H0z" />
        </clipPath>
        <filter
          id={`${id}-filter`}
          width="14.817"
          height="7.8"
          x="0.091"
          y="5.734"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="-0.5" />
          <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
          <feBlend in2="shape" result="effect1_innerShadow" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="0.5" />
          <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
          <feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.2 0" />
          <feBlend in2="effect1_innerShadow" result="effect2_innerShadow" />
        </filter>
      </defs>
    </svg>
  );
}

/** Blue gradient folder (open) for admin navigation. */
export function FolderOpenIllustration({ className }: { className?: string }) {
  const id = React.useId().replace(/:/g, "");
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      fill="none"
      className={className}
    >
      <g clipPath={`url(#${id}-clip)`}>
        <path
          fill="#60A5FA"
          fillRule="evenodd"
          d="M13.935 11.15a2.32 2.32 0 0 1-2.318 2.32H3.383a2.32 2.32 0 0 1-2.318-2.32V3.785a2.32 2.32 0 0 1 2.318-2.318h1.691c.704 0 1.368.319 1.808.867l.348.433h4.387a2.32 2.32 0 0 1 2.318 2.318z"
          clipRule="evenodd"
        />
        <path
          fill={`url(#${id}-grad1)`}
          fillOpacity="0.15"
          fillRule="evenodd"
          d="M13.935 11.15a2.32 2.32 0 0 1-2.318 2.32H3.383a2.32 2.32 0 0 1-2.318-2.32V3.785a2.32 2.32 0 0 1 2.318-2.318h1.691c.704 0 1.368.319 1.808.867l.348.433h4.387a2.32 2.32 0 0 1 2.318 2.318z"
          clipRule="evenodd"
        />
        <path
          stroke="#000"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.15"
          strokeWidth="0.5"
          d="M3.383 1.716h1.69c.55 0 1.073.218 1.458.6l.156.173.348.433a.25.25 0 0 0 .195.094h4.387c1.142 0 2.068.926 2.068 2.068v6.067a2.07 2.07 0 0 1-2.068 2.068H3.383a2.07 2.07 0 0 1-2.068-2.068V3.783c0-1.142.926-2.068 2.068-2.068"
        />
        {/* Open flap */}
        <path
          fill="#60A5FA"
          d="M1.065 5.734h10.917a1.95 1.95 0 0 1 1.884 2.452l-.955 3.578a2.38 2.38 0 0 1-2.302 1.77H2.44a2.38 2.38 0 0 1-2.303-1.77L-.818 8.186A1.95 1.95 0 0 1 1.065 5.734z"
        />
        <path
          fill={`url(#${id}-grad2)`}
          fillOpacity="0.2"
          d="M1.065 5.734h10.917a1.95 1.95 0 0 1 1.884 2.452l-.955 3.578a2.38 2.38 0 0 1-2.302 1.77H2.44a2.38 2.38 0 0 1-2.303-1.77L-.818 8.186A1.95 1.95 0 0 1 1.065 5.734z"
        />
      </g>
      <defs>
        <linearGradient
          id={`${id}-grad1`}
          x1="7.5"
          x2="7.5"
          y1="1.466"
          y2="13.469"
          gradientUnits="userSpaceOnUse"
        >
          <stop />
          <stop offset="1" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id={`${id}-grad2`}
          x1="7.5"
          x2="7.5"
          y1="5.734"
          y2="13.534"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path fill="#fff" d="M0 0h15v15H0z" />
        </clipPath>
      </defs>
    </svg>
  );
}

/** Blue gradient tag illustration for leaf nodes. */
export function TagIllustration({ className }: { className?: string }) {
  const id = React.useId().replace(/:/g, "");
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      fill="none"
      className={className}
    >
      <g filter={`url(#${id}-outer)`}>
        <path
          fill="#60A5FA"
          d="M12.863 6.686 8.315 2.138A2.16 2.16 0 0 0 6.777 1.5H2.884c-.763 0-1.384.62-1.384 1.384v3.893c0 .581.226 1.127.638 1.538l4.548 4.548c.41.412.957.637 1.537.637s1.128-.226 1.538-.637l3.102-3.102c.412-.41.637-.957.637-1.538 0-.58-.226-1.127-.637-1.537"
        />
        <path
          fill={`url(#${id}-grad1)`}
          fillOpacity="0.2"
          d="M12.863 6.686 8.315 2.138A2.16 2.16 0 0 0 6.777 1.5H2.884c-.763 0-1.384.62-1.384 1.384v3.893c0 .581.226 1.127.638 1.538l4.548 4.548c.41.412.957.637 1.537.637s1.128-.226 1.538-.637l3.102-3.102c.412-.41.637-.957.637-1.538 0-.58-.226-1.127-.637-1.537"
        />
      </g>
      <path
        stroke="#000"
        strokeOpacity="0.15"
        strokeWidth="0.5"
        d="M2.884 1.75h3.892c.515 0 .998.2 1.363.564l4.548 4.548c.363.364.563.847.563 1.362 0 .45-.153.876-.435 1.218l-.128.142-3.103 3.103a1.9 1.9 0 0 1-1.36.563c-.45 0-.877-.152-1.22-.435l-.142-.128-4.548-4.548a1.91 1.91 0 0 1-.564-1.363V2.884c0-.625.509-1.134 1.134-1.134Z"
      />
      <g filter={`url(#${id}-inner)`}>
        <path
          fill="#60A5FA"
          d="M5.257 6.246a.99.99 0 0 1-.989-.989.99.99 0 0 1 .989-.989.99.99 0 0 1 .989.99.99.99 0 0 1-.989.988m3.385 3.979a.59.59 0 0 1-.838 0L6.222 8.643a.593.593 0 1 1 .84-.84l1.581 1.582a.593.593 0 0 1 0 .84m1.582-1.582a.59.59 0 0 1-.838 0L7.804 7.06a.593.593 0 1 1 .84-.84l1.581 1.582a.593.593 0 0 1 0 .84"
        />
        <path
          fill={`url(#${id}-grad2)`}
          fillOpacity="0.15"
          d="M5.257 6.246a.99.99 0 0 1-.989-.989.99.99 0 0 1 .989-.989.99.99 0 0 1 .989.99.99.99 0 0 1-.989.988m3.385 3.979a.59.59 0 0 1-.838 0L6.222 8.643a.593.593 0 1 1 .84-.84l1.581 1.582a.593.593 0 0 1 0 .84m1.582-1.582a.59.59 0 0 1-.838 0L7.804 7.06a.593.593 0 1 1 .84-.84l1.581 1.582a.593.593 0 0 1 0 .84"
        />
      </g>
      <defs>
        <linearGradient
          id={`${id}-grad1`}
          x1="7.5"
          x2="7.5"
          y1="1.5"
          y2="13.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id={`${id}-grad2`}
          x1="7.333"
          x2="7.333"
          y1="4.268"
          y2="10.399"
          gradientUnits="userSpaceOnUse"
        >
          <stop />
          <stop offset="1" stopOpacity="0" />
        </linearGradient>
        <filter
          id={`${id}-outer`}
          width="12"
          height="12"
          x="1.5"
          y="1.5"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="-0.5" />
          <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0" />
          <feBlend in2="shape" result="effect1_innerShadow" />
        </filter>
        <filter
          id={`${id}-inner`}
          width="6.13"
          height="6.13"
          x="4.268"
          y="4.268"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="-0.5" />
          <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0" />
          <feBlend in2="shape" result="effect1_innerShadow" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="0.5" />
          <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
          <feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.4 0" />
          <feBlend in2="effect1_innerShadow" result="effect2_innerShadow" />
        </filter>
      </defs>
    </svg>
  );
}

/** Six-dot drag handle icon */
export function DragHandleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      fill="none"
      className={className}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M4.306 7.5a1.194 1.194 0 1 1 2.389 0 1.194 1.194 0 0 1-2.39 0M4.306 2.833a1.194 1.194 0 1 1 2.389 0 1.194 1.194 0 0 1-2.39 0M4.306 12.167a1.194 1.194 0 1 1 2.389 0 1.194 1.194 0 0 1-2.39 0M8.306 7.5a1.194 1.194 0 1 1 2.389 0 1.194 1.194 0 0 1-2.39 0M8.306 2.833a1.194 1.194 0 1 1 2.389 0 1.194 1.194 0 0 1-2.39 0M8.306 12.167a1.194 1.194 0 1 1 2.389 0 1.194 1.194 0 0 1-2.39 0"
        clipRule="evenodd"
      />
    </svg>
  );
}
