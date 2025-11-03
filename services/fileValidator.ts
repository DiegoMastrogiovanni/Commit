interface ValidationResult {
  validFiles: File[];
  errors: { fileName: string; reason: string }[];
}

/**
 * Validates files upon selection. It checks for .csv, .xlsx, and .xls file extensions
 * and also discards files that are 0 bytes in size.
 * Encoding checks are deferred to the parsing stage.
 * @param files The list of files selected by the user.
 * @returns A promise that resolves to an object containing valid files and any errors.
 */
export const validateFiles = async (files: FileList): Promise<ValidationResult> => {
  const validFiles: File[] = [];
  const errors: { fileName: string; reason: string }[] = [];
  const fileArray = Array.from(files);

  for (const file of fileArray) {
    const lowerCaseName = file.name.toLowerCase();
    if (!lowerCaseName.endsWith('.csv') && !lowerCaseName.endsWith('.xlsx') && !lowerCaseName.endsWith('.xls')) {
      errors.push({ fileName: file.name, reason: 'File is not a supported type (.csv, .xlsx, .xls).' });
    } else if (file.size === 0) {
      errors.push({ fileName: file.name, reason: 'File is empty (0 bytes) and was discarded.' });
    } else {
      validFiles.push(file);
    }
  }

  return Promise.resolve({ validFiles, errors });
};