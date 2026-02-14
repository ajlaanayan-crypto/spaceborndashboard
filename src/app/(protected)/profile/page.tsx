"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfileImage, removeUserProfileImage, updateUserName } from "@/services/userService";
import { useState, useRef } from "react";
import { Camera, Loader2, Trash2, User, Edit2, Check, X } from "lucide-react";

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.uid) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError("Image size must be less than 5MB");
            return;
        }

        setUploading(true);
        setError("");
        setSuccess("");

        try {
            await updateUserProfileImage(user.uid, file);
            setSuccess("Profile image updated successfully!");
            // Refresh user data to get new photoURL
            if (refreshUser) await refreshUser();
        } catch (err: any) {
            setError(err.message || "Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = async () => {
        if (!user?.uid || !user.photoURL) return;

        if (!confirm("Are you sure you want to remove your profile image?")) return;

        setUploading(true);
        setError("");
        setSuccess("");

        try {
            await removeUserProfileImage(user.uid);
            setSuccess("Profile image removed successfully!");
            if (refreshUser) await refreshUser();
        } catch (err: any) {
            setError(err.message || "Failed to remove image");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateName = async () => {
        if (!user?.uid || !newName.trim()) return;

        setUploading(true);
        setError("");
        setSuccess("");

        try {
            await updateUserName(user.uid, newName.trim());
            setSuccess("Name updated successfully!");
            setIsEditingName(false);
            if (refreshUser) await refreshUser();
        } catch (err: any) {
            setError(err.message || "Failed to update name");
        } finally {
            setUploading(false);
        }
    };

    const startEditingName = () => {
        setNewName(user?.displayName || user?.name || "");
        setIsEditingName(true);
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
                <p className="text-gray-400">Manage your profile information and settings</p>
            </div>

            <GlassCard>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-400" />
                    Profile Picture
                </h2>

                <div className="flex flex-col md:flex-row items-center gap-8">
                    {/* Avatar Display */}
                    <div className="relative">
                        <UserAvatar
                            name={user.displayName || user.name || user.email || "User"}
                            photoURL={user.photoURL}
                            size="large"
                        />
                        {uploading && (
                            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Upload Controls */}
                    <div className="flex-1 space-y-4">
                        <div className="flex gap-3">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Camera className="w-4 h-4" />
                                {user.photoURL ? "Change Photo" : "Upload Photo"}
                            </button>

                            {user.photoURL && (
                                <button
                                    onClick={handleRemoveImage}
                                    disabled={uploading}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Remove
                                </button>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleImageUpload}
                            className="hidden"
                        />

                        <p className="text-sm text-gray-400">
                            Recommended: Square image, at least 200x200px. Max 5MB.
                            <br />
                            Supported formats: JPG, PNG, WEBP
                        </p>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                                {success}
                            </div>
                        )}
                    </div>
                </div>
            </GlassCard>

            <GlassCard>
                <h2 className="text-xl font-bold text-white mb-6">Profile Information</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Name</label>
                        <div className="flex items-center gap-2">
                            {isEditingName ? (
                                <>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                                        placeholder="Enter your name"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleUpdateName}
                                        disabled={uploading || !newName.trim()}
                                        className="p-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <Check className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setIsEditingName(false)}
                                        className="p-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        value={user.displayName || user.name || ""}
                                        disabled
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-white opacity-70"
                                    />
                                    <button
                                        onClick={startEditingName}
                                        className="p-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Email</label>
                        <input
                            type="email"
                            value={user.email || ""}
                            disabled
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white opacity-70"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Role</label>
                        <input
                            type="text"
                            value={user.role?.replace("_", " ") || ""}
                            disabled
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white capitalize opacity-70"
                        />
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
