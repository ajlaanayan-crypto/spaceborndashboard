"use client";

import { useEffect, useState } from "react";
import { getAllResources, ResourceData } from "@/services/communicationService";
import { ResourcesHub } from "@/components/resources/ResourcesHub";

export default function InternResourcesPage() {
    const [resources, setResources] = useState<ResourceData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const data = await getAllResources();
                setResources(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchResources();
    }, []);

    return (
        <div className="w-full">
            <ResourcesHub resources={resources} loading={loading} />
        </div>
    );
}
