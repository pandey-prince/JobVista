import multer from "multer";
const storage = numter.memoryStorage();

export const singleUpload = multer({ storage }).single("file");
