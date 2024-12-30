// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { Router } from 'express'
import multer from 'multer'

const router = Router()

const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), (req: Request, res: Response) => {
    console.log('Upload', req?.file);
    const fileUrl = `http://localhost:${process.env.PORT}/uploads/${req?.file?.filename}`;
    res.json({ fileUrl });
});

export default router
