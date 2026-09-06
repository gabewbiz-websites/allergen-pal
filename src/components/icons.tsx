interface IconProps {
  size?: number;
}

const s = (p?: number) => ({
  width: p ?? 24,
  height: p ?? 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const HomeIcon = ({ size }: IconProps) => (
  <svg {...s(size)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
  </svg>
);

export const ListIcon = ({ size }: IconProps) => (
  <svg {...s(size)}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <circle cx="3.5" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="3.5" cy="18" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const PulseIcon = ({ size }: IconProps) => (
  <svg {...s(size)}>
    <path d="M3 12h4l2 6 4-14 2 8h6" />
  </svg>
);

export const UserIcon = ({ size }: IconProps) => (
  <svg {...s(size)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
  </svg>
);

export const PlusIcon = ({ size }: IconProps) => (
  <svg {...s(size)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const SearchIcon = ({ size }: IconProps) => (
  <svg {...s(size)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3-3" />
  </svg>
);

export const ChartIcon = ({ size }: IconProps) => (
  <svg {...s(size)}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
);

export const ShieldIcon = ({ size }: IconProps) => (
  <svg {...s(size)}>
    <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const LockIcon = ({ size }: IconProps) => (
  <svg {...s(size)}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export const CrownIcon = ({ size }: IconProps) => (
  <svg {...s(size)}>
    <path d="M3 7l4 4 5-7 5 7 4-4-2 12H5z" />
  </svg>
);

export const TrashIcon = ({ size }: IconProps) => (
  <svg {...s(size)}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  </svg>
);

export const CloseIcon = ({ size }: IconProps) => (
  <svg {...s(size)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const StarIcon = ({ size, filled }: IconProps & { filled?: boolean }) => (
  <svg {...s(size)} fill={filled ? "currentColor" : "none"}>
    <path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 17.8 6.7 19.6l1.1-6L3.4 9.4l6-.8z" />
  </svg>
);

export const ShareIcon = ({ size }: IconProps) => (
  <svg {...s(size)}>
    <path d="M12 3v13" />
    <path d="m7 8 5-5 5 5" />
    <path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
  </svg>
);
