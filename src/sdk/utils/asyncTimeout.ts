export default async (seconds = 10): Promise<void> => {
    return new Promise(r => setTimeout(r, 1000 * seconds));
};
