import { useState } from "react";
import Image from "next/image";

interface UserAvatarProps {
    name: string;
    photoURL?: string | null;
    size?: "small" | "medium" | "large";
    className?: string;
}

const sizeClasses = {
    small: "w-8 h-8 text-sm",
    medium: "w-12 h-12 text-lg",
    large: "w-20 h-20 text-3xl",
};

export function UserAvatar({ name, photoURL, size = "medium", className = "" }: UserAvatarProps) {
    const [imageError, setImageError] = useState(false);
    const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const sizeClass = sizeClasses[size];

    // Show initials if no photo or if image failed to load
    if (!photoURL || imageError) {
        return (
            <div
                className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold ${className}`}
            >
                {initials}
            </div>
        );
    }

    // Show profile image
    return (
        <div className={`${sizeClass} rounded-full overflow-hidden relative ${className}`}>
            <Image
                src={photoURL}
                alt={name}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
            />
        </div>
    );
}
