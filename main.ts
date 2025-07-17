import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, PluginManifest } from 'obsidian';

interface HeyWakeUpSettings {
    flashColor: string;
    flashDuration: number; // Duration of the flash color in milliseconds
    flashInterval: number; // Interval between flashes in milliseconds
    flashCycles: number; // Number of flash cycles (0 for infinite)
    idleTimeSeconds: number; // Time in seconds before flashing starts
}

const DEFAULT_SETTINGS: HeyWakeUpSettings = {
    flashColor: '#FF0000', // Default to red
    flashDuration: 500, // 0.5 seconds
    flashInterval: 500, // 0.5 seconds
    flashCycles: 0, // Infinite flashes by default
    idleTimeSeconds: 30, // 30 seconds by default
}

export default class HeyWakeUpPlugin extends Plugin {
    settings: HeyWakeUpSettings;
    private idleTimer: number | null = null;
    private flashTimer: number | null = null;
    private flashCount: number = 0;
    private isFlashing = false;

    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest);
        this.settings = DEFAULT_SETTINGS;
    }

    async onload() {
        console.log('Loading Hey, Wake Up! plugin');

        await this.loadSettings();

        this.addSettingTab(new HeyWakeUpSettingTab(this.app, this));

        this.resetIdleTimer();

        // Listen for user activity
        this.registerDomEvent(document, 'mousemove', this.resetIdleTimer.bind(this));
        this.registerDomEvent(document, 'keydown', this.resetIdleTimer.bind(this));

        // Add a CSS class for flashing (no animation, just for applying color)
        const style = document.createElement('style');
        style.id = 'idle-notifier-style';
        style.textContent = `
            .hey-wake-up-flash-active {
                background-color: ${this.settings.flashColor} !important;
            }
        `;
        document.head.appendChild(style);
    }

    onunload() {
        console.log('Unloading Hey, Wake Up! plugin');
        this.clearIdleTimer();
        this.stopFlashing();
        document.getElementById('hey-wake-up-style')?.remove();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        // Update CSS style immediately after saving settings
        const styleEl = document.getElementById('hey-wake-up-style');
        if (styleEl) {
            styleEl.textContent = `
                .hey-wake-up-flash-active {
                    background-color: ${this.settings.flashColor} !important;
                }
            `;
        }
    }

    private resetIdleTimer() {
        this.clearIdleTimer();
        this.stopFlashing();
        this.idleTimer = window.setTimeout(() => {
            this.startFlashing();
        }, this.settings.idleTimeSeconds * 1000); // Use idleTimeSeconds
    }

    private clearIdleTimer() {
        if (this.idleTimer !== null) {
            window.clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }

    private startFlashing() {
        if (this.isFlashing) return;
        this.isFlashing = true;
        this.flashCount = 0; // Reset flash count
        console.log('Starting to flash due to inactivity');
        this.flashLoop();
    }

    private flashLoop() {
        if (!this.isFlashing) return;

        if (this.settings.flashCycles !== 0 && this.flashCount >= this.settings.flashCycles) {
            this.stopFlashing();
            return;
        }

        // Apply flash class to active note pane background
        this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
            if (leaf.view.containerEl) {
                const editorEl = leaf.view.containerEl.querySelector('.cm-editor');
                if (editorEl) {
                    editorEl.addClass('hey-wake-up-flash-active');
                }
            }
        });

        this.flashTimer = window.setTimeout(() => {
            // Remove flash class from active note pane background
            this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
                if (leaf.view.containerEl) {
                    const editorEl = leaf.view.containerEl.querySelector('.cm-editor');
                    if (editorEl) {
                        editorEl.removeClass('hey-wake-up-flash-active');
                    }
                }
            });

            this.flashCount++;
            this.flashTimer = window.setTimeout(() => this.flashLoop(), this.settings.flashInterval);
        }, this.settings.flashDuration);
    }

    private stopFlashing() {
        if (!this.isFlashing) return;
        this.isFlashing = false;
        console.log('Stopping flash');
        this.clearFlashTimer();
        // Ensure active note pane background is reset to normal state
        this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
            if (leaf.view.containerEl) {
                const editorEl = leaf.view.containerEl.querySelector('.cm-editor');
                if (editorEl) {
                    editorEl.removeClass('hey-wake-up-flash-active');
                }
            }
        });
    }

    private clearFlashTimer() {
        if (this.flashTimer !== null) {
            window.clearTimeout(this.flashTimer);
            this.flashTimer = null;
        }
    }
}

class HeyWakeUpSettingTab extends PluginSettingTab {
    plugin: HeyWakeUpPlugin;

    constructor(app: App, plugin: HeyWakeUpPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

        containerEl.createEl('h2', {text: 'Hey, Wake Up! Settings'});

        new Setting(containerEl)
            .setName('Flash Color')
            .setDesc('Choose the color for the flashing effect. Default is red.')
            .addColorPicker(colorPicker => colorPicker
                .setValue(this.plugin.settings.flashColor)
                .onChange(async (value) => {
                    this.plugin.settings.flashColor = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Flash Duration')
            .setDesc('How long the flash color stays visible (in milliseconds). Higher values mean longer flashes.')
            .addText(text => text
                .setPlaceholder('500')
                .setValue(this.plugin.settings.flashDuration.toString())
                .onChange(async (value) => {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= 0) {
                        this.plugin.settings.flashDuration = numValue;
                        await this.plugin.saveSettings();
                    } else {
                        console.warn('Invalid Flash Duration value. Please enter a non-negative number.');
                    }
                }));

        new Setting(containerEl)
            .setName('Flash Interval')
            .setDesc('The time between flashes (in milliseconds). Higher values mean slower flashing.')
            .addText(text => text
                .setPlaceholder('500')
                .setValue(this.plugin.settings.flashInterval.toString())
                .onChange(async (value) => {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= 0) {
                        this.plugin.settings.flashInterval = numValue;
                        await this.plugin.saveSettings();
                    } else {
                        console.warn('Invalid Flash Interval value. Please enter a non-negative number.');
                    }
                }));

        new Setting(containerEl)
            .setName('Flash Cycles')
            .setDesc('Number of times the screen will flash. Set to 0 for infinite flashes.')
            .addText(text => text
                .setPlaceholder('0')
                .setValue(this.plugin.settings.flashCycles.toString())
                .onChange(async (value) => {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= 0) {
                        this.plugin.settings.flashCycles = numValue;
                        await this.plugin.saveSettings();
                    } else {
                        console.warn('Invalid Flash Cycles value. Please enter a non-negative number.');
                    }
                }));

        new Setting(containerEl)
            .setName('Idle Time')
            .setDesc('Time in seconds before the flashing starts.')
            .addText(text => text
                .setPlaceholder('30')
                .setValue(this.plugin.settings.idleTimeSeconds.toString())
                .onChange(async (value) => {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= 0) {
                        this.plugin.settings.idleTimeSeconds = numValue;
                        await this.plugin.saveSettings();
                    } else {
                        console.warn('Invalid Idle Time value. Please enter a non-negative number.');
                    }
                }));
    }
}
