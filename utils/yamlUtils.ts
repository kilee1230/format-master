import yaml from 'js-yaml';

export const isValidYaml = (input: string): boolean => {
  try {
    yaml.load(input);
    return true;
  } catch (e) {
    return false;
  }
};

export const formatYaml = (input: string): string => {
  try {
    const obj = yaml.load(input);
    return yaml.dump(obj, { indent: 2 });
  } catch (e) {
    throw new Error((e as Error).message);
  }
};

export const minifyYaml = (input: string): string => {
  try {
    const obj = yaml.load(input);
    // YAML doesn't really "minify" like JSON, but we can dump it with flow style
    return yaml.dump(obj, { flowLevel: 0, indent: 0 }).replace(/\n/g, ' '); 
  } catch (e) {
    throw new Error((e as Error).message);
  }
};

export const yamlToJson = (input: string): any => {
  try {
    return yaml.load(input);
  } catch (e) {
    return null;
  }
};