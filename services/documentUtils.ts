import mammoth from 'mammoth';

export const parseDocument = async (file: File): Promise<string> => {
  const name = file.name.toLowerCase();
  
  try {
    if (name.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } else if (name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.json') || name.endsWith('.js') || name.endsWith('.ts')) {
      return await file.text();
    } else if (name.endsWith('.doc')) {
      throw new Error("Legacy .doc binary format is not supported. Please save as .docx and upload again.");
    } else {
      throw new Error(`Unsupported file type: ${name}. Please upload .docx or text files.`);
    }
  } catch (error) {
    console.error("Document Parsing Error:", error);
    throw error;
  }
};