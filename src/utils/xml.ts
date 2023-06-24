import { xml2js } from 'xml-js';

export function parseXml(xmlString: string): any {
    const options = {
        ignoreComment: true,
        alwaysChildren: true,
        compact: true,
        nativeType: true,
    };

    return xml2js(xmlString, options);
}

export interface FlowDefinition {
    _declaration: any
    'flow-definition': {
        actions: any
        description: string
        keepDependencies: boolean
        properties: any
        definition: CpsFlowDefinition
        triggers: any
        disabled: {
            _text: boolean
        }
    }
}

export interface CpsFlowDefinition {
    _attributes: {
        _class: string
        _plugin: string
    }
    script: {
        _text: string
    }
    sandbox: boolean
}