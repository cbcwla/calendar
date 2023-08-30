export const generateRandomColor = () => {
  return `#${Math.random().toString(16).substring(2, 8)}`;
};
