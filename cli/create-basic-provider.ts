#!/usr/bin/env ts-node
// @ts-nocheck
import prompts from "prompts";
import fs from "fs";
import _ from "lodash";

const PATH_TO_ADAPTERS = `${__dirname}/../src/adapters`;

class Service {
    chain?: string;
    contract?: string;
    block?: number;
    existingBasicProviders: string[];

    private getExistingBasicProvidersList = async (): Promise<string[]> => {
        return await fs.promises.readdir(PATH_TO_ADAPTERS);
    }

    private promptSelectBasicProvider = async () => {
        const choices = this.existingBasicProviders.map(bp => ({
            title: bp,
            value: bp
        }));

        const response = await prompts(
            [
                {
                    type: 'select',
                    name: 'basic-provider-name',
                    message: 'Choose basic provider:',
                    choices: [
                        {title: 'Create new basic provider', value: 'create-new-basic-provider'},
                        ...choices
                    ],
                }
            ]
        );

        return response["basic-provider-name"];
    }

    private promptNewBasicProviderName = async () => {
        const validatePrompt = (value: string) => {
            if (!value || value.length < 3) {
                return "Name is too short. Minimum length is 3 characters."
            }

            if (!value[0].match(/[a-zA-Z]/i)) {
                return "Name must start with a letter.";
            }

            if (this.existingBasicProviders.includes(value)) {
                return "Basic provider with a given name already exists.";
            }

            return true;
        }

        const response = await prompts(
            [
                {
                    type: 'text',
                    name: 'basic-provider-name',
                    message: 'Enter name for new basic provider:',
                    validate: validatePrompt
                }
            ]
        );

        return response["basic-provider-name"];
    }

    private promptEventsList = async () => {
        const validatePrompt = (value: string) => {
            if (!value || !value.trim().length) {
                return "Value is invalid."
            }

            const list = _.uniq(value.trim().split(','));

            for (let i = 0; i < list.length; i++) {
                if (!list[i].trim().length || !list[i].match(/^[a-zA-Z0-9]*$/)) {
                    return `Invalid event name. Index "${i}". Value "${list[i]}"`;
                }
            }

            return true;
        }

        const response = await prompts(
            [
                {
                    type: 'text',
                    name: 'events-list',
                    message: 'Enter list of events to track (comma-separated):',
                    validate: validatePrompt
                }
            ]
        );

        return _.uniq(response["events-list"].trim().split(','));
    }

    private createProviderFromTemplate = async (providerName: string, events: string) => {
        const template = await fs.promises.readFile(`${__dirname}/adapters-templates/evm.txt`);

        const providerNameInPascal = _.startCase(_.camelCase(providerName.replace(/-/g, ' '))).replace(/ /g, '');

        const updatedTemplate = template
            .toString()
            .replace(/#PROVIDER_NAME#/g, providerNameInPascal)
            .replace('#EVENTS_NAMES#', events.map(e => `"${e}"`).join(', '));

        await fs.promises.mkdir(`${PATH_TO_ADAPTERS}/${providerName}`);
        await fs.promises.writeFile(
            `${PATH_TO_ADAPTERS}/${providerName}/index.ts`,
            updatedTemplate,
            {
                recursive: true
            }
        );
    }

    run = async () => {
        this.existingBasicProviders = await this.getExistingBasicProvidersList();
        const bpName = await this.promptSelectBasicProvider();

        if (bpName === "create-new-basic-provider") {
            console.log('Create new provider');
            const newBpName = await this.promptNewBasicProviderName();
            const events = await this.promptEventsList();
            await this.createProviderFromTemplate(newBpName, events);
            console.log(`Basic provider "${newBpName}" was created successfully.`);
        } else {
            console.log(bpName);
        }

        process.exit()
    }
}

(async () => {
    await (new Service()).run();
    process.exit()
})();