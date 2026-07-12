import multer from "multer";
const storage = multer.memoryStorage();

export const singleUpload = multer({ storage }).single("file");

export const upload = multer({ storage: multer.memoryStorage() });

/** Parse multipart/form-data fields without expecting a file upload */
export const parseMultipartFields = upload.none();