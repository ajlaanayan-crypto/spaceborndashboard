import { GlassCard } from "@/components/ui/GlassCard";
import { ResourceData } from "@/services/communicationService";
import { BookOpen, Video, Link as LinkIcon, FileText, Download, Play, Instagram, ListVideo, X, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface ResourceCardProps {
    resource: ResourceData;
    onDelete?: (id: string) => void;
}

export const ResourceCard = ({ resource, onDelete }: ResourceCardProps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const getIcon = (type: string) => {
        switch (type) {
            case "pdf": return FileText;
            case "video": return Video;
            case "link": return LinkIcon;
            case "youtube": return Play;
            case "playlist": return ListVideo;
            case "instagram": return Instagram;
            default: return BookOpen;
        }
    };

    const Icon = getIcon(resource.type);

    // Extract YouTube Video Info
    const getYouTubeInfo = (url: string) => {
        try {
            const urlObj = new URL(url);
            let videoId = "";
            let playlistId = "";

            if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
                if (urlObj.hostname.includes("youtu.be")) {
                    videoId = urlObj.pathname.slice(1);
                } else if (urlObj.searchParams.has("v")) {
                    videoId = urlObj.searchParams.get("v") || "";
                } else if (urlObj.pathname.includes("/embed/")) {
                    videoId = urlObj.pathname.split("/embed/")[1];
                }

                if (urlObj.searchParams.has("list")) {
                    playlistId = urlObj.searchParams.get("list") || "";
                }

                if (playlistId && resource.type === "playlist") {
                    return { url: `https://www.youtube.com/embed/videoseries?list=${playlistId}`, videoId };
                }

                if (videoId) {
                    return { url: `https://www.youtube.com/embed/${videoId}`, videoId };
                }
            }
        } catch (e) {
            console.error("Invalid YouTube URL:", url);
        }
        return { url: null, videoId: null };
    };

    const isYouTubeOrPlaylist = resource.type === "youtube" || resource.type === "playlist";
    const ytInfo = isYouTubeOrPlaylist ? getYouTubeInfo(resource.url) : { url: null, videoId: null };

    return (
        <GlassCard className="flex flex-col gap-4 hover:border-blue-500/30 transition-colors group h-full">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                        <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-white/10 text-gray-300">
                        {resource.type.toUpperCase()}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {resource.createdAt && (
                        <span className="text-xs text-gray-400">
                            {formatDistanceToNow(resource.createdAt?.toDate?.() || new Date(resource.createdAt), { addSuffix: true })}
                        </span>
                    )}
                    {onDelete && resource.id && (
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(resource.id!); }}
                            className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Delete Resource"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-start">
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{resource.title}</h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-3">{resource.description}</p>

                {/* Tags */}
                {resource.tags && resource.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {resource.tags.map(tag => (
                            <span key={tag} className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Embedded Player or Link */}
            {ytInfo.url ? (
                <>
                    {/* The Thumbnail Card View */}
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-white/10 mt-auto group/player bg-black/60">
                        {ytInfo.videoId ? (
                            <img
                                src={`https://img.youtube.com/vi/${ytInfo.videoId}/maxresdefault.jpg`}
                                alt={resource.title}
                                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover/player:opacity-40 transition-opacity"
                                onError={(e) => {
                                    // Fallback if maxresdefault doesn't exist
                                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${ytInfo.videoId}/hqdefault.jpg`;
                                }}
                            />
                        ) : null}

                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
                            <button
                                onClick={(e) => { e.preventDefault(); setIsPlaying(true); }}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                Play Video
                            </button>
                            <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="px-4 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white text-sm font-medium rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
                            >
                                <LinkIcon className="w-4 h-4" />
                                Open in YouTube
                            </a>
                        </div>
                    </div>

                    {/* The Full Screen Cinematic Player Overlay */}
                    {isPlaying && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
                            {/* Click-away backdrop */}
                            <div
                                className="absolute inset-0"
                                onClick={() => setIsPlaying(false)}
                            />

                            {/* Player Container */}
                            <div className="relative w-full max-w-6xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 z-10 animate-in zoom-in-95 duration-200">
                                {/* Header / Controls */}
                                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start z-20 opacity-0 hover:opacity-100 transition-opacity duration-300">
                                    <h3 className="text-white font-medium truncate max-w-[80%] drop-shadow-md">
                                        {resource.title}
                                    </h3>
                                    <button
                                        onClick={() => setIsPlaying(false)}
                                        className="p-2 bg-black/50 hover:bg-red-600 text-white rounded-full backdrop-blur-md transition-colors"
                                        title="Close Video"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Iframe */}
                                <iframe
                                    className="w-full h-full"
                                    src={`${ytInfo.url}${ytInfo.url.includes('?') ? '&' : '?'}autoplay=1`}
                                    title={resource.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    )}
                </>
            ) : resource.thumbnailUrl ? (
                <div className="mt-auto group/ext flex flex-col gap-2">
                    <div className="relative w-full aspect-[2/1] rounded-lg overflow-hidden border border-white/10 group-hover/ext:border-blue-500/50 transition-colors bg-black/40">
                        <img
                            src={resource.thumbnailUrl}
                            alt={resource.title}
                            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover/ext:opacity-100 transition-opacity"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                        <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 group-hover/ext:opacity-100 transition-opacity"
                        >
                            <span className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full shadow-lg flex items-center gap-2">
                                <LinkIcon className="w-4 h-4" />
                                Visit Link
                            </span>
                        </a>
                    </div>
                </div>
            ) : (
                <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full mt-auto py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium text-center transition-colors flex items-center justify-center gap-2"
                >
                    <Download className="w-4 h-4" />
                    Access Resource
                </a>
            )}
        </GlassCard>
    );
};
