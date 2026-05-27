const SW = 1.4;

export default function TabIcon({ id }: { id: string }) {
  switch (id) {
    case "today":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="11.5" r="3.6" stroke="currentColor" strokeWidth={SW} />
          <path
            d="M10 3v1.6M10 18.4V17M3 11.5h1.6M15.4 11.5H17M5.1 6.6l1.1 1.1M13.8 7.7l1.1-1.1"
            stroke="currentColor"
            strokeWidth={SW}
            strokeLinecap="round"
          />
        </svg>
      );
    case "open-work":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M3.5 5.5h13M3.5 10h13M3.5 14.5h8"
            stroke="currentColor"
            strokeWidth={SW}
            strokeLinecap="round"
          />
          <circle cx="2.4" cy="5.5" r="0.6" fill="currentColor" />
          <circle cx="2.4" cy="10" r="0.6" fill="currentColor" />
          <circle cx="2.4" cy="14.5" r="0.6" fill="currentColor" />
        </svg>
      );
    case "dashboard":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="6.2" height="6.2" rx="1.2" stroke="currentColor" strokeWidth={SW} />
          <rect x="10.8" y="3" width="6.2" height="6.2" rx="1.2" stroke="currentColor" strokeWidth={SW} />
          <rect x="3" y="10.8" width="6.2" height="6.2" rx="1.2" stroke="currentColor" strokeWidth={SW} />
          <rect x="10.8" y="10.8" width="6.2" height="6.2" rx="1.2" stroke="currentColor" strokeWidth={SW} />
        </svg>
      );
    case "ideas":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2.5l1.4 5.4L16.8 9l-5.4 1.4L10 15.8 8.6 10.4 3.2 9l5.4-1.1L10 2.5z"
            stroke="currentColor"
            strokeWidth={SW}
            strokeLinejoin="round"
          />
        </svg>
      );
    case "guide":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M3.5 5.6a2.4 2.4 0 012.4-2.4h8.2a2.4 2.4 0 012.4 2.4v6.6a2.4 2.4 0 01-2.4 2.4H8.6l-3.7 2.6v-2.6H5.9a2.4 2.4 0 01-2.4-2.4V5.6z"
            stroke="currentColor"
            strokeWidth={SW}
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}
