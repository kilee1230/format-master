import { parse, stringify } from "smol-toml";

export const isValidToml = (input: string): boolean => {
  try {
    parse(input);
    return true;
  } catch (e) {
    return false;
  }
};

export const formatToml = (input: string): string => {
  try {
    const obj = parse(input);
    return stringify(obj);
  } catch (e) {
    throw new Error((e as Error).message);
  }
};

export const minifyToml = (input: string): string => {
  // TOML is line-based and difficult to "minify" in the traditional sense
  // (stripping whitespace) without breaking syntax or readability significantly.
  // Standard practice is to just ensure it is valid and formatted cleanly.
  // We will return the formatted version to ensure consistency.
  return formatToml(input);
};

export const tomlToJson = (input: string): any => {
  try {
    return parse(input);
  } catch (e) {
    return null;
  }
};
