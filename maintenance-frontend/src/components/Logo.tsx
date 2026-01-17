interface LogoProps {
  collapsed?: boolean;
  className?: string;
}

export const Logo = ({ collapsed = false, className = '' }: LogoProps) => {
  return (
    <div className={`flex items-center ${className}`}>
      {/* Logo Icon - Gear with Wrench */}
      <div className="relative flex-shrink-0">
        <svg
          width={collapsed ? '32' : '40'}
          height={collapsed ? '32' : '40'}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-all duration-300"
        >
          {/* Gear Background */}
          <circle cx="50" cy="50" r="45" fill="#3B82F6" />

          {/* Gear Teeth */}
          <path
            d="M50 10 L55 15 L55 20 L45 20 L45 15 Z
               M50 90 L55 85 L55 80 L45 80 L45 85 Z
               M10 50 L15 45 L20 45 L20 55 L15 55 Z
               M90 50 L85 45 L80 45 L80 55 L85 55 Z
               M25 25 L30 20 L35 25 L30 30 L25 25 Z
               M75 75 L80 70 L85 75 L80 80 L75 75 Z
               M75 25 L70 20 L75 15 L80 20 L75 25 Z
               M25 75 L20 70 L25 65 L30 70 L25 75 Z"
            fill="#2563EB"
          />

          {/* Inner Gear Circle */}
          <circle cx="50" cy="50" r="30" fill="#1E40AF" />

          {/* Wrench Overlay */}
          <path
            d="M 35 40 L 40 35 L 45 40 L 43 42 L 60 59 L 65 57 L 67 59 L 65 61 L 67 63 L 65 65 L 63 67 L 61 65 L 59 67 L 57 65 L 59 60 L 42 43 L 40 45 Z"
            fill="#FFFFFF"
            opacity="0.9"
          />
          <circle cx="39" cy="39" r="3" fill="#FFFFFF" opacity="0.9" />

          {/* Center Hole */}
          <circle cx="50" cy="50" r="12" fill="#3B82F6" />
          <circle cx="50" cy="50" r="8" fill="#1E3A8A" />
        </svg>
      </div>

      {/* Logo Text */}
      {!collapsed && (
        <div className="ml-3 transition-all duration-300">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900 leading-tight">
              MaintenanceHub
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Automation Platform
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
