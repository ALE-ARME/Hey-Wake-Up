import { Plugin } from 'obsidian';
export default class HeyWakeUpPlugin extends Plugin {
    private idleTimer;
    private readonly IDLE_TIMEOUT_MS;
    private isFlashing;
    onload(): Promise<void>;
    onunload(): void;
    private resetIdleTimer;
    private clearIdleTimer;
    private startFlashing;
    private stopFlashing;
}
