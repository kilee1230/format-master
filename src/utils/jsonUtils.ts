/**
 * formatting options
 */
const INDENT_SPACE = 2;

export const isValidJson = (input: string): boolean => {
  try {
    JSON.parse(input);
    return true;
  } catch (e) {
    return false;
  }
};

export const formatJson = (input: string): string => {
  try {
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed, null, INDENT_SPACE);
  } catch (e) {
    throw new Error((e as Error).message);
  }
};

export const minifyJson = (input: string): string => {
  try {
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed);
  } catch (e) {
    throw new Error((e as Error).message);
  }
};
