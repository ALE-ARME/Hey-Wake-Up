"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const obsidian_1 = require("obsidian");
const DEFAULT_SETTINGS = {
    flashColor: '#FF0000',
    flashDuration: 500,
    flashInterval: 500,
    flashCycles: 0,
    idleTimeSeconds: 30,
    flashViewContent: true,
    flashSidePanes: false,
    flashViewHeader: false,
    flashStatusBar: false,
    flashRibbon: false,
    flashTitlebar: false,
};
class HeyWakeUpPlugin extends obsidian_1.Plugin {
    settings;
    idleTimer = null;
    flashTimer = null;
    flashCount = 0;
    isFlashing = false;
    constructor(app, manifest) {
        super(app, manifest);
        this.settings = DEFAULT_SETTINGS;
    }
    async onload() {
        await this.loadSettings();
        this.addSettingTab(new HeyWakeUpSettingTab(this.app, this));
        this.resetIdleTimer();
        // Listen for user activity to reset the timer
        this.registerDomEvent(document, 'mousemove', this.resetIdleTimer.bind(this));
        this.registerDomEvent(document, 'keydown', this.resetIdleTimer.bind(this));
        this.registerDomEvent(document, 'touchstart', this.resetIdleTimer.bind(this));
        this.registerDomEvent(document, 'scroll', this.resetIdleTimer.bind(this));
        this.registerDomEvent(document, 'wheel', this.resetIdleTimer.bind(this));
        this.registerDomEvent(document, 'mousedown', this.resetIdleTimer.bind(this));
        this.registerDomEvent(document, 'mouseup', this.resetIdleTimer.bind(this));
        // Handle window focus to prevent flashing when app is not in foreground
        this.registerDomEvent(window, 'focus', this.resetIdleTimer.bind(this));
        this.registerDomEvent(window, 'blur', () => {
            this.clearIdleTimer();
            this.stopFlashing();
        });
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
        this.clearIdleTimer();
        this.stopFlashing();
        document.getElementById('idle-notifier-style')?.remove();
    }
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
    async saveSettings() {
        await this.saveData(this.settings);
        // Update CSS style immediately after saving settings
        const styleEl = document.getElementById('idle-notifier-style');
        if (styleEl) {
            styleEl.textContent = `
                .hey-wake-up-flash-active {
                    background-color: ${this.settings.flashColor} !important;
                }
            `;
        }
    }
    resetIdleTimer() {
        this.clearIdleTimer();
        this.stopFlashing();
        this.idleTimer = window.setTimeout(() => {
            this.startFlashing();
        }, this.settings.idleTimeSeconds * 1000); // Use idleTimeSeconds
    }
    clearIdleTimer() {
        if (this.idleTimer !== null) {
            window.clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }
    startFlashing() {
        // Do not flash if the window is not visible or if already flashing
        if (this.isFlashing || document.hidden) {
            return;
        }
        this.isFlashing = true;
        this.flashCount = 0; // Reset flash count
        this.flashLoop();
    }
    flashLoop() {
        if (!this.isFlashing)
            return;
        if (this.settings.flashCycles !== 0 && this.flashCount >= this.settings.flashCycles) {
            this.stopFlashing();
            return;
        }
        const flashElements = (addClass) => {
            const action = addClass ? 'addClass' : 'removeClass';
            if (this.settings.flashViewContent) {
                // Target the active editor view content specifically
                const activeEditorContent = this.app.workspace.activeLeaf?.view.containerEl.querySelector('.view-content');
                if (activeEditorContent)
                    activeEditorContent[action]('hey-wake-up-flash-active');
            }
            if (this.settings.flashSidePanes) {
                this.app.workspace.containerEl.querySelectorAll('.workspace-leaf-content').forEach(el => el[action]('hey-wake-up-flash-active'));
            }
            if (this.settings.flashViewHeader) {
                this.app.workspace.containerEl.querySelectorAll('.view-header-title-container').forEach(el => el[action]('hey-wake-up-flash-active'));
            }
            if (this.settings.flashStatusBar) {
                const statusBar = document.body.querySelector('.status-bar');
                if (statusBar)
                    statusBar[action]('hey-wake-up-flash-active');
            }
            if (this.settings.flashRibbon) {
                const ribbon = this.app.workspace.containerEl.querySelector('.workspace-ribbon');
                if (ribbon)
                    ribbon[action]('hey-wake-up-flash-active');
            }
            if (this.settings.flashTitlebar) {
                const titlebar = document.body.querySelector('.titlebar');
                if (titlebar)
                    titlebar[action]('hey-wake-up-flash-active');
            }
        };
        flashElements(true); // Add flash
        this.flashTimer = window.setTimeout(() => {
            flashElements(false); // Remove flash
            this.flashCount++;
            this.flashTimer = window.setTimeout(() => this.flashLoop(), this.settings.flashInterval);
        }, this.settings.flashDuration);
    }
    stopFlashing() {
        if (!this.isFlashing)
            return;
        this.isFlashing = false;
        this.clearFlashTimer();
        // Remove flash from all potentially flashed elements
        const elementsToClear = [
            '.view-content',
            '.workspace-leaf-content',
            '.view-header-title-container',
            '.workspace-ribbon'
        ];
        // Also specifically target the side panes
        this.app.workspace.containerEl.querySelectorAll('.workspace-leaf-content').forEach(el => {
            el.removeClass('hey-wake-up-flash-active');
        });
        elementsToClear.forEach(selector => {
            this.app.workspace.containerEl.querySelectorAll(selector).forEach(el => {
                el.removeClass('hey-wake-up-flash-active');
            });
        });
        const statusBar = document.body.querySelector('.status-bar');
        if (statusBar)
            statusBar.removeClass('hey-wake-up-flash-active');
        const titlebar = document.body.querySelector('.titlebar');
        if (titlebar)
            titlebar.removeClass('hey-wake-up-flash-active');
    }
    clearFlashTimer() {
        if (this.flashTimer !== null) {
            window.clearTimeout(this.flashTimer);
            this.flashTimer = null;
        }
    }
}
exports.default = HeyWakeUpPlugin;
class HeyWakeUpSettingTab extends obsidian_1.PluginSettingTab {
    plugin;
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h3', { text: 'Color and durations' });
        new obsidian_1.Setting(containerEl)
            .setName('Flash color')
            .setDesc('Choose the color for the flashing effect. Default is red.')
            .addColorPicker(colorPicker => colorPicker
            .setValue(this.plugin.settings.flashColor)
            .onChange(async (value) => {
            this.plugin.settings.flashColor = value;
            await this.plugin.saveSettings();
        }));
        new obsidian_1.Setting(containerEl)
            .setName('Flash duration')
            .setDesc('How long the flash color stays visible (in milliseconds). Higher values mean longer flashes.')
            .addText(text => text
            .setPlaceholder('500')
            .setValue(this.plugin.settings.flashDuration.toString())
            .onChange(async (value) => {
            const numValue = parseInt(value);
            if (!isNaN(numValue) && numValue >= 0) {
                this.plugin.settings.flashDuration = numValue;
                await this.plugin.saveSettings();
            }
            else {
                console.warn('Invalid Flash Duration value. Please enter a non-negative number.');
            }
        }));
        new obsidian_1.Setting(containerEl)
            .setName('Flash interval')
            .setDesc('The time between flashes (in milliseconds). Higher values mean slower flashing.')
            .addText(text => text
            .setPlaceholder('500')
            .setValue(this.plugin.settings.flashInterval.toString())
            .onChange(async (value) => {
            const numValue = parseInt(value);
            if (!isNaN(numValue) && numValue >= 0) {
                this.plugin.settings.flashInterval = numValue;
                await this.plugin.saveSettings();
            }
            else {
                console.warn('Invalid Flash Interval value. Please enter a non-negative number.');
            }
        }));
        new obsidian_1.Setting(containerEl)
            .setName('Flash cycles')
            .setDesc('Number of times the screen will flash. Set to 0 for infinite flashes.')
            .addText(text => text
            .setPlaceholder('0')
            .setValue(this.plugin.settings.flashCycles.toString())
            .onChange(async (value) => {
            const numValue = parseInt(value);
            if (!isNaN(numValue) && numValue >= 0) {
                this.plugin.settings.flashCycles = numValue;
                await this.plugin.saveSettings();
            }
            else {
                console.warn('Invalid Flash Cycles value. Please enter a non-negative number.');
            }
        }));
        new obsidian_1.Setting(containerEl)
            .setName('Idle time')
            .setDesc('Time in seconds before the flashing starts.')
            .addText(text => text
            .setPlaceholder('30')
            .setValue(this.plugin.settings.idleTimeSeconds.toString())
            .onChange(async (value) => {
            const numValue = parseInt(value);
            if (!isNaN(numValue) && numValue >= 0) {
                this.plugin.settings.idleTimeSeconds = numValue;
                await this.plugin.saveSettings();
            }
            else {
                console.warn('Invalid Idle Time value. Please enter a non-negative number.');
            }
        }));
        containerEl.createEl('h3', { text: 'UI elements to flash' });
        new obsidian_1.Setting(containerEl)
            .setName('Flash main content area')
            .setDesc('Flashes the primary content area of the active view.')
            .addToggle(toggle => {
            toggle
                .setValue(this.plugin.settings.flashViewContent)
                .onChange(async (value) => {
                this.plugin.settings.flashViewContent = value;
                await this.plugin.saveSettings();
            });
        });
        new obsidian_1.Setting(containerEl)
            .setName('Flash side panes')
            .setDesc('Flashes the content of both left and right side panels.')
            .addToggle(toggle => {
            toggle
                .setValue(this.plugin.settings.flashSidePanes)
                .onChange(async (value) => {
                this.plugin.settings.flashSidePanes = value;
                await this.plugin.saveSettings();
            });
        });
        new obsidian_1.Setting(containerEl)
            .setName('Flash view headers')
            .setDesc('Flashes the title headers of all open views.')
            .addToggle(toggle => {
            toggle
                .setValue(this.plugin.settings.flashViewHeader)
                .onChange(async (value) => {
                this.plugin.settings.flashViewHeader = value;
                await this.plugin.saveSettings();
            });
        });
        new obsidian_1.Setting(containerEl)
            .setName('Flash status bar')
            .setDesc('Flashes the status bar at the bottom.')
            .addToggle(toggle => {
            toggle
                .setValue(this.plugin.settings.flashStatusBar)
                .onChange(async (value) => {
                this.plugin.settings.flashStatusBar = value;
                await this.plugin.saveSettings();
            });
        });
        new obsidian_1.Setting(containerEl)
            .setName('Flash workspace ribbon')
            .setDesc('Flashes the action ribbon on the very left.')
            .addToggle(toggle => {
            toggle
                .setValue(this.plugin.settings.flashRibbon)
                .onChange(async (value) => {
                this.plugin.settings.flashRibbon = value;
                await this.plugin.saveSettings();
            });
        });
        new obsidian_1.Setting(containerEl)
            .setName('Flash titlebar')
            .setDesc('Flashes the titlebar of the Obsidian window.')
            .addToggle(toggle => {
            toggle
                .setValue(this.plugin.settings.flashTitlebar)
                .onChange(async (value) => {
                this.plugin.settings.flashTitlebar = value;
                await this.plugin.saveSettings();
            });
        });
    }
}
//# sourceMappingURL=main.js.map
