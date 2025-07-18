# Description
This plugin flashes certain [Obsidian](https://github.com/obsidianmd)'s elements after you have been idle for some time to alert you, so you can start focusing on work again.

It works on computer and mobile
# Installation
## Manual
1. Go to the [latest release page](https://github.com/ALE-ARME/Hey-Wake-Up/releases/latest)
2. Download `main.js` and `manifest.js`
3. Go to `YourVaultName/.obsidian/plugins`
4. Create a folder named `hey-wake-up`
5. Put `main.js` and `manifest.js` in the `hey-wake-up` folder
6. Go to `Obsidian's Community Plugins` tab in Obsidian's settings and reload the plugins list
7. Enable the plugin
## From Community Plugins Tab
It's not available there currently
# Configuration
After enabling the plugin you can modify its settings:
- Flash color: using a color picker. From mobile the color picker is made of 3 bars where you need to move their cursor to the right side to see the rainbw of colors, then adjust the cursors to the color you like
- Flash duration: how long the `flash color` will stay visible
- Flash interval: the time between two flashes
- Flash cycles: how many times the active note will flash
- Idle time: how many seconds have to pass before the active note will start flashing
- Toggable buttons: toggle on the Obsidian's elements you want to make them flash

A `data.json` file will be created containing the values of the above parameters
# Uninstallation
1. Disable the plugin
2. Go to `YourVaultName/.obsidian/plugins`
3. Delete the folder `hey-wake-up`
# Disclaimer
- This plugin was made by `gemini-2.5-flash-preview-5-20` through [gemini-cli](https://github.com/google-gemini/gemini-cli) on [Termux](https://github.com/termux/termux-app)
- If you face any problem open an issue (i don't guarantee i'll be able to fix it, but atleast other people can see what issues the plugin has before installing it)
