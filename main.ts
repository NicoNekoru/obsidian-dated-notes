import type moment from "moment";

declare global {
	interface Window {
		moment: typeof moment;
	}
}

import { App, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';


interface DatedSettings {
	dateFormat: string;
}

const DEFAULT_SETTINGS: DatedSettings = {
	dateFormat: 'YY-MM-DD'
}

export default class DatedPlugin extends Plugin {
	settings: DatedSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'dated-create-file',
			name: 'Create new file',
			callback: async () => {
				const activeFile = this.app.workspace.getActiveFile();
				let fileRoot = ''

				/* @ts-ignore */
				if (!activeFile?.parent) { fileRoot = this.app.vault.adapter.basePath; }
				else { fileRoot = activeFile.parent.path; }

				const fileName = window.moment().format(this.settings.dateFormat);
				const filePath = fileRoot + '/' + fileName + '.md';
				let fileFile = this.app.vault.getFileByPath(filePath);

				if (fileFile) new Notice('File already exists')
				else fileFile = await this.app.vault.create(filePath, '');

				/* @ts-ignore */
				this.app.workspace.activeLeaf.openFile(fileFile)
			}
		})

		this.addCommand({
			id: 'dated-next-file',
			name: 'Go to next file',
			editorCallback: (_, ctx: MarkdownView) => {
				const activeFile = ctx.app.workspace.getActiveFile()!;

				const targetDate = window.moment(activeFile.basename, this.settings.dateFormat).toDate();

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
					const currentDate = window.moment(currentFile.basename, this.settings.dateFormat).toDate();

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
				const activeFile = ctx.app.workspace.getActiveFile()!;

				const targetDate = window.moment(activeFile.basename, this.settings.dateFormat).toDate();

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
					const currentDate = window.moment(currentFile.basename, this.settings.dateFormat).toDate();

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
		this.addSettingTab(new DatedSettingsTab(this.app, this));
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

class DatedSettingsTab extends PluginSettingTab {
	plugin: DatedPlugin;

	constructor(app: App, plugin: DatedPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Date Format')
			.setDesc('Filename format')
			.addText(text => text
				.setPlaceholder('YY-MM-DD')
				.setValue(this.plugin.settings.dateFormat)
				.onChange(async (value) => {
					this.plugin.settings.dateFormat = value;
					await this.plugin.saveSettings();
				}));
	}
}
