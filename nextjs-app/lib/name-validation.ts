// Regular expression to match valid file/folder/vault names
// Allows letters, numbers, spaces, hyphens, and underscores
const VALID_NAME_REGEX = /^[a-zA-Z0-9\s\-_.]+$/;

export const isValidName = (name: string): boolean => {
    return VALID_NAME_REGEX.test(name);
};

export const getInvalidNameMessage = (
    type: "file" | "folder" | "vault"
): string => {
    return `${
        type.charAt(0).toUpperCase() + type.slice(1)
    } names can only contain letters, numbers, spaces, hyphens, and underscores.`;
};
