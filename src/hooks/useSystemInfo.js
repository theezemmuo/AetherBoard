import { useState } from 'react';

export function useSystemInfo() {
    const [info] = useState(() => {
        if (typeof window === 'undefined') {
            return {
                platform: 'Unknown',
                cores: 0,
                memory: 0,
                isMac: false,
            };
        }
        const platform = navigator.platform || 'Unknown';
        const cores = navigator.hardwareConcurrency || 0;
        // @ts-ignore - deviceMemory is experimental
        const memory = navigator.deviceMemory || 0;
        const isMac = /Mac|iPod|iPhone|iPad/.test(platform);

        return {
            platform,
            cores,
            memory,
            isMac,
        };
    });

    return info;
}
