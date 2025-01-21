import type moment from "moment";

declare global {
	interface Window {
		moment: typeof moment;
	}
}

import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'dated-next-file',
			name: 'Go to next file',
			editorCallback: (_, ctx: MarkdownView) => {
				const dateFormat = "YY-MM-DD";
				const activeFile = ctx.app.workspace.getActiveFile()!;

				const targetDate = window.moment(activeFile.basename, dateFormat).toDate();

				// Searching for the next largest date
				let largerDate = null;
				let largerFile = null;

				for (const currentFile of activeFile.parent!.children)
				{
					// Only sort other markdown files
					/* @ts-ignore */
					if (currentFile.extension !== "md") continue;
					/* @ts-ignore */
					if (currentFile.basename === activeFile.basename) continue;

					/* @ts-ignore */
					const currentDate = window.moment(currentFile.basename, dateFormat).toDate();

					if ( currentDate > targetDate &&
						(!largerDate || currentDate < largerDate) 
					) { largerDate = currentDate; largerFile = currentFile; }
				}

				if (!largerFile) return new Notice('No next file!')
				
				/* @ts-ignore */
				ctx.app.workspace.activeLeaf.openFile(largerFile)
			},
		});

		this.addCommand({
			id: 'dated-prev-file',
			name: 'Go to previous file',
			editorCallback: (_, ctx: MarkdownView) => {
				const dateFormat = "YY-MM-DD";
				const activeFile = ctx.app.workspace.getActiveFile()!;

				const targetDate = window.moment(activeFile.basename, dateFormat).toDate();

				// Searching for the next largest date
				let smallerDate = null;
				let smallerFile = null;

				for (const currentFile of activeFile.parent!.children)
				{
					// Only sort other markdown files
					/* @ts-ignore */
					if (currentFile.extension !== "md") continue;
					/* @ts-ignore */
					if (currentFile.basename === activeFile.basename) continue;

					/* @ts-ignore */
					const currentDate = window.moment(currentFile.basename, dateFormat).toDate();

					if ( currentDate < targetDate &&
						(!smallerDate || currentDate > smallerDate) 
					) { smallerDate = currentDate; smallerFile = currentFile; }
				}

				if (!smallerFile) return new Notice('No previous file!')
				
				/* @ts-ignore */
				ctx.app.workspace.activeLeaf.openFile(smallerFile)
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
